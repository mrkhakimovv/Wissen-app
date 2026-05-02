import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { Group, User, Payment } from '../../types';
import { format, subMonths } from 'date-fns';
import { CheckCircle2, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../lib/auth';

export default function AdminPayments() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  
  const [payments, setPayments] = useState<Record<string, Payment>>({});
  const [saving, setSaving] = useState(false);

  // Generate last 6 months
  const monthsList = Array.from({ length: 6 }).map((_, i) => {
    return format(subMonths(new Date(), i), 'yyyy-MM');
  });

  useEffect(() => {
    getDocs(collection(db, 'groups')).then(snap => {
      const activeGroups = snap.docs
        .filter(d => !d.data()?.isArchived)
        .map(d => ({ id: d.id, ...d.data() } as Group));
      setGroups(activeGroups);
    });
  }, []);

  useEffect(() => {
    if (!selectedGroup) return setStudents([]);
    getDocs(query(collection(db, 'users'), where('groupId', '==', selectedGroup))).then(snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    });
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedStudent) return setPayments({});
    
    getDocs(query(collection(db, 'payments'), where('userId', '==', selectedStudent))).then(snap => {
      const pMap: Record<string, Payment> = {};
      snap.docs.forEach(d => {
        const p = { id: d.id, ...d.data() } as Payment;
        pMap[p.month] = p;
      });
      setPayments(pMap);
    });
  }, [selectedStudent]);

  const handleToggle = async (month: string, status: 'paid' | 'debt') => {
    if (!user || !selectedStudent) return;
    setSaving(true);
    try {
      const pId = `${selectedStudent}_${month}`;
      const existing = payments[month];
      // Toggle logic
      const newStatus = existing?.status === status ? 'pending' : status;

      const studentData = students.find(s => s.id === selectedStudent);
      const defaultAmount = studentData?.monthlyPaymentAmount || 250000;

      const pData: Omit<Payment, 'id'> = {
        userId: selectedStudent,
        month,
        status: newStatus,
        amount: existing?.amount || defaultAmount,
        paidAt: newStatus === 'paid' ? Date.now() : null,
        markedBy: user.id
      };

      await setDoc(doc(db, 'payments', pId), pData);
      
      setPayments(prev => ({ ...prev, [month]: { id: pId, ...pData } }));
    } catch (e) {
      console.error(e);
      alert('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">To'lov Boshqaruvi</h1>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guruh</label>
          <select 
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={selectedGroup}
            onChange={(e) => { setSelectedGroup(e.target.value); setSelectedStudent(''); }}
          >
            <option value="">-- Tanlang --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {selectedGroup && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">O'quvchi</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">-- Tanlang --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Oylar bo'yicha holat</h2>
          {monthsList.map(month => {
            const p = payments[month];
            const status = p?.status || 'pending';
            
            return (
              <div key={month} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="font-semibold text-gray-800">{month}</div>
                <div className="flex space-x-2">
                  <button
                    disabled={saving}
                    onClick={() => handleToggle(month, 'paid')}
                    className={clsx(
                      "px-3 py-1.5 flex items-center rounded-lg text-sm font-medium transition-colors",
                      status === 'paid' ? "bg-green-500 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    <CheckCircle2 size={16} className="mr-1" /> To'landi
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => handleToggle(month, 'debt')}
                    className={clsx(
                      "px-3 py-1.5 flex items-center rounded-lg text-sm font-medium transition-colors",
                      status === 'debt' ? "bg-red-500 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    <XCircle size={16} className="mr-1" /> Qarzdor
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
