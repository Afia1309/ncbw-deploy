import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchUnreadCount } from "../src/api/notifications";
import api from "../src/api/apiClient";
import "../src/pages/Dashboard.css";

export default function MemberLayout({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [unread, setUnread] = useState(0);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) return;

    fetchUnreadCount(token)
      .then((data) => {
        if (data?.unread !== undefined) {
          setUnread(data.unread);
        }
      })
      .catch((err) => {
        console.error("Unread count fetch failed:", err);
      });
  }, [token]);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) return;

      const response = await api.get("/training/me/");
      setUserName(response.data?.name || "");
    } catch (err) {
      console.error("Failed to fetch user:", err);
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/member/dashboard" },
    { label: "Profile", path: "/member/profile" },
    { label: "Courses", path: "/member/courses" },
    { label: "Messages", path: "/member/notifications" },
  ];

  const getInitial = () => {
    if (userName?.trim()) return userName.trim().charAt(0).toUpperCase();
    return "U";
  };

  const handleSignOut = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");

      if (refreshToken) {
        await api.post("/auth/logout/", {
          refresh: refreshToken,
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    }
  };

  return (
    <div className="dash-page">
      <aside className="dash-sidebar">
        <div className="dash-logo">NCBW</div>

        <nav className="dash-nav">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                type="button"
                className={`dash-sidebar-link${isActive ? " active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span>{item.label}</span>

                {item.label === "Messages" && unread > 0 && (
                  <span className="notif-badge">{unread}</span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            className="dash-sidebar-link signout"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </nav>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-avatar">{getInitial()}</div>

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
