import { useEffect, useState } from "react";
import { fetchNotifications, markAsRead } from "../api/notifications";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";
import "./Notifications.css";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) return;

    fetchNotifications(token)
      .then((data) => {
        if (Array.isArray(data)) {
          setNotifications(data);
        } else {
          console.error("Unexpected response:", data);
        }
      })
      .catch((err) => {
        console.error("Notification fetch failed:", err);
      });
  }, [token]);

  const handleRead = async (id) => {
    try {
      await markAsRead(id, token);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (err) {
      console.error("Mark as read failed:", err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.is_read !== b.is_read) {
      return a.is_read ? 1 : -1;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <MemberLayout title="Messages">
      <div className="dash-card notifications-card">
        <div className="notifications-header">
          <span className="notifications-count">
            {unreadCount} Unread
          </span>
        </div>

        {notifications.length === 0 && (
          <div className="dash-empty-panel notifications-empty">
            You have no messages yet. When you get messages, they will appear here.
          </div>
        )}

        <div className="notifications-list">
          {sortedNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${notification.is_read ? "read" : "unread"}`}
            >
              <div className="notification-left">
                <h4 className="notification-title">{notification.title}</h4>
                <p className="notification-message">{notification.message}</p>
              </div>

              <div className="notification-right">
                {notification.created_at && (
                  <span className="notification-time">
                    {formatDate(notification.created_at)}
                  </span>
                )}

                {!notification.is_read && (
                  <button
                    className="notification-btn"
                    onClick={() => handleRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MemberLayout>
  );
}
