import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, doc, setDoc, where } from 'firebase/firestore';
import { Group, User, Attendance } from '../../types';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useAuth } from '../../lib/auth';

export default function AdminAttendance() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [students, setStudents] = useState<User[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | null>>({});
  const [saving, setSaving] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    getDocs(collection(db, 'groups')).then(snap => {
      const activeGroups = snap.docs
        .filter(d => !d.data()?.isArchived)
        .map(d => ({ id: d.id, ...d.data() } as Group));
      setGroups(activeGroups);
    });
  }, []);

  useEffect(() => {
    if (!selectedGroup) {
      setStudents([]);
      setAttendance({});
      return;
    }

    const fetchStudents = async () => {
      // Find students in group
      const q = query(collection(db, 'users'), where('groupId', '==', selectedGroup));
      const snap = await getDocs(q);
      const studs = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setStudents(studs);

      // Fetch today's attendance for group
      const aQuery = query(collection(db, 'attendance'), where('groupId', '==', selectedGroup), where('date', '==', today));
      const aSnap = await getDocs(aQuery);
      
      const currentAttn: Record<string, 'present' | 'absent' | null> = {};
      studs.forEach(s => currentAttn[s.id] = null); // default unset
      
      aSnap.docs.forEach(d => {
        const data = d.data() as Attendance;
        currentAttn[data.userId] = data.status;
      });
      setAttendance(currentAttn);
    };

    fetchStudents();
  }, [selectedGroup]);

  const handleToggle = (studentId: string, status: 'present' | 'absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status // toggle off if already selected
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const batchPromises = Object.entries(attendance).map(async ([studentId, stat]) => {
        const status = stat as 'present' | 'absent' | null;
        if (status === null) return; // skip unset
        // We use a deterministic ID so we can overwrite/update today's attendance
        const attnId = `${studentId}_${today}`;
        const attnData: Omit<Attendance, 'id'> = {
          userId: studentId,
          groupId: selectedGroup,
          date: today,
          status,
          markedBy: user.id,
          markedAt: Date.now()
        };
        await setDoc(doc(db, 'attendance', attnId), attnData);
      });
      await Promise.all(batchPromises);
      alert('Davomat saqlandi!');
    } catch (e) {
      console.error(e);
      alert('Xatolik: Davomat saqlanmadi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Davomat Olish</h1>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Guruhni tanlang:</label>
        <select 
          className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#fec204]"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
        >
          <option value="">-- Tanlang --</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <div className="text-xs text-gray-500 mt-2 text-right">Sana: {format(new Date(), 'dd.MM.yyyy')}</div>
      </div>

      {selectedGroup && (
        <div className="space-y-3">
          {students.map(s => (
            <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <span className="font-medium text-gray-800">{s.fullName}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggle(s.id, 'present')}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    attendance[s.id] === 'present' ? "bg-green-500 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  Keldi
                </button>
                <button
                  onClick={() => handleToggle(s.id, 'absent')}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    attendance[s.id] === 'absent' ? "bg-red-500 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  Yo'q
                </button>
              </div>
            </div>
          ))}

          {students.length === 0 ? (
            <p className="text-center text-gray-500 mt-4">Bu guruhda o'quvchilar yo'q</p>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-6 bg-[#fec204] hover:bg-[#e3a602] disabled:opacity-50 text-black font-medium py-3.5 rounded-xl shadow transition-colors"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
