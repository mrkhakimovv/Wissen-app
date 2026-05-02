import { Link, useLocation } from 'react-router-dom';
import { Home, CalendarCheck, BarChart2, CheckCircle, CreditCard, Users, PlusCircle, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../lib/auth';

export function BottomTabs() {
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();

  const studentTabs = [
    { label: 'Kabinet', path: '/student/home', icon: Home },
    { label: 'Davomat', path: '/student/attendance', icon: CalendarCheck },
    { label: 'Natijalar', path: '/student/results', icon: BarChart2 },
    { label: 'Testlar', path: '/student/tests', icon: CheckCircle },
    { label: 'To\'lovlar', path: '/student/payments', icon: CreditCard },
  ];

  const adminTabs = [
    { label: 'Asosiy', path: '/admin/dashboard', icon: Home },
    { label: 'Davomat', path: '/admin/attendance', icon: CalendarCheck },
    { label: 'Guruhlar', path: '/admin/groups', icon: Layers },
    { label: 'O\'quvchilar', path: '/admin/students', icon: Users },
    { label: 'Testlar', path: '/admin/tests', icon: CheckCircle },
    { label: 'To\'lov', path: '/admin/payments', icon: CreditCard },
  ];

  const tabs = isAdmin ? adminTabs : studentTabs;

  return (
    <div className="w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-50 shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname.startsWith(tab.path);
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={clsx(
              'flex flex-col items-center justify-center w-full h-full space-y-1',
              isActive ? (isAdmin ? 'text-[#fec204]' : 'text-[#fec204]') : 'text-gray-400'
            )}
          >
            <Icon size={22} className={clsx(isActive && 'stroke-[2.5px]')} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
