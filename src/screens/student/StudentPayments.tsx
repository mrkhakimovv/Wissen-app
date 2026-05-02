import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Payment } from '../../types';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export default function StudentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchPayments = async () => {
      const q = query(collection(db, 'payments'), where('userId', '==', user.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
      // Sort in descending order
      data.sort((a,b) => b.month.localeCompare(a.month));
      setPayments(data);
    };

    fetchPayments();
  }, [user]);

  const StatusIcon = ({ status }: { status: Payment['status'] }) => {
    switch (status) {
      case 'paid': return <CheckCircle2 className="text-green-500" size={24} />;
      case 'debt': return <XCircle className="text-red-500" size={24} />;
      default: return <AlertCircle className="text-gray-400" size={24} />;
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">To'lovlar tarixi</h1>
      
      <div className="space-y-3">
        {payments.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={clsx(
                "p-2 rounded-full",
                p.status === 'paid' ? "bg-green-50" : p.status === 'debt' ? "bg-red-50" : "bg-gray-50"
              )}>
                <StatusIcon status={p.status} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{p.month}</h3>
                <p className="text-sm font-medium text-gray-900">{p.amount.toLocaleString()} so'm</p>
              </div>
            </div>
            <div className="text-right">
              <span className={clsx(
                "text-xs font-semibold px-2.5 py-1 rounded-full",
                p.status === 'paid' ? "bg-green-100 text-green-700" : 
                p.status === 'debt' ? "bg-red-100 text-red-700" : 
                "bg-gray-100 text-gray-600"
              )}>
                {p.status === 'paid' ? "To'langan" : p.status === 'debt' ? "Qarzdor" : "Kutilmoqda"}
              </span>
              {p.paidAt && p.status === 'paid' && (
                <div className="text-[10px] text-gray-400 mt-1">{new Date(p.paidAt).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        ))}
        {payments.length === 0 && (
          <div className="text-center text-gray-500 mt-8">To'lovlar mavjud emas</div>
        )}
      </div>
    </div>
  );
}
