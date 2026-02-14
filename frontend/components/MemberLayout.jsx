import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUnreadCount } from "../src/api/notifications";
import "../src/pages/Dashboard.css";

export default function MemberLayout({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [unread, setUnread] = useState(0); // Unread notification counter state
  const token = localStorage.getItem("access"); // Authentication token from login

  // Fetch unread count when layout loads
  useEffect(() => {
    if (!token) return;

    fetchUnreadCount(token).then((data) => {
      if (data?.unread !== undefined) {
        setUnread(data.unread);
      }
    });
  }, [token]);

  const navItems = [
    { label: "Dashboard", path: "/member/dashboard" },
    { label: "Profile", path: "/member/profile" },
    { label: "Courses", path: "/member/courses" },
    { label: "Messages", path: "/member/notifications" },
  ];

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
              {item.label === "Messages" && unread > 0 && (
                <span className="notif-badge">({unread})</span>
              )}
            </button>
          ))}

          <button
            type="button"
            className="dash-sidebar-link signout"
            onClick={() => navigate("/login")}
          >
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-avatar">J</div>
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
