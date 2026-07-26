import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LecturerCourseView from './LecturerCourseView';
import StudentCourseView from './StudentCourseView';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      {user?.role === 'lecturer' ? <LecturerCourseView courseId={id} /> : <StudentCourseView courseId={id} />}
    </div>
  );
}
