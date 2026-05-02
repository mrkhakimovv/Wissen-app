import React, { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Group, User, Result } from '../../types';
import { format } from 'date-fns';

export default function AdminResults() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [students, setStudents] = useState<User[]>([]);
  
  const [userId, setUserId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [subject, setSubject] = useState('');
  const [type, setType] = useState<'daily' | 'monthly' | 'test'>('daily');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

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
    const fetchStudents = async () => {
      const q = query(collection(db, 'users'), where('groupId', '==', selectedGroup));
      const snap = await getDocs(q);
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
    };
    fetchStudents();
  }, [selectedGroup]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !date || !subject || !score || !maxScore) return alert("To'ldirilmagan maydonlar mavjud");
    setSaving(true);
    try {
      const resultData: Omit<Result, 'id'> = {
        userId,
        date,
        subject,
        type,
        score: Number(score),
        maxScore: Number(maxScore),
        note
      };
      await addDoc(collection(db, 'results'), resultData);
      alert('Natija saqlandi!');
      // Reset fields
      setScore('');
      setMaxScore('');
      setNote('');
    } catch (e) {
      console.error(e);
      alert('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Natija Kiritish</h1>

      <form onSubmit={handleSave} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guruh</label>
          <select 
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            <option value="">-- Tanlang --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {selectedGroup && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">O'quvchi</label>
            <select 
              required
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            >
              <option value="">-- Tanlang --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fan / Mavzu</label>
          <input
            type="text" required
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={subject} onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sana</label>
            <input
              type="date" required
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
              value={date} onChange={e => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tur</label>
            <select 
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
              value={type} onChange={(e) => setType(e.target.value as any)}
            >
              <option value="daily">Kunlik</option>
              <option value="monthly">Oylik</option>
              <option value="test">Test</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Olingan ball</label>
            <input
              type="number" required
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
              value={score} onChange={e => setScore(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Yerdagi ball (Max)</label>
            <input
              type="number" required
              className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
              value={maxScore} onChange={e => setMaxScore(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
            value={note} onChange={e => setNote(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving || !userId}
          className="w-full mt-6 bg-[#fec204] hover:bg-[#e3a602] disabled:opacity-50 text-black font-medium py-3.5 rounded-xl shadow transition-colors"
        >
          {saving ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </form>
    </div>
  );
}
