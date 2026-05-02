import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { MobileLayout } from './components/MobileLayout';
import LoginScreen from './screens/LoginScreen';

// Student Screens
import StudentHome from './screens/student/StudentHome';
import StudentAttendance from './screens/student/StudentAttendance';
import StudentResults from './screens/student/StudentResults';
import StudentTests from './screens/student/StudentTests';
import StudentPayments from './screens/student/StudentPayments';

// Admin Screens
import AdminDashboard from './screens/admin/AdminDashboard';
import AdminAttendance from './screens/admin/AdminAttendance';
import AdminStudents from './screens/admin/AdminStudents';
import AdminStudentDetail from './screens/admin/AdminStudentDetail';
import AdminAddStudent from './screens/admin/AdminAddStudent';
import AdminResults from './screens/admin/AdminResults';
import AdminTests from './screens/admin/AdminTests';
import AdminPayments from './screens/admin/AdminPayments';
import AdminGroups from './screens/admin/AdminGroups';
import AdminGroupDetail from './screens/admin/AdminGroupDetail';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/student/home" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginScreen />} />
          
          <Route element={<MobileLayout />}>
            <Route path="/student/home" element={<StudentHome />} />
            <Route path="/student/attendance" element={<StudentAttendance />} />
            <Route path="/student/results" element={<StudentResults />} />
            <Route path="/student/tests" element={<StudentTests />} />
            <Route path="/student/payments" element={<StudentPayments />} />

            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/groups" element={<AdminGroups />} />
            <Route path="/admin/groups/:id" element={<AdminGroupDetail />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/students/add" element={<AdminAddStudent />} />
            <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
            <Route path="/admin/results" element={<AdminResults />} />
            <Route path="/admin/tests" element={<AdminTests />} />
            <Route path="/admin/payments" element={<AdminPayments />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
