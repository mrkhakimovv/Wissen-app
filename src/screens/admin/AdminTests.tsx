import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Group, Test, TestQuestion } from '../../types';
import { useAuth } from '../../lib/auth';
import { PlayCircle, PauseCircle, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export default function AdminTests() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // New test form state
  const [title, setTitle] = useState('');
  const [groupId, setGroupId] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([
    { question: '', options: ['', '', '', ''], correctIndex: 0 }
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDocs(collection(db, 'groups')).then(snap => {
      const activeGroups = snap.docs
        .filter(d => !d.data()?.isArchived)
        .map(d => ({ id: d.id, ...d.data() } as Group));
      setGroups(activeGroups);
    });
    fetchTests();
  }, []);

  const fetchTests = () => {
    getDocs(collection(db, 'tests')).then(snap => {
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() } as Test)).sort((a,b) => b.createdAt - a.createdAt));
    });
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'tests', id), { isActive: !current });
    fetchTests();
  };

  const addQuestion = () => setQuestions([...questions, { question: '', options: ['', '', '', ''], correctIndex: 0 }]);
  
  const removeQuestion = (idx: number) => setQuestions(questions.filter((_, i) => i !== idx));

  const updateQuestion = (idx: number, field: keyof TestQuestion, value: any) => {
    const newQ = [...questions];
    (newQ[idx] as any)[field] = value;
    setQuestions(newQ);
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const newQ = [...questions];
    newQ[qIdx].options[optIdx] = value;
    setQuestions(newQ);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !groupId) return;
    setSaving(true);
    try {
      const data: Omit<Test, 'id'> = {
        title,
        groupId,
        questions,
        createdAt: Date.now(),
        createdBy: user.id,
        isActive: true
      };
      await addDoc(collection(db, 'tests'), data);
      setShowForm(false);
      fetchTests();
      setTitle('');
      setGroupId('');
      setQuestions([{ question: '', options: ['', '', '', ''], correctIndex: 0 }]);
    } catch (err) {
      console.error(err);
      alert('Xatolik');
    } finally {
      setSaving(false);
    }
  };

  if (showForm) {
    return (
      <div className="p-4 bg-white min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Yangi Test Tizish</h1>
          <button onClick={() => setShowForm(false)} className="text-gray-500">Bekor qilish</button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Test Nomi</label>
            <input type="text" required className="w-full border p-3 rounded-lg" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guruh</label>
            <select required className="w-full border p-3 rounded-lg" value={groupId} onChange={e => setGroupId(e.target.value)}>
              <option value="">-- Tanlang --</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="space-y-6">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="p-4 border rounded-xl relative bg-gray-50">
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qIdx)} className="absolute top-3 right-3 text-red-500"><Trash2 size={18}/></button>
                )}
                <label className="block text-sm font-medium mb-1">Savol {qIdx + 1}</label>
                <input type="text" required className="w-full border p-2 mb-3 rounded" value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        name={`opt${qIdx}`} 
                        checked={q.correctIndex === optIdx}
                        onChange={() => updateQuestion(qIdx, 'correctIndex', optIdx)}
                      />
                      <input type="text" placeholder={`Variant ${optIdx+1}`} required className="w-full border p-1 rounded text-sm" value={opt} onChange={e => updateOption(qIdx, optIdx, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-[#fec204] text-[#fec204] font-medium rounded-xl flex justify-center items-center">
            <Plus size={18} className="mr-1"/> Savol qo'shish
          </button>

          <button type="submit" disabled={saving} className="w-full py-4 bg-[#fec204] text-black font-medium rounded-xl">
            {saving ? 'Saqlanmoqda...' : 'Testni Saqlash va Faollashtirish'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Testlar</h1>
        <button onClick={() => setShowForm(true)} className="bg-[#fec204] text-black p-2 rounded-full"><Plus size={20} /></button>
      </div>

      <div className="space-y-3">
        {tests.map(t => (
          <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <div className="font-semibold">{t.title}</div>
              <div className="text-xs text-gray-500 mt-1">{t.questions.length} savol | Sana: {new Date(t.createdAt).toLocaleDateString()}</div>
            </div>
            <button 
              onClick={() => handleToggleActive(t.id, t.isActive)}
              className={clsx("flex flex-col items-center p-2 rounded-lg", t.isActive ? "text-[#fec204]" : "text-gray-400")}
            >
              {t.isActive ? <PlayCircle size={24}/> : <PauseCircle size={24}/>}
              <span className="text-[10px] uppercase font-bold mt-1">{t.isActive ? 'Aktiv' : 'To\'xtatilgan'}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
