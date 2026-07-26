import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LecturerDashboard from './LecturerDashboard';
import StudentDashboard from './StudentDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      {user?.role === 'lecturer' ? <LecturerDashboard /> : <StudentDashboard />}
    </div>
  );
}
