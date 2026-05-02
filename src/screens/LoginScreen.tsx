import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

export default function LoginScreen() {
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginUser, loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      let success = false;
      if (role === 'student') {
        if (!username || !accessCode) throw new Error("Iltimos, barcha maydonlarni to'ldiring");
        success = await loginUser(username, accessCode);
      } else {
        if (!adminCode) throw new Error("Iltimos, admin kodini kiriting");
        success = await loginAdmin(adminCode);
      }

      if (success) {
        navigate(role === 'student' ? '/student/home' : '/admin/dashboard');
      } else {
        setError("Noto'g'ri ma'lumot kiritildi");
      }
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-[#fec204]/10 p-4 rounded-full mb-4">
            <BookOpen className="text-[#fec204]" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center">Wissen O'quv Markazi</h1>
          <p className="text-gray-500 text-sm mt-1">Tizimga kirish</p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
              role === 'student' ? 'bg-white shadow text-[#fec204]' : 'text-gray-500 hover:text-gray-700'
            )}
            onClick={() => { setRole('student'); setError(''); }}
          >
            O'quvchi
          </button>
          <button
            type="button"
            className={clsx(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
              role === 'admin' ? 'bg-white shadow text-[#fec204]' : 'text-gray-500 hover:text-gray-700'
            )}
            onClick={() => { setRole('admin'); setError(''); }}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          {role === 'student' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foydalanuvchi nomi</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#fec204] focus:border-transparent outline-none transition-all"
                  placeholder="masalan: ali"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maxfiy kod (PIN)</label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#fec204] focus:border-transparent outline-none transition-all"
                  placeholder="6 xonali kod"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin maxfiy kodi</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#fec204] focus:border-transparent outline-none transition-all"
                placeholder="Admin kodini kiriting"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={clsx(
              "w-full py-3.5 mt-4 rounded-xl text-black font-medium shadow transition-all",
              role === 'student' ? 'bg-[#fec204] hover:bg-[#e3a602]' : 'bg-[#fec204] hover:bg-[#e3a602]',
              isLoading && 'opacity-70 cursor-not-allowed'
            )}
          >
            {isLoading ? 'Yuklanmoqda...' : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
