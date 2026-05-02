import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { CalendarCheck, CreditCard, CheckCircle, GraduationCap, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { Group, Attendance, Payment, TestResult } from '../../types';

export default function StudentHome() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [lastTest, setLastTest] = useState<TestResult | null>(null);

  useEffect(() => {
    if (!user) return;
    
    // Fetch group(s)
    const fetchGroups = async () => {
      const fetched: Group[] = [];
      const ids = user.groupIds?.length ? user.groupIds : (user.groupId ? [user.groupId] : []);
      for (const id of ids) {
        const d = await getDoc(doc(db, 'groups', id));
        if (d.exists()) fetched.push({ id: d.id, ...d.data() } as Group);
      }
      setGroups(fetched);
    };
    fetchGroups();

    // Fetch attendance
    const attnQuery = query(collection(db, 'attendance'), where('userId', '==', user.id));
    getDocs(attnQuery).then(snap => {
      setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() } as Attendance)));
    });

    // Fetch this month's payment
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const payQuery = query(collection(db, 'payments'), where('userId', '==', user.id), where('month', '==', currentMonth));
    getDocs(payQuery).then(snap => {
      if (!snap.empty) {
        setPayment({ id: snap.docs[0].id, ...snap.docs[0].data() } as Payment);
      }
    });

    // Fetch last test result
    const testQuery = query(collection(db, 'test_results'), where('userId', '==', user.id));
    getDocs(testQuery).then(snap => {
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as TestResult));
      results.sort((a,b) => b.submittedAt - a.submittedAt);
      if (results.length > 0) setLastTest(results[0]);
    });

  }, [user]);

  if (!user) return null;

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = attendance.length === 0 ? 0 : Math.round((presentCount / attendance.length) * 100);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-end mb-2">
        <button 
          onClick={logout} 
          className="flex items-center space-x-1 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
          title="Tizimdan chiqish"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium hidden sm:inline">Chiqish</span>
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="bg-[#fec204]/10 p-3 rounded-full">
          <GraduationCap className="text-[#fec204]" size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.fullName}</h2>
          <p className="text-gray-500 text-sm">{groups.length > 0 ? groups.map(g => g.name).join(', ') : 'Guruh biriktirilmagan'}</p>
          <p className="text-xs text-gray-400 mt-1">A'zo bo'ldi: {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Attendance Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <CalendarCheck size={18} className="text-[#fec204]" />
            <span className="text-xs font-semibold uppercase tracking-wider">Davomat</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{attendanceRate}%</div>
            <div className="text-xs text-gray-500">{presentCount} keldi / {attendance.length} dars</div>
          </div>
        </div>

        {/* Payment Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <CreditCard size={18} className={payment?.status === 'debt' ? 'text-red-500' : 'text-blue-500'} />
            <span className="text-xs font-semibold uppercase tracking-wider">To'lov</span>
          </div>
          <div>
            <div className={clsx("text-lg font-bold", 
              payment?.status === 'paid' ? 'text-green-600' : 
              payment?.status === 'debt' ? 'text-red-600' : 'text-gray-500'
            )}>
              {payment?.status === 'paid' ? "To'langan" : payment?.status === 'debt' ? "Qarzdorlik" : "Kutilmoqda"}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Joriy oy uchun</div>
          </div>
        </div>
      </div>

      {/* Last Test Score */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 text-gray-600 mb-3">
          <CheckCircle size={18} className="text-purple-500" />
          <span className="text-sm font-semibold uppercase tracking-wider">So'nggi test natijasi</span>
        </div>
        {lastTest ? (
          <div>
            <div className="flex items-end space-x-1">
              <span className="text-3xl font-bold text-gray-900">{lastTest.score}</span>
              <span className="text-gray-500 mb-1">/ {lastTest.totalQuestions}</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full" 
                style={{ width: `${(lastTest.score / lastTest.totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Hali test ishlanmagan</div>
        )}
      </div>

    </div>
  );
}
