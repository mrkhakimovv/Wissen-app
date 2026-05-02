import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Layers, Plus, Trash2, Edit2, Archive, ArchiveRestore } from 'lucide-react';
import { Group } from '../../types';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

export default function AdminGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [time, setTime] = useState('');

  const daysOptions = ['Du', 'Se', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];
  
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const q = query(collection(db, 'groups'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      
      // Sort: Active first, then Archived
      data.sort((a, b) => {
        if (a.isArchived === b.isArchived) return 0;
        return a.isArchived ? 1 : -1;
      });
      
      setGroups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedDays.length === 0 || !time) {
      alert('Iltimos, guruh nomi, kunlar va vaqtni kiriting.');
      return;
    }

    try {
      const scheduleStr = `${selectedDays.join('-')}, ${time}`;
      const id = editingId || Date.now().toString();
      const newGroup: Group = {
        id,
        name,
        schedule: scheduleStr,
        studentIds: editingId ? groups.find(g => g.id === editingId)?.studentIds || [] : [],
      };

      await setDoc(doc(db, 'groups', id), newGroup);
      
      setName('');
      setSelectedDays([]);
      setTime('');
      setShowForm(false);
      setEditingId(null);
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (group: Group) => {
    setName(group.name);
    
    let parsedDays: string[] = [];
    let parsedTime = '';
    
    if (group.schedule) {
      if (group.schedule.includes(',')) {
        const parts = group.schedule.split(', ');
        parsedDays = parts[0]?.split('-') || [];
        parsedTime = parts[1] || '';
      } else {
        // Fallback if the format is different
        parsedTime = group.schedule;
      }
    }
    
    setSelectedDays(parsedDays);
    setTime(parsedTime);
    setEditingId(group.id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (groupToDelete) {
      try {
        await deleteDoc(doc(db, 'groups', groupToDelete));
        setGroupToDelete(null);
        fetchGroups();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDelete = (id: string) => {
    setGroupToDelete(id);
  };

  const toggleArchive = async (group: Group) => {
    try {
      await updateDoc(doc(db, 'groups', group.id), {
        isArchived: !group.isArchived
      });
      fetchGroups();
    } catch (e) {
      console.error(e);
    }
  };

  const getIconColorClass = (schedule: string, isArchived?: boolean) => {
    if (isArchived) return 'bg-gray-100 text-gray-400';
    if (!schedule || !schedule.includes(',')) return 'bg-[#fec204]/10 text-[#fec204]';
    
    let hash = 0;
    for (let i = 0; i < schedule.length; i++) {
      hash = schedule.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      "bg-red-100 text-red-600",
      "bg-blue-100 text-blue-600",
      "bg-green-100 text-green-600",
      "bg-purple-100 text-purple-600",
      "bg-orange-100 text-orange-600",
      "bg-teal-100 text-teal-600",
      "bg-pink-100 text-pink-600",
      "bg-indigo-100 text-indigo-600",
      "bg-lime-100 text-lime-600",
      "bg-cyan-100 text-cyan-600",
      "bg-fuchsia-100 text-fuchsia-600",
      "bg-amber-100 text-amber-600"
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) return <div className="p-4 text-center mt-10">Yuklanmoqda...</div>;

  return (
    <div className="p-4 pb-24 space-y-6 relative">
      {groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Guruhni o'chirish</h3>
            <p className="text-gray-500 mb-6">Rostdan ham bu guruhni o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setGroupToDelete(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200"
              >
                Bekor qilish
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 shadow"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Guruhlar</h1>
          <p className="text-sm text-gray-500">Barcha guruhlarni boshqarish</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) {
              setEditingId(null);
              setName('');
              setSelectedDays([]);
              setTime('');
            }
          }} 
          className="bg-[#fec204] text-black p-2 rounded-full hover:bg-[#e3a602] shadow transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold">{editingId ? 'Guruhni tahrirlash' : 'Yangi guruh'}</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guruh nomi</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
              placeholder="Foundation 1, Pre-IELTS..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kunlar</label>
            <div className="flex flex-wrap gap-2">
              {daysOptions.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    if (selectedDays.includes(day)) {
                      setSelectedDays(selectedDays.filter(d => d !== day));
                    } else {
                      // Optional: sort days based on original order
                      const newDays = [...selectedDays, day];
                      newDays.sort((a, b) => daysOptions.indexOf(a) - daysOptions.indexOf(b));
                      setSelectedDays(newDays);
                    }
                  }}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                    selectedDays.includes(day) 
                      ? "bg-[#fec204] text-black border-[#fec204]" 
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#fec204]"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vaqti</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
              required
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button 
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setName('');
                setSelectedDays([]);
                setTime('');
              }}
              className="flex-1 py-3 text-gray-600 bg-gray-100 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Bekor qilish
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3 bg-[#fec204] text-black font-medium rounded-xl hover:bg-[#e3a602] shadow transition-colors"
            >
              Saqlash
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 text-gray-500">
            Guruhlar topilmadi
          </div>
        ) : (
          groups.map(group => {
            const colorClass = getIconColorClass(group.schedule, group.isArchived);
            return (
            <div 
              key={group.id} 
              onClick={() => navigate(`/admin/groups/${group.id}`)}
              className={clsx("bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors", group.isArchived && "opacity-60")}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Layers size={24} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-lg text-gray-900">{group.name}</h3>
                      {group.isArchived && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Arxiv</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{group.schedule || 'Jadval belgilanmagan'}</p>
                  </div>
                </div>
                <div className="flex space-x-1 sm:space-x-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleArchive(group); }}
                    title={group.isArchived ? "Arxivdan chiqarish" : "Arxivlash"}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    {group.isArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEdit(group); }}
                    className="p-2 text-gray-400 hover:text-[#fec204] hover:bg-[#fec204]/10 rounded-full transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(group.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}
