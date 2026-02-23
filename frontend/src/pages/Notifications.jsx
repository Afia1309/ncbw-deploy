import { useEffect, useState } from "react";
import { fetchNotifications, markAsRead } from "../api/notifications"; // API to backend

// ===== LOGIC SECTION =====

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("access_token");

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

// ===== UI SECTION =====
// (Feel free to modify visuals as you see fit - EB)
// (Do NOT modify: any n.#, fetchNotifications(), markAsRead(), or token key "access")

  return (
    <div style={{ padding: 24 }}>

      <h1>Notifications</h1>

      {notifications.length === 0 && <p>No notifications.</p>}

      {/* Notification list renderer */}
      {/* Do NOT change key={n.id} */}
      {notifications.map(n => (
        <div
          key={n.id}
          style={{
            border: "1px solid #ccc",
            margin: "10px 0",
            padding: "10px",
            background: n.is_read ? "#eee" : "#fff"
          }}
        >

          <h3>{n.title}</h3>
          <p>{n.message}</p>

          {/* Show button only if unread */}
          {!n.is_read && (
            <button onClick={() => handleRead(n.id)}>
              Mark as Read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
