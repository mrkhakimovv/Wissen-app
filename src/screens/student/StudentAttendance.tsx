import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Attendance } from '../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export default function StudentAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    
    // We fetch all or just this month's attendance to populate the calendar
    const attnQuery = query(collection(db, 'attendance'), where('userId', '==', user.id));
    getDocs(attnQuery).then(snap => {
      const records: Record<string, 'present' | 'absent'> = {};
      snap.docs.forEach(d => {
        const data = d.data() as Attendance;
        records[data.date] = data.status; // data.date is 'YYYY-MM-DD'
      });
      setAttendance(records);
    });
  }, [user]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const weekDays = ['Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan', 'Yak'];
  
  // Pad beginning of month
  const startDay = startOfMonth(currentDate).getDay();
  const emptyDaysIdx = startDay === 0 ? 6 : startDay - 1; // 0 is Sunday
  const emptyDays = Array.from({ length: emptyDaysIdx });

  let presentC = 0;
  let absentC = 0;
  
  daysInMonth.forEach(day => {
    const formatted = format(day, 'yyyy-MM-dd');
    if (attendance[formatted] === 'present') presentC++;
    if (attendance[formatted] === 'absent') absentC++;
  });

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Davomat</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-semibold text-gray-400">
          {weekDays.map(d => <div key={d}>{d}</div>)}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          ))}
          {daysInMonth.map((day, i) => {
            const formatted = format(day, 'yyyy-MM-dd');
            const status = attendance[formatted];
            const today = isToday(day);

            return (
              <div 
                key={i} 
                className={clsx(
                  "h-10 flex items-center justify-center rounded-full text-sm font-medium relative",
                  today && !status ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-700"
                )}
              >
                {format(day, 'd')}
                {status === 'present' && <div className="absolute bottom-1 w-1.5 h-1.5 bg-[#fec204] rounded-full"></div>}
                {status === 'absent' && <div className="absolute bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-xl flex justify-around border border-gray-100">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#fec204]">{presentC}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Keldi</div>
        </div>
        <div className="w-px bg-gray-200"></div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">{absentC}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Kelmadi</div>
        </div>
      </div>

    </div>
  );
}
