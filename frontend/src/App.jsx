import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";

import MemberDashboard from "./pages/MemberDashboard";
import Notifications from "./pages/Notifications";
import ManageProfile from "./pages/ManageProfile";
import Modules from "./pages/Modules";
import Account from "./pages/Account";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/member/dashboard" element={<MemberDashboard />} />
        <Route path="/member/notifications" element={<Notifications />} />
        <Route path="/member/profile" element={<ManageProfile />} />
        <Route path="/member/modules" element={<Modules />} />
        <Route path="/member/account" element={<Account />} />
      </Routes>
    </BrowserRouter>
  );
}
