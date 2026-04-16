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

const DELETABLE_TYPES = new Set(["reminder", "general"]);

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="ntf-overlay" onClick={onCancel}>
      <div className="ntf-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ntf-modal-header">
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>Delete notification?</span>
          <button type="button" className="ntf-modal-close" onClick={onCancel} aria-label="Close">×</button>
        </div>
        <p style={{ fontSize: "0.9rem", color: "#374151", margin: "0 0 24px" }}>
          This will permanently remove the notification. This action cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            type="button"
            className="ntf-markall-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            style={{
              background: "#dc2626", color: "#fff", border: "none",
              borderRadius: "8px", padding: "8px 18px", fontWeight: 700,
              fontSize: "13px", cursor: "pointer",
            }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

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

function NotificationRow({ notification, onRead, onOpen, onDelete }) {
  const config = getTypeConfig(notification.notification_type);
  const canDelete = DELETABLE_TYPES.has(notification.notification_type);

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

      <div className="ntf-row__actions" onClick={(e) => e.stopPropagation()}>
        {!notification.is_read && (
          <button
            type="button"
            className="ntf-mark-btn"
            onClick={() => onRead(notification.id)}
            title="Mark as read"
          >
            Mark read
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="ntf-delete-btn"
            onClick={() => onDelete(notification.id)}
            title="Delete notification"
            aria-label="Delete notification"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </button>
        )}
      </div>
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
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
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

  const handleDelete = async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      const response = await fetch(`${API_BASE}/api/notifications/${id}/delete/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selected?.id === id) setSelected(null);
      }
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
                onDelete={setPendingDeleteId}
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

      {pendingDeleteId !== null && (
        <DeleteConfirmModal
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={handleDelete}
        />
      )}
    </MemberLayout>
  );
}
