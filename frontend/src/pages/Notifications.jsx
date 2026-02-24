import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markAsRead } from "../api/notifications"; // API to backend
import "./Notifications.css"; // CSS-styling

// ===== LOGIC SECTION =====

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("access_token");
  const navigate = useNavigate();

  useEffect(() => {
  if (!token) return; // prevents crash if not logged in

  fetchNotifications(token)
    .then(data => {
      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        console.error("Unexpected response:", data);
      }
    })
    .catch(err => {
      console.error("Notification fetch failed:", err);
    });
}, [token]);

  const handleRead = async (id) => {
    await markAsRead(id, token);

    setNotifications(prev =>
      prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      )
    );
  };

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

// ===== UI SECTION =====
// (Do NOT modify: any n.#, fetchNotifications(), markAsRead(), or token key "access")

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

const sortedNotifications = [...notifications].sort((a, b) => {
  if (a.is_read !== b.is_read) {
    return a.is_read ? 1 : -1;
  }
  return new Date(b.created_at) - new Date(a.created_at);
});

  return (
    <div className="dash-page">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="dash-logo">TRAINING PORTAL</div>

        <div className="dash-nav">
          <button className="dash-sidebar-link" onClick={() => navigate("/member/dashboard")}>Dashboard</button>
          <button className="dash-sidebar-link" onClick={() => navigate("/member/profile")}>Profile</button>
          <button className="dash-sidebar-link" onClick={() => navigate("/member/courses")}>Courses</button>
          <button className="dash-sidebar-link active">Messages</button>
          <button className="dash-sidebar-link signout" onClick={handleSignOut}>Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <div className="dash-main">
        <div className="dash-header">
          <div className="dash-header-title">Messages</div>
        </div>

        <div className="dash-content">
          <div className="dash-card notifications-card">

            <div className="notifications-header">
              <span className="notifications-count">
                {notifications.filter(n => !n.is_read).length} Unread
              </span>
            </div>

            {notifications.length === 0 && (
              <p className="notifications-empty">No notifications.</p>
            )}

            <div className="notifications-list">
              {sortedNotifications.map(n => (
                
                <div
                  key={n.id}
                  className={`notification-item ${n.is_read ? "read" : "unread"}`}
                >
                  
                  <div className="notification-left">
                    <h4 className="notification-title">{n.title}</h4>
                    <p className="notification-message">{n.message}</p>
                  </div>


                  <div className="notification-right">
                    {n.created_at && (
                      <span className="notification-time">
                        {formatDate(n.created_at)}
                      </span>
                    )}
                    {!n.is_read && (
                      <button className="notification-btn" onClick={() => handleRead(n.id)}>Mark as Read</button>
                    )}
                  </div>

                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}