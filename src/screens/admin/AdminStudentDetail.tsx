import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User, Group } from '../../types';
import { ArrowLeft, UserCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'users', id)).then(snap => {
      if (snap.exists()) {
        const s = { id: snap.id, ...snap.data() } as User;
        setStudent(s);
        
        const fetchMultiple = async () => {
          const fetchedGroups: Group[] = [];
          const ids = s.groupIds?.length ? s.groupIds : (s.groupId ? [s.groupId] : []);
          for (const gId of ids) {
            const gSnap = await getDoc(doc(db, 'groups', gId));
            if (gSnap.exists()) {
              fetchedGroups.push({ id: gSnap.id, ...gSnap.data() } as Group);
            }
          }
          setGroups(fetchedGroups);
        };
        fetchMultiple();
      }
    });
  }, [id]);

  if (!student) return <div className="p-4 text-center text-gray-500 mt-10">Yuklanmoqda...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-3 p-2 hover:bg-gray-200 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">O'quvchi Karta</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="bg-[#fec204]/10 p-4 rounded-full mb-4">
          <UserCircle className="text-[#fec204]" size={48} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">{student.fullName}</h2>
        <p className="text-gray-500 text-center">{groups.length > 0 ? groups.map(g => g.name).join(', ') : 'Guruhsiz'}</p>
        
        <div className="w-full mt-6 space-y-3">
          {student.school && (
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Maktab:</span>
              <span className="font-medium text-gray-800">{student.school}</span>
            </div>
          )}
          {student.studentClass && (
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Sinf:</span>
              <span className="font-medium text-gray-800">{student.studentClass}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Telefon:</span>
            <span className="font-medium text-gray-800">{student.phone}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Tizim Login:</span>
            <span className="font-medium text-gray-800">{student.username}</span>
          </div>
          <div className="flex justify-between border-b border-gray-100 pb-2">
            <span className="text-gray-500">Maxfiy kod (PIN):</span>
            <span className="font-medium text-[#fec204] tracking-wider">{student.accessCode}</span>
          </div>
          <div className="flex justify-between pb-2">
            <span className="text-gray-500">A'zo bo'lgan:</span>
            <span className="font-medium text-gray-800">{new Date(student.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
