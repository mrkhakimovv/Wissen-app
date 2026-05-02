import { Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { BottomTabs } from './BottomTabs';

export function MobileLayout() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex justify-center bg-gray-100 h-[100dvh]">
      <div className="w-full max-w-md bg-slate-50 shadow-xl h-full flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto w-full">
          <Outlet />
        </main>
        <BottomTabs />
      </div>
    </div>
  );
}
