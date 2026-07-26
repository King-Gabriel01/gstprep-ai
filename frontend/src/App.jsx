import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import LecturerDashboard from "./pages/LecturerDashboard.jsx";
import LecturerCourseDetail from "./pages/LecturerCourseDetail.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import StudentCourseDetail from "./pages/StudentCourseDetail.jsx";
import PracticeSession from "./pages/PracticeSession.jsx";
import ResultsReview from "./pages/ResultsReview.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-parchment font-body">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/lecturer"
          element={
            <ProtectedRoute role="lecturer">
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer/courses/:id"
          element={
            <ProtectedRoute role="lecturer">
              <LecturerCourseDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:id"
          element={
            <ProtectedRoute role="student">
              <StudentCourseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:id/practice"
          element={
            <ProtectedRoute role="student">
              <PracticeSession />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/courses/:id/results"
          element={
            <ProtectedRoute role="student">
              <ResultsReview />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
