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
import AdminProfile from "./pages/AdminProfile";

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
        <Route path="/member/courses" element={<CourseSelection />} />
        <Route path="/member/course/:id" element={<CourseDisplay />} />
        <Route path="/member/material/:id" element={<CourseMaterial />} />

        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        {/* other admin pages (messages, members, etc.) can be added later */}
      </Routes>
    </BrowserRouter>
  );
}
