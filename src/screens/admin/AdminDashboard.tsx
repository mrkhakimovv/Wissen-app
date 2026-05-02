import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Users, CalendarCheck, CreditCard, LogOut, CheckCircle, Layers, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ 
    totalStudents: 0, 
    presentToday: 0, 
    totalAttn: 0, 
    unpaidThisMonth: 0,
    paidThisMonth: 0,
    totalGroups: 0,
    totalTests: 0 
  });

  useEffect(() => {
    if (!user) return;
    
    const fetchStats = async () => {
      // Groups
      const gSnap = await getDocs(collection(db, 'groups'));
      const activeGroups = gSnap.docs.filter(d => !d.data()?.isArchived);
      const activeGroupIds = activeGroups.map(d => d.id);
      const totalGroups = activeGroups.length;

      // Students
      const sQuery = query(collection(db, 'users'), where('role', '==', 'student'));
      const sSnap = await getDocs(sQuery);
      const activeStudents = sSnap.docs.filter(d => {
        const u = d.data();
        if (u.groupIds && u.groupIds.length > 0) {
          return u.groupIds.some((id: string) => activeGroupIds.includes(id));
        }
        return activeGroupIds.includes(u.groupId);
      });
      const activeStudentIds = activeStudents.map(d => d.id);
      const totalStudents = activeStudents.length;

      // Attendance today
      const today = format(new Date(), 'yyyy-MM-dd');
      const aQuery = query(collection(db, 'attendance'), where('date', '==', today));
      const aSnap = await getDocs(aQuery);
      const activeAttnDocs = aSnap.docs.filter(d => activeGroupIds.includes(d.data().groupId));
      const presentToday = activeAttnDocs.filter(d => d.data().status === 'present').length;
      const totalAttn = activeAttnDocs.length;

      // Unpaid
      const currentMonth = format(new Date(), 'yyyy-MM');
      const pQuery = query(collection(db, 'payments'), where('month', '==', currentMonth), where('status', '==', 'debt'));
      const pSnap = await getDocs(pQuery);
      const unpaidThisMonth = pSnap.docs.filter(d => activeStudentIds.includes(d.data().userId)).length;

      // Paid
      const paidQuery = query(collection(db, 'payments'), where('month', '==', currentMonth), where('status', '==', 'paid'));
      const paidSnap = await getDocs(paidQuery);
      const paidThisMonth = paidSnap.docs.filter(d => activeStudentIds.includes(d.data().userId)).length;

      // Tests
      const tSnap = await getDocs(collection(db, 'tests'));
      const activeTests = tSnap.docs.filter(d => activeGroupIds.includes(d.data().groupId));
      const totalTests = activeTests.length;

      setStats({ 
        totalStudents, 
        presentToday, 
        totalAttn, 
        unpaidThisMonth,
        paidThisMonth,
        totalGroups,
        totalTests
      });
    };

    fetchStats();
  }, [user]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boshqaruv Paneli</h1>
          <p className="text-sm text-gray-500">Xush kelibsiz, Admin</p>
        </div>
        <button 
          onClick={logout} 
          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
          title="Tizimdan chiqish"
        >
          <LogOut size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-6">
        <div className="col-span-2 bg-[#fec204] rounded-2xl p-5 text-black shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-black/80 text-sm font-medium">Jami o'quvchilar</p>
              <h2 className="text-4xl font-bold mt-1">{stats.totalStudents}</h2>
            </div>
            <div className="bg-black/10 p-3 rounded-full">
              <Users size={32} className="text-black" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-500 mb-4">
            <CalendarCheck size={18} className="text-[#fec204]" />
            <span className="text-xs font-semibold uppercase">Bugun Keldi</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900">{stats.presentToday}</span>
            <span className="text-sm font-medium text-gray-500 mx-1">/</span>
            <span className="text-sm font-medium text-gray-500">{stats.totalAttn || stats.totalStudents}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-500 mb-4">
            <CreditCard size={18} className="text-red-500" />
            <span className="text-xs font-semibold uppercase">Qarzdorlar</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-red-500">{stats.unpaidThisMonth}</span>
            <span className="text-xs text-gray-400 block mt-0.5">Shu oy bo'yicha</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-500 mb-4">
            <CheckCircle size={18} className="text-green-500" />
            <span className="text-xs font-semibold uppercase">Oy To'lov</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-green-500">{stats.paidThisMonth}</span>
            <span className="text-xs text-gray-400 block mt-0.5">To'laganlar</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-500 mb-4">
            <Layers size={18} className="text-[#e3a602]" />
            <span className="text-xs font-semibold uppercase">Guruhlar</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900">{stats.totalGroups}</span>
            <span className="text-xs text-gray-400 block mt-0.5">Jami guruhlar</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-500 mb-4">
            <FileText size={18} className="text-blue-500" />
            <span className="text-xs font-semibold uppercase">Testlar</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-gray-900">{stats.totalTests}</span>
            <span className="text-xs text-gray-400 block mt-0.5">Tizimdagi testlar</span>
          </div>
        </div>
      </div>

    </div>
  );
}
