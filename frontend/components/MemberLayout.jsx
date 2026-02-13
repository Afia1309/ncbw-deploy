import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../src/api/apiClient";  
import "../src/pages/Dashboard.css";

export default function MemberLayout({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");

  const navItems = [
    { label: "Dashboard", path: "/member/dashboard" },
    { label: "Profile", path: "/member/profile" },
    { label: "Courses", path: "/member/courses" },
    { label: "Messages", path: "/member/notifications" },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      
      const response = await api.get("/training/me/");
      setUserName(response.data.name);
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const getInitial = () => {
    if (userName) {
      return userName.charAt(0).toUpperCase();
    }
    return "U";
  };

  const handleSignOut = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate("/login");
  };

  return (
    <div className="dash-page">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-logo">NCBW</div>

        <nav className="dash-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={
                "dash-sidebar-link" +
                (location.pathname.startsWith(item.path) ? " active" : "")
              }
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            className="dash-sidebar-link signout"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-avatar">
              {getInitial()}
            </div>
            <div className="dash-header-text">
              <div className="dash-header-title">{title}</div>
            </div>
          </div>
          <div className="dash-header-brand">NCBW</div>
        </header>

        <div className="dash-content">{children}</div>
      </main>
    </div>
  );
}