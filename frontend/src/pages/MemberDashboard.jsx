import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("access");
}

function getStatusLabel(status) {
  switch (status) {
    case "completed":  return "Completed";
    case "in_progress": return "In Progress";
    default: return "Not Started";
  }
}

// ── Activity stream helpers ───────────────────────────────────────────────────

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function buildActivityStream(courses, notifications) {
  const items = [];

  // Due-date items from courses
  courses.forEach((course) => {
    if (!course.due_date || course.status === "completed") return;
    const days = daysUntil(course.due_date);
    if (days === null || days < 0) return;

    let urgency = "normal";
    let label = "";
    if (days === 0) { urgency = "urgent"; label = "Due today"; }
    else if (days <= 3) { urgency = "soon";   label = `Due in ${days} day${days === 1 ? "" : "s"}`; }
    else if (days <= 7) { urgency = "coming"; label = `Due in ${days} days`; }
    else { label = `Due ${new Date(course.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`; }

    items.push({ id: `due-${course.id}`, type: "due", urgency, label, title: course.title, courseId: course.id, days });
  });

  // Announcements & reminders from notifications (last 5, unread first)
  const notifItems = [...notifications]
    .filter((n) => ["announcement", "reminder", "general", "info"].includes(n.notification_type))
    .sort((a, b) => {
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    })
    .slice(0, 3);

  notifItems.forEach((n) => {
    items.push({ id: `notif-${n.id}`, type: "notif", notifType: n.notification_type, title: n.title, message: n.message, is_read: n.is_read, courseId: n.course_id, courseName: n.course_name });
  });

  // Sort: urgent due dates first, then by days
  items.sort((a, b) => {
    const urgencyOrder = { urgent: 0, soon: 1, coming: 2, normal: 3, notif: 4 };
    const ao = a.type === "notif" ? 4 : urgencyOrder[a.urgency] ?? 3;
    const bo = b.type === "notif" ? 4 : urgencyOrder[b.urgency] ?? 3;
    if (ao !== bo) return ao - bo;
    if (a.type === "due" && b.type === "due") return (a.days ?? 999) - (b.days ?? 999);
    return 0;
  });

  return items;
}

const URGENCY_COLORS = {
  urgent: { dot: "#dc2626", label: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  soon:   { dot: "#d97706", label: "#d97706", bg: "#fffbeb", border: "#fde68a" },
  coming: { dot: "#2563eb", label: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  normal: { dot: "#6b7280", label: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

const NOTIF_COLORS = {
  announcement: { dot: "#2563eb", label: "Announcement", bg: "#eff6ff" },
  reminder:     { dot: "#d97706", label: "Reminder",     bg: "#fffbeb" },
  general:      { dot: "#6b7280", label: "Message",      bg: "#f9fafb" },
  info:         { dot: "#6b7280", label: "Info",         bg: "#f9fafb" },
};

function ActivityItem({ item, onNavigate }) {
  if (item.type === "due") {
    const c = URGENCY_COLORS[item.urgency] || URGENCY_COLORS.normal;
    return (
      <div className="act-item" style={{ borderLeft: `3px solid ${c.dot}` }}>
        <div className="act-item__left">
          <span className="act-badge" style={{ color: c.label, background: c.bg, border: `1px solid ${c.border}` }}>
            {item.label}
          </span>
          <span className="act-item__title">{item.title}</span>
        </div>
        <button
          type="button"
          className="secondary-btn act-view-btn"
          onClick={() => onNavigate(`/member/course/${item.courseId}`)}
        >
          View
        </button>
      </div>
    );
  }

  const nc = NOTIF_COLORS[item.notifType] || NOTIF_COLORS.info;
  return (
    <div className="act-item" style={{ borderLeft: `3px solid ${nc.dot}` }}>
      <div className="act-item__left">
        <span className="act-badge" style={{ color: nc.dot, background: nc.bg, border: `1px solid ${nc.dot}22` }}>
          {nc.label}
        </span>
        <span className="act-item__title">
          {item.title}
          {item.courseName && <span className="act-item__course"> · {item.courseName}</span>}
        </span>
      </div>
      {item.courseId && (
        <button
          type="button"
          className="secondary-btn act-view-btn"
          onClick={() => onNavigate(`/member/course/${item.courseId}`)}
        >
          View
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function MemberDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = getToken();
      if (!token) { navigate("/login"); return; }

      const [coursesRes, profileRes, notifRes] = await Promise.all([
        fetch(`${API_BASE}/api/training/courses/`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/training/me/`,      { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/notifications/`,    { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (coursesRes.status === 401 || profileRes.status === 401) {
        ["access", "access_token", "refresh", "refresh_token"].forEach((k) => localStorage.removeItem(k));
        navigate("/login");
        return;
      }

      if (!coursesRes.ok) throw new Error("Failed to fetch dashboard data");

      const coursesData = await coursesRes.json();
      setCourses(Array.isArray(coursesData) ? coursesData : []);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (notifRes.ok) {
        const nd = await notifRes.json();
        setNotifications(Array.isArray(nd) ? nd : []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MemberLayout title="Dashboard">
        <div className="dash-loading">Loading your dashboard...</div>
      </MemberLayout>
    );
  }

  if (error) {
    return (
      <MemberLayout title="Dashboard">
        <div className="dash-error">
          <p>Error loading dashboard: {error}</p>
          <button onClick={fetchDashboardData} className="dash-retry-btn">Try Again</button>
        </div>
      </MemberLayout>
    );
  }

  const visibleCourses = courses.filter(
    (c) => c?.is_published !== false && c?.published !== false && c?.visible !== false
  );

  const courseItems = visibleCourses.map((course) => {
    const p = course.progress || { completed: 0, total: 0, percent: 0, status: "not_started" };
    return {
      id: course.id,
      title: course.title || "Untitled Course",
      status: p.status,
      due_date: course.due_date || null,
      required: course.required ?? true,
      locked: course.locked ?? false,
      progress_percent: p.percent,
    };
  });

  const requiredOnly  = courseItems.filter((c) => c.required);
  const completedCount = requiredOnly.filter((c) => c.status === "completed").length;
  const inProgressCount = courseItems.filter((c) => c.status === "in_progress").length;
  const notStartedCount = courseItems.filter((c) => c.status === "not_started").length;

  const progress = {
    completed_required: completedCount,
    total_required: requiredOnly.length,
    percent_complete: requiredOnly.length > 0 ? Math.round((completedCount / requiredOnly.length) * 100) : 0,
  };

  const activityStream = buildActivityStream(courseItems, notifications);

  const user = {
    name: profile?.name || "Member",
    member_id: profile?.member_id || "—",
  };

  return (
    <MemberLayout title={`Welcome, ${user.name}!`}>
      <div className="dash-dashboard-grid">
        {/* Left: overall progress */}
        <section className="dash-card progress-card">
          <div
            className="dash-progress-circle"
            style={{ "--progress-deg": `${progress.percent_complete * 3.6}deg` }}
          >
            <div className="dash-progress-inner">
              <div className="dash-progress-number">{progress.percent_complete}%</div>
              <div className="dash-progress-caption">Completed</div>
            </div>
          </div>

          <div className="dash-progress-text">
            <p className="dash-eyebrow">Overall Progress</p>
            <h2 className="dash-block-title">Leadership Training</h2>
            <p className="dash-subtext">
              {visibleCourses.length} course{visibleCourses.length === 1 ? "" : "s"} enrolled
            </p>
            <p className="dash-meta-line">Account ID: {user.member_id}</p>

            <div className="dash-course-summary-list">
              {courseItems.slice(0, 3).map((course) => (
                <div key={course.id} className="dash-course-row">
                  <div className="dash-course-row-top">
                    <div className="dash-course-name">{course.title}</div>
                    <div className={`dash-status-badge ${course.status}`}>
                      {getStatusLabel(course.status)}
                    </div>
                  </div>
                  <div className="dash-progress-bar">
                    <div className={`dash-progress-fill ${course.status}`} style={{ width: `${course.progress_percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: activity stream */}
        <section className="dash-card reminders-card">
          <div className="dash-section-head" style={{ marginBottom: "14px" }}>
            <div className="dash-section-title" style={{ marginBottom: 0 }}>Activity &amp; Reminders</div>
            <button
              type="button"
              className="secondary-btn"
              style={{ fontSize: "0.82rem", padding: "6px 12px" }}
              onClick={() => navigate("/member/notifications")}
            >
              View all
            </button>
          </div>

          {activityStream.length === 0 ? (
            <div className="dash-empty-panel">No upcoming deadlines or messages.</div>
          ) : (
            <div className="act-stream">
              {activityStream.slice(0, 5).map((item) => (
                <ActivityItem key={item.id} item={item} onNavigate={navigate} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="dash-dashboard-bottom">
        {/* Courses list */}
        <section className="dash-card">
          <div className="dash-section-head">
            <div className="dash-section-title">
              Required Courses ({progress.completed_required}/{progress.total_required})
            </div>
            <button type="button" className="secondary-btn" onClick={() => navigate("/member/courses")}>
              View All
            </button>
          </div>

          <div className="dash-module-list">
            {courseItems.map((course) => (
              <div key={course.id} className="dash-module-item">
                <div className="dash-module-item-top">
                  <div className="dash-course-info">
                    <span className="dash-course-name">{course.title}</span>
                    {course.required && <span className="dash-required-badge">Required</span>}
                    {course.locked && <span className="dash-locked-badge">Locked</span>}
                  </div>
                  <div className={`dash-status-badge ${course.status}`}>
                    {getStatusLabel(course.status)}
                  </div>
                </div>

                <div className="dash-progress-bar">
                  <div className={`dash-progress-fill ${course.status}`} style={{ width: `${course.progress_percent}%` }} />
                </div>

                <div className="dash-module-item-actions">
                  <button
                    type="button"
                    className={course.locked ? "disabled-btn" : "primary-btn"}
                    onClick={() => navigate(`/member/course/${course.id}`)}
                    disabled={course.locked}
                  >
                    {course.locked ? "Locked" : "Open Course"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="dash-card dash-stat-grid">
          <div className="dash-stat-card">
            <span className="dash-stat-label">Completed</span>
            <span className="dash-stat-value">{progress.completed_required}</span>
            <span className="dash-stat-unit">courses</span>
          </div>

          <div className="dash-stat-card">
            <span className="dash-stat-label">In Progress</span>
            <span className="dash-stat-value">{inProgressCount}</span>
            <span className="dash-stat-unit">courses</span>
          </div>

          <div className="dash-stat-card">
            <span className="dash-stat-label">Not Started</span>
            <span className="dash-stat-value">{notStartedCount}</span>
            <span className="dash-stat-unit">courses</span>
          </div>
        </section>
      </div>
    </MemberLayout>
  );
}
