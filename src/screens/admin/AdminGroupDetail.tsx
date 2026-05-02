import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Group, User, Result } from '../../types';
import { ArrowLeft, UserCircle } from 'lucide-react';

interface StudentWithPerformance extends User {
  percentage: number;
}

export default function AdminGroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<StudentWithPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const groupSnap = await getDoc(doc(db, 'groups', id));
        if (groupSnap.exists()) {
          setGroup({ id: groupSnap.id, ...groupSnap.data() } as Group);
        }

        // Fetch students
        const sQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const sSnap = await getDocs(sQuery);
        
        const groupStudents = sSnap.docs.filter(d => {
          const u = d.data() as User;
          if (u.groupIds && u.groupIds.length > 0) {
            return u.groupIds.includes(id);
          }
          return u.groupId === id;
        }).map(d => ({ id: d.id, ...d.data() } as User));

        // Fetch results for these students
        const rQuery = query(collection(db, 'results'));
        const rSnap = await getDocs(rQuery);
        const results = rSnap.docs.map(d => d.data() as Result);

        const studentsData = groupStudents.map(student => {
          const studentResults = results.filter(r => r.userId === student.id);
          
          let totalScore = 0;
          let totalMaxScore = 0;
          
          studentResults.forEach(r => {
            totalScore += Number(r.score) || 0;
            totalMaxScore += Number(r.maxScore) || 0;
          });

          const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : -1;

          return {
            ...student,
            percentage
          };
        });

        // Sort by percentage descending
        studentsData.sort((a, b) => b.percentage - a.percentage);

        setStudents(studentsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="p-4 text-center mt-10">Yuklanmoqda...</div>;
  if (!group) return <div className="p-4 text-center mt-10">Guruh topilmadi</div>;

  return (
    <div className="p-4 space-y-6 flex flex-col h-full">
      <div className="flex items-center space-x-3 mb-2">
        <button 
          onClick={() => navigate('/admin/groups')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-sm text-gray-500">O'quvchilar ro'yxati va o'zlashtirish foizi</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-sm font-medium text-gray-500">
          <div>O'quvchi</div>
          <div>O'zlashtirish</div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {students.map(student => (
            <Link key={student.id} to={`/admin/students/${student.id}`} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl hover:bg-gray-50 transition-colors block">
              <div className="flex items-center space-x-3">
                <UserCircle className="text-gray-400" size={32} />
                <div>
                  <div className="font-semibold text-gray-900">{student.fullName}</div>
                  <div className="text-sm text-gray-500">{student.phone}</div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className={`font-bold text-lg ${
                  student.percentage >= 80 ? 'text-green-600' :
                  student.percentage >= 60 ? 'text-yellow-600' :
                  student.percentage >= 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {student.percentage >= 0 ? `${Math.round(student.percentage)}%` : 'N/A'}
                </div>
              </div>
            </Link>
          ))}
          {students.length === 0 && (
            <p className="text-center text-gray-500 py-10">Guruhda o'quvchilar yo'q</p>
          )}
        </div>
      </div>
    </div>
  );
}
