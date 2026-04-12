import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchNotifications, markAsRead } from "../api/notifications";
import MemberLayout from "../../components/MemberLayout";
import "./Notifications.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("access");
}

async function markAllRead(token) {
  const response = await fetch(`${API_BASE}/api/notifications/read-all/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to mark all as read");
}

// ── Type config ───────────────────────────────────────────────────────────────
// Maps backend notification_type → display label, colors, icon

const TYPE_CONFIG = {
  // Instructor-to-member types
  announcement: { label: "Announcement", color: "#2563eb", bg: "#eff6ff", dot: "#2563eb" },
  reminder:     { label: "Reminder",     color: "#d97706", bg: "#fffbeb", dot: "#d97706" },
  general:      { label: "Message",      color: "#6b7280", bg: "#f9fafb", dot: "#6b7280" },
  // System types
  assigned:     { label: "Assigned",     color: "#2563eb", bg: "#eff6ff", dot: "#2563eb" },
  due_today:    { label: "Due Today",    color: "#dc2626", bg: "#fef2f2", dot: "#dc2626" },
  due_soon:     { label: "Due Soon",     color: "#d97706", bg: "#fffbeb", dot: "#d97706" },
  info:         { label: "Info",         color: "#6b7280", bg: "#f9fafb", dot: "#6b7280" },
  warning:      { label: "Warning",      color: "#d97706", bg: "#fffbeb", dot: "#d97706" },
  success:      { label: "Success",      color: "#16a34a", bg: "#f0fdf4", dot: "#16a34a" },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.info;
}

const FILTERS = ["All", "Unread", "Announcements", "Reminders", "Messages"];

const FILTER_MAP = {
  "Announcements": ["announcement", "assigned"],
  "Reminders":     ["reminder", "due_soon", "due_today"],
  "Messages":      ["general", "info", "warning", "success"],
};

// ── Full message modal ────────────────────────────────────────────────────────

function MessageModal({ notification, onClose, onMarkRead }) {
  const config = getTypeConfig(notification.notification_type);
  const navigate = useNavigate();

  useEffect(() => {
    if (!notification.is_read) onMarkRead(notification.id);
  }, []);

  return (
    <div className="ntf-overlay" onClick={onClose}>
      <div className="ntf-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ntf-modal-header">
          <span className="ntf-badge" style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}22` }}>
            {config.label}
          </span>
          <button type="button" className="ntf-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <h2 className="ntf-modal-title">{notification.title}</h2>
        {notification.course_name && (
          <p className="ntf-modal-course">{notification.course_name}</p>
        )}
        <p className="ntf-modal-message">{notification.message}</p>
        <div className="ntf-modal-footer">
          <span className="ntf-modal-time">
            {new Date(notification.created_at).toLocaleString("en-US", {
              month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </span>
          {notification.course_id && (
            <button
              type="button"
              className="ntf-go-btn"
              onClick={() => { onClose(); navigate(`/member/course/${notification.course_id}`); }}
            >
              Go to Course
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Notification row ──────────────────────────────────────────────────────────

function NotificationRow({ notification, onRead, onOpen }) {
  const config = getTypeConfig(notification.notification_type);

  return (
    <div
      className={`ntf-row ${notification.is_read ? "ntf-row--read" : "ntf-row--unread"}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notification)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpen(notification); }}
    >
      {/* Unread dot */}
      <div className="ntf-row__dot-col">
        {!notification.is_read && (
          <span className="ntf-dot" style={{ background: config.dot }} />
        )}
      </div>

      <div className="ntf-row__body">
        <div className="ntf-row__top">
          <span className="ntf-badge" style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}22` }}>
            {config.label}
          </span>
          {notification.course_name && (
            <span className="ntf-row__course">{notification.course_name}</span>
          )}
          <span className="ntf-row__time">
            {new Date(notification.created_at).toLocaleString("en-US", {
              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </span>
        </div>

        <div className="ntf-row__title">{notification.title}</div>
        <p className="ntf-row__preview">{notification.message}</p>
      </div>

      {!notification.is_read && (
        <button
          type="button"
          className="ntf-mark-btn"
          onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
          title="Mark as read"
        >
          Mark read
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const token = getToken();

  useEffect(() => {
    if (!token) return;
    fetchNotifications(token)
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch((err) => console.error("Notification fetch failed:", err))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRead = async (id) => {
    try {
      await markAsRead(id, token);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const sorted = [...notifications].sort((a, b) => {
    if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const filtered = sorted.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !n.is_read;
    const types = FILTER_MAP[activeFilter];
    return types ? types.includes(n.notification_type) : true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <MemberLayout title="Notifications">
      <div className="ntf-page">
        {/* Header */}
        <div className="ntf-header">
          <div>
            <h1 className="ntf-title">Notifications</h1>
            <p className="ntf-subtitle">
              {unreadCount > 0 ? `${unreadCount} unread` : "You are all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button className="ntf-markall-btn" onClick={handleMarkAllRead} disabled={markingAll}>
              {markingAll ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="ntf-filters">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`ntf-filter-btn ${activeFilter === f ? "ntf-filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
              {f === "Unread" && unreadCount > 0 && (
                <span className="ntf-filter-count">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="ntf-empty">Loading notifications...</div>
        ) : filtered.length === 0 ? (
          <div className="ntf-empty">
            {activeFilter === "All"
              ? "No notifications yet. Announcements, reminders, and course updates will appear here."
              : `No ${activeFilter.toLowerCase()} notifications.`}
          </div>
        ) : (
          <div className="ntf-list">
            {filtered.map((n) => (
              <NotificationRow
                key={n.id}
                notification={n}
                onRead={handleRead}
                onOpen={setSelected}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <MessageModal
          notification={selected}
          onClose={() => setSelected(null)}
          onMarkRead={handleRead}
        />
      )}
    </MemberLayout>
  );
}
