import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InstructorLayout from "../components/InstructorLayout";
import "./InstructorNotificationCenter.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api`;

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("access") || "";
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    let detail = `Request failed: ${response.status}`;
    try {
      const errData = await response.json();
      if (errData?.detail) detail = errData.detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  if (response.status === 204) return null;
  return response.json();
}

// ── Type config ───────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  assigned: {
    label: "Assigned",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  due_today: {
    label: "Due Today",
    color: "#dc2626",
    bg: "#fef2f2",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  due_soon: {
    label: "Due Soon",
    color: "#d97706",
    bg: "#fffbeb",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  info: {
    label: "Info",
    color: "#6b7280",
    bg: "#f9fafb",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  warning: {
    label: "Warning",
    color: "#d97706",
    bg: "#fffbeb",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  success: {
    label: "Success",
    color: "#16a34a",
    bg: "#f0fdf4",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  announcement: {
    label: "Announcement",
    color: "#2563eb",
    bg: "#eff6ff",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  reminder: {
    label: "Reminder",
    color: "#d97706",
    bg: "#fffbeb",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  general: {
    label: "Message",
    color: "#6b7280",
    bg: "#f9fafb",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  feedback: {
    label: "Feedback",
    color: "#7c3aed",
    bg: "#f5f3ff",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.info;
}

// ── Notification card ─────────────────────────────────────────────────────────

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

function NotificationCard({ notification, onMarkRead, onCourseClick, onDelete }) {
  const config = getTypeConfig(notification.notification_type);
  const date = new Date(notification.created_at);
  const timeStr = date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`inc-card ${notification.is_read ? "inc-card--read" : "inc-card--unread"}`}>
      {!notification.is_read && (
        <div className="inc-card__accent" style={{ background: config.color }} />
      )}
      <div className="inc-card__body">
        <div className="inc-card__top">
          <span
            className="inc-badge"
            style={{ color: config.color, background: config.bg, border: `1px solid ${config.color}22` }}
          >
            <span className="inc-badge__icon">{config.icon}</span>
            {config.label}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="inc-card__time">{timeStr}</span>
            <button
              type="button"
              onClick={() => onDelete(notification.id)}
              style={{ border: "none", background: "none", padding: "2px", cursor: "pointer", color: "#98a2b3", display: "inline-flex", alignItems: "center" }}
              title="Delete notification"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
        <div className="inc-card__title">{notification.title}</div>
        <p className="inc-card__message">{notification.message}</p>
        <div className="inc-card__actions">
          {notification.course_id && (
            <button
              type="button"
              className="inc-btn inc-btn--secondary"
              onClick={() => onCourseClick(notification.course_id)}
            >
              View Course
            </button>
          )}
          {!notification.is_read && (
            <button
              type="button"
              className="inc-btn inc-btn--ghost"
              onClick={() => onMarkRead(notification.id)}
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Compose panel ─────────────────────────────────────────────────────────────

function ComposePanel({ courses }) {
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("announcement");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { ok, text }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!courseId || !title.trim() || !message.trim()) return;
    try {
      setSending(true);
      setResult(null);
      const data = await apiFetch(`/training/instructor/courses/${courseId}/notify/`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), message: message.trim(), notification_type: type }),
      });
      setResult({ ok: true, text: `Sent to ${data.sent_to} member${data.sent_to !== 1 ? "s" : ""}.` });
      setTitle("");
      setMessage("");
    } catch (err) {
      setResult({ ok: false, text: err?.message || "Failed to send. Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="inc-compose">
      <p className="inc-compose__help">
        Send a message directly to all members enrolled in one of your courses.
      </p>

      <form onSubmit={handleSend} className="inc-compose__form">
        <div className="inc-compose__field">
          <label className="inc-compose__label" htmlFor="compose-course">Course</label>
          <select
            id="compose-course"
            className="inc-compose__select"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
          >
            <option value="">Select a course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name || c.title}</option>
            ))}
          </select>
        </div>

        <div className="inc-compose__field">
          <label className="inc-compose__label" htmlFor="compose-type">Type</label>
          <select
            id="compose-type"
            className="inc-compose__select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="announcement">Announcement</option>
            <option value="reminder">Reminder</option>
            <option value="general">General Message</option>
          </select>
        </div>

        <div className="inc-compose__field">
          <label className="inc-compose__label" htmlFor="compose-title">Subject</label>
          <input
            id="compose-title"
            type="text"
            className="inc-compose__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Reminder: Module 2 due this week"
            maxLength={255}
            required
          />
        </div>

        <div className="inc-compose__field">
          <label className="inc-compose__label" htmlFor="compose-message">Message</label>
          <textarea
            id="compose-message"
            className="inc-compose__textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows={5}
            required
          />
        </div>

        {result && (
          <div className={`inc-compose__result ${result.ok ? "inc-compose__result--ok" : "inc-compose__result--err"}`}>
            {result.text}
          </div>
        )}

        <button
          type="submit"
          className="inc-btn inc-btn--primary"
          disabled={sending || !courseId || !title.trim() || !message.trim()}
        >
          {sending ? "Sending..." : "Send to enrolled members"}
        </button>
      </form>
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteConfirmModal({ onCancel, onConfirm }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.28)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "24px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff", borderRadius: "16px", width: "100%", maxWidth: "420px",
          padding: "24px 28px 28px", boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "#111827" }}>Delete notification?</span>
          <button
            type="button"
            onClick={onCancel}
            style={{ background: "none", border: "none", fontSize: "24px", color: "#9ca3af", cursor: "pointer", lineHeight: 1, padding: 0 }}
            aria-label="Close"
          >×</button>
        </div>
        <p style={{ fontSize: "0.9rem", color: "#374151", margin: "0 0 24px" }}>
          This will permanently remove the notification. This action cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" className="inc-btn inc-btn--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            style={{
              background: "#dc2626", color: "#fff", border: "none", borderRadius: "8px",
              padding: "8px 18px", fontWeight: 700, fontSize: "13px", cursor: "pointer",
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

// ── Main component ────────────────────────────────────────────────────────────

const NOTIF_FILTERS = ["All", "Unread", "Assigned", "Due Soon", "Due Today"];

export default function InstructorNotificationCenter() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("feed"); // "feed" | "compose"
  const [notifications, setNotifications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [markingAll, setMarkingAll] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    loadNotifications();
    loadCourses();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/notifications/");
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await apiFetch("/training/instructor/courses/");
      setCourses(Array.isArray(data) ? data : []);
    } catch { /* non-critical */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await apiFetch(`/notifications/${id}/read/`, { method: "POST" });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await apiFetch(`/notifications/${id}/delete/`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await apiFetch("/notifications/read-all/", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const typeFilterMap = {
    "Assigned": "assigned",
    "Due Soon": "due_soon",
    "Due Today": "due_today",
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return !n.is_read;
    return n.notification_type === typeFilterMap[activeFilter];
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <InstructorLayout breadcrumbs={[{ label: "Notifications", path: "/instructor/notifications" }]}>
      <div className="inc-page">
        {/* Page header */}
        <div className="inc-header">
          <div>
            <h1 className="inc-title">Notifications</h1>
            <p className="inc-subtitle">
              {tab === "feed"
                ? (unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "All caught up")
                : "Send a message to course members"}
            </p>
          </div>

          {tab === "feed" && unreadCount > 0 && (
            <button
              type="button"
              className="inc-btn inc-btn--secondary"
              onClick={handleMarkAllRead}
              disabled={markingAll}
            >
              {markingAll ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="inc-tabs">
          <button
            type="button"
            className={`inc-tab ${tab === "feed" ? "inc-tab--active" : ""}`}
            onClick={() => setTab("feed")}
          >
            My Notifications
            {unreadCount > 0 && <span className="inc-filter-count">{unreadCount}</span>}
          </button>
          <button
            type="button"
            className={`inc-tab ${tab === "compose" ? "inc-tab--active" : ""}`}
            onClick={() => setTab("compose")}
          >
            Send Message
          </button>
        </div>

        {tab === "compose" ? (
          <ComposePanel courses={courses} />
        ) : (
          <>
            {/* Filter tabs */}
            <div className="inc-filters">
              {NOTIF_FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`inc-filter-btn ${activeFilter === f ? "inc-filter-btn--active" : ""}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                  {f === "Unread" && unreadCount > 0 && (
                    <span className="inc-filter-count">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="inc-empty">Loading notifications...</div>
            ) : error ? (
              <div className="inc-empty inc-empty--error">{error}</div>
            ) : filtered.length === 0 ? (
              <div className="inc-empty">
                {activeFilter === "All"
                  ? "No notifications yet. Course assignments and updates will appear here."
                  : `No ${activeFilter.toLowerCase()} notifications.`}
              </div>
            ) : (
              <div className="inc-list">
                {filtered.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onMarkRead={handleMarkRead}
                    onDelete={setPendingDeleteId}
                    onCourseClick={(courseId) => navigate(`/instructor/courses/${courseId}`)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {pendingDeleteId !== null && (
        <DeleteConfirmModal
          onCancel={() => setPendingDeleteId(null)}
          onConfirm={handleDelete}
        />
      )}
    </InstructorLayout>
  );
}
