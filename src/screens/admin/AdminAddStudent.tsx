import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, setDoc, doc, addDoc, query, where } from 'firebase/firestore';
import { Group, User, Payment } from '../../types';
import { ArrowLeft, CheckCircle, Plus, XCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { format } from 'date-fns';

export default function AdminAddStudent() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [phone, setPhone] = useState('+998');

  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [school, setSchool] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [accessCode, setAccessCode] = useState(Math.floor(100000 + Math.random() * 900000).toString());
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState<number | ''>('');
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number | ''>('');
  
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchGroups = async () => {
    const snap = await getDocs(collection(db, 'groups'));
    const activeGroups = snap.docs
      .filter(d => !d.data()?.isArchived)
      .map(d => ({ id: d.id, ...d.data() } as Group));
    setGroups(activeGroups);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Simple auto-suggest for username
  useEffect(() => {
    if (fullName) {
      const suggested = fullName.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      setUsername(suggested);
    }
  }, [fullName]);

  useEffect(() => {
    if (!username) {
      setIsUsernameAvailable(null);
      return;
    }
    
    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      try {
        const q = query(collection(db, 'users'), where('username', '==', username.trim()));
        const snap = await getDocs(q);
        setIsUsernameAvailable(snap.empty);
      } catch (err) {
        console.error("Error checking username:", err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      const gRef = await addDoc(collection(db, 'groups'), {
        name: newGroupName,
        studentIds: [],
        schedule: 'Belgilanmagan'
      });
      await fetchGroups();
      setGroupIds(prev => [...prev, gRef.id]);
      setNewGroupName('');
      setCreatingGroup(false);
    } catch(e) {
      alert("Guruh yaratishda xatolik");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !phone || groupIds.length === 0) return alert("Barcha majburiy maydonlarni to'ldiring (Guruh ham tanlanishi shart)");
    if (isUsernameAvailable === false) return alert("Ushbu logindan foydalanilgan. Boshqa login kiriting.");
    
    setLoading(true);

    try {
      const newUserRef = doc(collection(db, 'users'));
      
      const finalAccessCode = accessCode.trim() || Math.floor(100000 + Math.random() * 900000).toString();

      const userData: Omit<User, 'id'> = {
        fullName,
        username,
        accessCode: finalAccessCode,
        phone,
        groupId: groupIds[0], // Main group for backward compatibility
        groupIds,
        school,
        studentClass,
        monthlyPaymentAmount: monthlyPaymentAmount === '' ? undefined : Number(monthlyPaymentAmount),
        role: 'student',
        createdAt: Date.now() // Note: firestore rules dictate server timestamp or Date.now, simplified here. Using integer.
      };

      await setDoc(newUserRef, userData);

      // Handle initial payment
      if (initialPaymentAmount && Number(initialPaymentAmount) > 0) {
        const currentMonth = format(new Date(), 'yyyy-MM');
        const pId = `${newUserRef.id}_${currentMonth}`;
        const pData: Omit<Payment, 'id'> = {
          userId: newUserRef.id,
          month: currentMonth,
          status: 'paid',
          amount: Number(initialPaymentAmount),
          paidAt: Date.now(),
          markedBy: user?.id || 'admin'
        };
        await setDoc(doc(db, 'payments', pId), pData);
      }

      setSuccessCode(finalAccessCode);
      
    } catch (err: any) {
      console.error(err);
      alert('Xatolik: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successCode) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="text-green-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Muvaffaqiyatli!</h2>
        <p className="text-gray-500 mb-6 text-center">O'quvchi tizimga qo'shildi. Kirish ma'lumotlarini o'quvchiga bering:</p>
        
        <div className="bg-gray-100 p-6 rounded-2xl w-full max-w-sm mb-8 space-y-3">
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-500">Login:</span>
            <span className="font-bold text-gray-900">{username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Maxfiy kod (PIN):</span>
            <span className="font-bold text-[#fec204] text-xl tracking-widest">{successCode}</span>
          </div>
        </div>

        <button 
          onClick={() => navigate('/admin/students')}
          className="w-full max-w-sm bg-gray-900 text-white py-3.5 rounded-xl font-medium"
        >
          O'quvchilar ro'yxatiga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 hover:bg-gray-200 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Yangi O'quvchi</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">F.I.SH</label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>

        <div>
          <div className="flex justify-between items-end mb-1">
            <label className="block text-sm font-medium text-gray-700">Login (Avto)</label>
            {username && !isCheckingUsername && isUsernameAvailable === true && (
              <span className="text-sm font-medium text-green-600 flex items-center space-x-1">
                <Check size={14} /> <span>Mavjud</span>
              </span>
            )}
            {username && !isCheckingUsername && isUsernameAvailable === false && (
              <span className="text-sm font-medium text-red-600 flex items-center space-x-1">
                <XCircle size={14} /> <span>Band qilingan</span>
              </span>
            )}
            {isCheckingUsername && (
              <span className="text-sm text-gray-500">Tekshirilmoqda...</span>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              required
              className={`w-full border rounded-lg p-3 outline-none focus:ring-2 ${
                isUsernameAvailable === false 
                  ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                  : isUsernameAvailable === true 
                  ? 'border-green-300 focus:ring-green-500' 
                  : 'border-gray-300 focus:ring-[#fec204]'
              }`}
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maxfiy kod (Parol)</label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
          <input
            type="text"
            required
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Oylik to'lov summasi (so'm)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={monthlyPaymentAmount}
            onChange={e => setMonthlyPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Masalan: 300000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Birinchi oy uchun to'lov summasi (so'm)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={initialPaymentAmount}
            onChange={e => setInitialPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Hozirgi to'lov summasi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maktab</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={school}
            onChange={e => setSchool(e.target.value)}
            placeholder="Maktab raqami yoki nomi"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sinf</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={studentClass}
            onChange={e => setStudentClass(e.target.value)}
            placeholder="Masalan: 10-V"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guruhlar</label>
          {creatingGroup ? (
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Yangi guruh nomi"
                className="flex-1 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
              />
              <button 
                type="button" 
                onClick={handleCreateGroup}
                className="bg-[#fec204] text-black px-4 rounded-lg font-medium"
              >
                Saqlash
              </button>
              <button 
                type="button" 
                onClick={() => setCreatingGroup(false)}
                className="bg-gray-200 text-gray-700 px-4 rounded-lg font-medium"
              >
                X
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-2">
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
                {groups.map(g => (
                  <label key={g.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 text-[#fec204] focus:ring-[#fec204] rounded border-gray-300"
                      checked={groupIds.includes(g.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGroupIds([...groupIds, g.id]);
                        } else {
                          setGroupIds(groupIds.filter(id => id !== g.id));
                        }
                      }}
                    />
                    <span className="text-gray-700 font-medium">{g.name}</span>
                  </label>
                ))}
                {groups.length === 0 && (
                  <div className="text-gray-500 text-sm p-2">Guruhlar mavjud emas</div>
                )}
              </div>
              <button 
                type="button"
                onClick={() => setCreatingGroup(true)}
                className="flex items-center justify-center space-x-1 bg-gray-100 border border-gray-300 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-200 w-full"
              >
                <Plus size={18} />
                <span>Yangi guruh yaratish</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-[#fec204] hover:bg-[#e3a602] disabled:opacity-50 text-black font-medium py-3.5 rounded-xl shadow transition-colors"
        >
          {loading ? 'Saqlanmoqda...' : "Qo'shish"}
        </button>
      </form>
    </div>
  );
}
