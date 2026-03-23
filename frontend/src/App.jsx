import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

import MemberDashboard from "./pages/MemberDashboard";
import Notifications from "./pages/Notifications";
import ManageProfile from "./pages/ManageProfile";
import Modules from "./pages/Modules";
import Account from "./pages/Account";
import CourseSelection from "./pages/CourseSelection";
import CourseDisplay from "./pages/CourseDisplay";
import CourseMaterial from "./pages/CourseMaterial";
import MemberProfile from "./pages/MemberProfile";

import AdminDashboard from "./pages/AdminDashboard";
import AdminCourseManagement from "./pages/AdminCourseManagement";
import AdminProfile from "./pages/AdminProfile";
import AdminFeedback from "./pages/AdminFeedback";
import AdminReports from "./pages/AdminReports";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Member routes */}
        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/member/notifications" element={<Notifications />} />
        <Route path="/member/profile" element={<MemberProfile />} />
        <Route path="/member/manage-profile" element={<ManageProfile />} />
        <Route path="/member/modules" element={<Modules />} />
        <Route path="/member/account" element={<Account />} />

        {/* Member courses */}
        <Route path="/member/courses" element={<CourseSelection />} />
        <Route path="/member/course/:id" element={<CourseDisplay />} />
        <Route path="/member/material/:id" element={<CourseMaterial />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<AdminCourseManagement />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/feedback" element={<AdminFeedback />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Routes>
    </BrowserRouter>
  );
}
