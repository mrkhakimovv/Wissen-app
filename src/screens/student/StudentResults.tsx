import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Result, TestResult, Test } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { clsx } from 'clsx';
import { format, parseISO } from 'date-fns';

export default function StudentResults() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'kunlik' | 'oylik' | 'test'>('kunlik');
  
  const [dailyResults, setDailyResults] = useState<Result[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string, avg: number }[]>([]);
  const [testResults, setTestResults] = useState<(TestResult & { title?: string })[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchResults = async () => {
      // Fetch daily & monthly normal results
      const resQuery = query(collection(db, 'results'), where('userId', '==', user.id));
      const resSnap = await getDocs(resQuery);
      
      const daily: Result[] = [];
      const monthMap: Record<string, { total: number, count: number }> = {};
      
      resSnap.docs.forEach(d => {
        const item = { id: d.id, ...d.data() } as Result;
        if (item.type === 'daily' || item.type === 'test') { // test might go here if manually entered
          daily.push(item);
        }
        
        // Group by month for chart (assuming daily results also contribute to monthly average)
        if (item.score !== undefined) {
          const m = item.date.substring(0, 7); // YYYY-MM
          const percentage = (item.score / item.maxScore) * 100;
          if (!monthMap[m]) monthMap[m] = { total: 0, count: 0 };
          monthMap[m].total += percentage;
          monthMap[m].count += 1;
        }
      });
      
      daily.sort((a,b) => b.date.localeCompare(a.date));
      setDailyResults(daily);

      const mData = Object.keys(monthMap).sort().map(k => ({
        month: k,
        avg: Math.round(monthMap[k].total / monthMap[k].count)
      }));
      setMonthlyData(mData);

      // Fetch online test results
      const tQuery = query(collection(db, 'test_results'), where('userId', '==', user.id));
      const tSnap = await getDocs(tQuery);
      let tests = tSnap.docs.map(d => ({ id: d.id, ...d.data() } as TestResult & { title?: string }));
      
      // Optionally fetch test titles
      if (tests.length > 0) {
        // Just fetch all tests to map title for simplicity in this demo
        const allTests = await getDocs(collection(db, 'tests'));
        const testMap = new Map<string, string>();
        allTests.docs.forEach(d => testMap.set(d.id, d.data().title));
        tests = tests.map(t => ({ ...t, title: testMap.get(t.testId) || 'Noma\'lum Test' }));
      }
      
      tests.sort((a,b) => b.submittedAt - a.submittedAt);
      setTestResults(tests);
    };

    fetchResults();
  }, [user]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Natijalar</h1>
      
      {/* Sub Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          className={clsx("flex-1 py-1.5 text-sm font-medium rounded-lg", activeTab === 'kunlik' ? 'bg-white shadow text-[#fec204]' : 'text-gray-500')}
          onClick={() => setActiveTab('kunlik')}
        >
          Kunlik
        </button>
        <button
          className={clsx("flex-1 py-1.5 text-sm font-medium rounded-lg", activeTab === 'oylik' ? 'bg-white shadow text-[#fec204]' : 'text-gray-500')}
          onClick={() => setActiveTab('oylik')}
        >
          Oylik
        </button>
        <button
          className={clsx("flex-1 py-1.5 text-sm font-medium rounded-lg", activeTab === 'test' ? 'bg-white shadow text-[#fec204]' : 'text-gray-500')}
          onClick={() => setActiveTab('test')}
        >
          Testlar
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'kunlik' && (
          <div className="space-y-3">
            {dailyResults.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">{r.date}</div>
                  <div className="font-semibold text-gray-800">{r.subject}</div>
                  {r.note && <div className="text-xs text-gray-500 mt-1 italic">{r.note}</div>}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-[#fec204]">{r.score}</span>
                  <span className="text-sm font-medium text-gray-400">/{r.maxScore}</span>
                </div>
              </div>
            ))}
            {dailyResults.length === 0 && <p className="text-center text-gray-500 py-10">Ma'lumot topilmadi</p>}
          </div>
        )}

        {activeTab === 'oylik' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="avg" fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            {monthlyData.length === 0 && <p className="text-center text-gray-500 absolute w-full top-1/2 left-0">Ma'lumot topilmadi</p>}
          </div>
        )}

        {activeTab === 'test' && (
          <div className="space-y-3">
            {testResults.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">{new Date(t.submittedAt).toLocaleDateString()}</div>
                  <div className="font-semibold text-gray-800">{t.title}</div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-purple-600">{t.score}</span>
                  <span className="text-sm font-medium text-gray-400">/{t.totalQuestions}</span>
                </div>
              </div>
            ))}
            {testResults.length === 0 && <p className="text-center text-gray-500 py-10">Test natijalari topilmadi</p>}
          </div>
        )}
      </div>
    </div>
  );
}
