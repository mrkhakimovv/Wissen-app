import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { User, Group } from '../../types';
import { Search, UserPlus, ChevronRight, Edit2, Trash2, Archive, ArchiveRestore, Check, XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export default function AdminStudents() {
  const [students, setStudents] = useState<(User & { groupName?: string })[]>([]);
  const [search, setSearch] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const navigate = useNavigate();

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAccessCode, setEditAccessCode] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editStudentClass, setEditStudentClass] = useState('');
  const [editMonthlyPayment, setEditMonthlyPayment] = useState<number | ''>('');
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  useEffect(() => {
    if (!editingStudent || !editUsername) {
      setIsUsernameAvailable(null);
      return;
    }
    
    if (editUsername === editingStudent.username) {
      setIsUsernameAvailable(true); // Same as before
      return;
    }

    setIsCheckingUsername(true);
    const timeoutId = setTimeout(async () => {
      try {
        const q = query(collection(db, 'users'), where('username', '==', editUsername.trim()));
        const snap = await getDocs(q);
        setIsUsernameAvailable(snap.empty);
      } catch (err) {
        console.error("Error checking username:", err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [editUsername, editingStudent]);

  const fetchStudents = async () => {
    // Groups mapping
    const gSnap = await getDocs(collection(db, 'groups'));
    const groupMap = new Map<string, string>();
    const activeGroupIds = new Set<string>();
    const allGroups: Group[] = [];
    
    gSnap.docs.forEach(d => {
      const _data = d.data() as Group;
      allGroups.push({ id: d.id, ..._data });
      if (!_data.isArchived) {
        activeGroupIds.add(d.id);
      }
      groupMap.set(d.id, _data.name);
    });
    setGroups(allGroups.filter(g => !g.isArchived));

    // Students
    const sQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    const sSnap = await getDocs(sQuery);
    
    const stData = sSnap.docs.map(d => {
      const data = d.data() as User;
      let pGroupNames = data.groupIds ? data.groupIds.map(id => groupMap.get(id) || '').filter(Boolean).join(', ') : '';
      if (!pGroupNames && data.groupId) {
        pGroupNames = groupMap.get(data.groupId) || 'Guruhsiz';
      }
      
      return { 
        id: d.id, 
        ...data,
        groupName: pGroupNames || 'Guruhsiz'
      };
    });

    stData.sort((a, b) => {
      if (a.isArchived === b.isArchived) return 0;
      return a.isArchived ? 1 : -1;
    });

    setStudents(stData);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = students.filter(s => s.fullName.toLowerCase().includes(search.toLowerCase()) || s.phone.includes(search));

  const handleToggleArchive = async (s: User) => {
    try {
      await updateDoc(doc(db, 'users', s.id), {
        isArchived: !s.isArchived
      });
      fetchStudents();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (s: User) => {
    setEditingStudent(s);
    setEditFullName(s.fullName);
    setEditUsername(s.username);
    setEditAccessCode(s.accessCode || '');
    setEditPhone(s.phone);
    setEditSchool(s.school || '');
    setEditStudentClass(s.studentClass || '');
    setEditMonthlyPayment(s.monthlyPaymentAmount ?? '');
    setEditGroupIds(s.groupIds || (s.groupId ? [s.groupId] : []));
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    if (isUsernameAvailable === false) return alert("Ushbu logindan boshqa foydalanuvchi foydalanmoqda.");

    try {
      await updateDoc(doc(db, 'users', editingStudent.id), {
        fullName: editFullName,
        username: editUsername,
        accessCode: editAccessCode,
        phone: editPhone,
        school: editSchool,
        studentClass: editStudentClass,
        monthlyPaymentAmount: editMonthlyPayment === '' ? null : Number(editMonthlyPayment),
        groupIds: editGroupIds,
        groupId: editGroupIds.length > 0 ? editGroupIds[0] : ''
      });
      setEditingStudent(null);
      fetchStudents();
    } catch (e) {
      console.error(e);
      alert('Xatolik yuz berdi');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', studentToDelete));
      setStudentToDelete(null);
      fetchStudents();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 space-y-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-900">O'quvchilar</h1>
        <button 
          onClick={() => navigate('/admin/students/add')}
          className="bg-[#fec204] text-black p-2 rounded-full hover:bg-[#e3a602] shadow"
        >
          <UserPlus size={20} />
        </button>
      </div>

      <div className="relative">
        <input 
          type="text" 
          placeholder="Ism yoki telefon raqam..." 
          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[#fec204] focus:ring-1 focus:ring-[#fec204]"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pb-4">
        {filtered.map(s => (
          <div 
            key={s.id} 
            className={clsx("bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:bg-gray-50 transition-colors", s.isArchived && "opacity-60")}
          >
            <Link to={`/admin/students/${s.id}`} className="flex-1 flex flex-col items-start text-left">
              <div className="flex items-center space-x-2">
                <div className="font-semibold text-gray-800">{s.fullName}</div>
                {s.isArchived && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-full font-medium">Arxiv</span>}
              </div>
              <div className="text-xs text-gray-500 mt-1">{s.groupName} | {s.phone}</div>
            </Link>
            <div className="flex space-x-1 sm:space-x-2 ml-2 shrink-0">
              <button 
                onClick={(e) => { e.preventDefault(); handleToggleArchive(s); }}
                title={s.isArchived ? "Arxivdan chiqarish" : "Arxivlash"}
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
               >
                 {s.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
               </button>
               <button 
                 onClick={(e) => { e.preventDefault(); handleEdit(s); }}
                 className="p-2 text-gray-400 hover:text-[#fec204] hover:bg-[#fec204]/10 rounded-full transition-colors"
               >
                 <Edit2 size={18} />
               </button>
               <button 
                 onClick={(e) => { e.preventDefault(); setStudentToDelete(s.id); }}
                 className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
               >
                 <Trash2 size={18} />
               </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center text-gray-500 mt-10">O'quvchi topilmadi</p>}
      </div>

      {/* Edit Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Tahrirlash</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">F.I.SH</label>
                <input type="text" value={editFullName} onChange={e => setEditFullName(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#fec204]" />
              </div>
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-gray-700">Login</label>
                  {editUsername && !isCheckingUsername && isUsernameAvailable === true && (
                    <span className="text-xs font-medium text-green-600 flex items-center space-x-1">
                      <Check size={12} /> <span>Mavjud</span>
                    </span>
                  )}
                  {editUsername && !isCheckingUsername && isUsernameAvailable === false && (
                    <span className="text-xs font-medium text-red-600 flex items-center space-x-1">
                      <XCircle size={12} /> <span>Band qilingan</span>
                    </span>
                  )}
                  {isCheckingUsername && (
                    <span className="text-xs text-gray-500">Tekshirilmoqda...</span>
                  )}
                </div>
                <input 
                  type="text" 
                  value={editUsername} 
                  onChange={e => setEditUsername(e.target.value)} 
                  className={`w-full border rounded-xl p-3 outline-none focus:ring-2 ${
                    isUsernameAvailable === false 
                      ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                      : 'border-gray-300 focus:ring-[#fec204]'
                  }`} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maxfiy kod (Parol)</label>
                <input type="text" value={editAccessCode} onChange={e => setEditAccessCode(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#fec204]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input type="text" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#fec204]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oylik to'lov summasi (so'm)</label>
                <input type="number" value={editMonthlyPayment} onChange={e => setEditMonthlyPayment(e.target.value === '' ? '' : Number(e.target.value))} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#fec204]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maktab</label>
                <input type="text" value={editSchool} onChange={e => setEditSchool(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#fec204]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sinf</label>
                <input type="text" value={editStudentClass} onChange={e => setEditStudentClass(e.target.value)} className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#fec204]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guruhlar</label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-xl p-2 space-y-1">
                  {groups.map(g => (
                    <label key={g.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={editGroupIds.includes(g.id)}
                        onChange={(e) => {
                          if (e.target.checked) setEditGroupIds([...editGroupIds, g.id]);
                          else setEditGroupIds(editGroupIds.filter(id => id !== g.id));
                        }}
                        className="w-5 h-5 text-[#fec204] focus:ring-[#fec204] rounded border-gray-300"
                      />
                      <span className="text-gray-700">{g.name}</span>
                    </label>
                  ))}
                  {groups.length === 0 && <div className="text-gray-500 text-sm">Guruhlar yo'q</div>}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button onClick={handleSaveEdit} className="flex-1 bg-[#fec204] hover:bg-[#e3a602] text-black font-medium py-3 rounded-xl transition-colors">Saqlash</button>
                <button onClick={() => setEditingStudent(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors">Bekor qilish</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {studentToDelete && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
             <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Trash2 className="text-red-500" size={32} />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">O'chirish</h2>
             <p className="text-gray-500 mb-6">Ushbu o'quvchini butunlay o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
             <div className="flex space-x-3">
               <button onClick={handleDeleteConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-xl transition-colors">Ha, O'chirish</button>
               <button onClick={() => setStudentToDelete(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors">Bekor qilish</button>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
