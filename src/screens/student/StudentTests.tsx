import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Test, TestResult } from '../../types';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export default function StudentTests() {
  const { user } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [completedTestIds, setCompletedTestIds] = useState<Set<string>>(new Set());
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch group's active tests
    const fetchTests = async () => {
      const gIds = user.groupIds?.length ? user.groupIds : (user.groupId ? [user.groupId] : []);
      if (gIds.length === 0) return;
      
      const tQuery = query(collection(db, 'tests'), where('groupId', 'in', gIds), where('isActive', '==', true));
      const snap = await getDocs(tQuery);
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Test)));

      // Fetch completed test results to not show them again, or show as completed
      const rQuery = query(collection(db, 'test_results'), where('userId', '==', user.id));
      const rSnap = await getDocs(rQuery);
      const completed = new Set<string>();
      rSnap.docs.forEach(d => completed.add(d.data().testId));
      setCompletedTestIds(completed);
    };

    fetchTests();
  }, [user]);

  const startTest = (test: Test) => {
    setActiveTest(test);
    setCurrentQuestionIdx(0);
    setAnswers([]);
    setScore(null);
  };

  const handleAnswer = async (idx: number) => {
    if (!activeTest || !user) return;
    const newAnswers = [...answers, idx];
    
    if (newAnswers.length < activeTest.questions.length) {
      setAnswers(newAnswers);
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else {
      // Finished
      let finalScore = 0;
      activeTest.questions.forEach((q, i) => {
        if (newAnswers[i] === q.correctIndex) finalScore++;
      });
      setScore(finalScore);
      setAnswers(newAnswers);

      // Save to Firebase
      const resultData: Omit<TestResult, 'id'> = {
        testId: activeTest.id,
        userId: user.id,
        score: finalScore,
        totalQuestions: activeTest.questions.length,
        answers: newAnswers,
        submittedAt: Date.now()
      };
      await addDoc(collection(db, 'test_results'), resultData);
      setCompletedTestIds(prev => new Set(prev).add(activeTest.id));
    }
  };

  if (activeTest) {
    if (score !== null) {
      return (
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-24 h-24 bg-[#fec204]/10 rounded-full flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-[#fec204]">{score}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Test Yakunlandi!</h2>
          <p className="text-gray-500 mb-8">Siz qatnashgan test muvaffaqiyatli saqlandi.</p>
          <button 
            onClick={() => setActiveTest(null)}
            className="w-full max-w-xs bg-[#fec204] text-black py-3 rounded-xl font-medium"
          >
            Orqaga qaytish
          </button>
        </div>
      );
    }

    const currentQuestion = activeTest.questions[currentQuestionIdx];
    return (
      <div className="p-4">
        <button onClick={() => setActiveTest(null)} className="flex items-center text-gray-500 mb-6 font-medium">
          <ArrowLeft size={18} className="mr-1" /> Chiqish
        </button>
        
        <div className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
          Savol {currentQuestionIdx + 1} / {activeTest.questions.length}
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-8">{currentQuestion.question}</h2>

        <div className="space-y-3">
          {currentQuestion.options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="w-full p-4 text-left border border-gray-200 rounded-xl hover:border-[#fec204] hover:bg-[#fec204]/5 focus:bg-[#fec204]/10 focus:border-[#fec204] transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Aktiv Testlar</h1>
      
      {tests.length === 0 ? (
        <div className="text-gray-500 text-center mt-10">Sizning guruhingiz uchun aktiv testlar topilmadi.</div>
      ) : (
        <div className="space-y-4">
          {tests.map(t => {
            const isCompleted = completedTestIds.has(t.id);
            return (
              <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">{t.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{t.questions.length} ta savol</p>
                </div>
                {isCompleted ? (
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Bajarilgan</span>
                ) : (
                  <button 
                    onClick={() => startTest(t)}
                    className="flex justify-center items-center w-10 h-10 bg-[#fec204] text-black rounded-full hover:bg-opacity-90"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
