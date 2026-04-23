import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import { parseVideoUrl } from "../utils/videoUtils";
import "./Dashboard.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("access");
}

function getItemType(item) {
  return String(item?.item_type || "").toLowerCase();
}

// ── Clean SVG icon set ────────────────────────────────────────────────────────

function IconPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconText() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="17" y1="10" x2="3" y2="10" />
      <line x1="21" y1="6" x2="3" y2="6" />
      <line x1="21" y1="14" x2="3" y2="14" />
      <line x1="17" y1="18" x2="3" y2="18" />
    </svg>
  );
}

function IconQuiz() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function IconExternalLink() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function IconOpenTab() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function PdfBlock({ fileUrl }) {
  if (!fileUrl) {
    return (
      <div style={{ border: "1px solid #e4e7ec", borderRadius: "12px", padding: "20px 18px", background: "#fafafa", color: "#98a2b3", fontSize: "0.88rem" }}>
        File not available.
      </div>
    );
  }

  const fileName = fileUrl.split("/").pop();
  const iconBtnStyle = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "6px 9px", border: "1px solid #e4e7ec", borderRadius: "8px",
    background: "#fff", color: "#344054", textDecoration: "none", cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <div style={{ border: "1px solid #e4e7ec", borderRadius: "12px", padding: "14px 16px", background: "#fafafa", display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ color: "#667085", flexShrink: 0 }}><IconDocument /></div>
      <span style={{ flex: 1, fontSize: "0.85rem", color: "#344054", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {fileName}
      </span>
      <a href={fileUrl} target="_blank" rel="noreferrer" title="Open in new tab" style={iconBtnStyle}>
        <IconOpenTab />
      </a>
      <a href={fileUrl} download title="Download" style={iconBtnStyle}>
        <IconDownload />
      </a>
    </div>
  );
}

function ItemTypeIcon({ item }) {
  const type = getItemType(item);
  const map = {
    video: <IconPlay />,
    external_video: <IconPlay />,
    pdf: <IconDocument />,
    text: <IconText />,
    link: <IconLink />,
    quiz: <IconQuiz />,
  };
  return map[type] ?? null;
}

// ── Progress circle ───────────────────────────────────────────────────────────

function ProgressCircle({ status, onClick, clickable = false }) {
  const btnStyle = {
    width: 20,
    height: 20,
    minWidth: 20,
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: clickable ? "pointer" : "default",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  let inner;
  if (status === "completed") {
    inner = (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="white" stroke="#16a34a" strokeWidth="2" />
        <polyline points="6 10 9 13 14 7" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else if (status === "in_progress") {
    inner = (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="white" stroke="#e4e7ec" strokeWidth="2" />
        {/* right half arc — indicates partial progress */}
        <path d="M 10 2 A 8 8 0 0 1 10 18" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  } else if (status === "submitted_failed") {
    inner = (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="white" stroke="#c5ccd8" strokeWidth="2" />
        <polyline points="6 10 9 13 14 7" fill="none" stroke="#c5ccd8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else if (status === "pending_review") {
    inner = (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="white" stroke="#0369a1" strokeWidth="2" />
        <line x1="10" y1="10" x2="10" y2="6" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="10" y1="10" x2="13" y2="12" stroke="#0369a1" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  } else {
    inner = (
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="white" stroke="#c5ccd8" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
      style={btnStyle}
      aria-label={status === "completed" ? "Mark incomplete" : "Mark complete"}
      title={status === "completed" ? "Click to unmark" : "Click to mark complete"}
    >
      {inner}
    </button>
  );
}

// ── Video renderer ────────────────────────────────────────────────────────────

function ExternalVideoPlayer({ url }) {
  const parsed = parseVideoUrl(url);

  if (parsed.canEmbed && parsed.embedUrl) {
    return (
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: "12px", overflow: "hidden", background: "#000" }}>
        <iframe
          src={parsed.embedUrl}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
        />
      </div>
    );
  }

  // Unknown provider — clean link card
  return (
    <div style={{ border: "1px solid #e4e7ec", borderRadius: "12px", overflow: "hidden", background: "#f8fafc" }}>
      <div style={{
        height: "160px",
        background: "linear-gradient(135deg, #e4e7ec 0%, #d0d5dd 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#344054"><path d="M8 5v14l11-7z" /></svg>
        </div>
      </div>
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "0.85rem", color: "#667085", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>
          {url}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="primary-btn"
          style={{ textDecoration: "none", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          Watch <IconExternalLink />
        </a>
      </div>
    </div>
  );
}

// ── Progress updater ──────────────────────────────────────────────────────────

async function updateItemStatus(itemId, status, token) {
  const response = await fetch(`${API_BASE}/api/training/items/${itemId}/progress/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Could not update progress");
  return response.json();
}

function renderTextWithBreaks(text) {
  return String(text || "").split("\n").map((line, i) => (
    <p key={i} style={{ marginBottom: "10px", lineHeight: "1.7" }}>{line || "\u00A0"}</p>
  ));
}

function getItemDisplayStatus(entry) {
  if (entry.item_type !== "quiz") return entry.status;
  if (entry.status === "completed") return "completed";
  if (entry.status === "pending_review") return "pending_review";
  if (entry.last_attempt && !entry.last_attempt.passed) return "submitted_failed";
  return entry.status;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CourseMaterial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [item, setItem] = useState(location.state?.item || null);
  const [answers, setAnswers] = useState({});
  const [retaking, setRetaking] = useState(false);
  const [confirmUnanswered, setConfirmUnanswered] = useState(false);
  const [attemptsUsed, setAttemptsUsed] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [courseTitle, setCourseTitle] = useState(location.state?.courseTitle || "");
  const [moduleTitle, setModuleTitle] = useState(location.state?.moduleTitle || "");
  const [moduleId, setModuleId] = useState(location.state?.moduleId || null);
  const [courseId, setCourseId] = useState(location.state?.courseId || null);
  const [moduleItems, setModuleItems] = useState(location.state?.moduleItems || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => { fetchItemDetails(); }, [id]);

  // Auto-mark in_progress on first open
  useEffect(() => {
    if (!item || item.status !== "not_started") return;
    const markStarted = async () => {
      try {
        const token = getToken();
        const result = await updateItemStatus(item.id, "in_progress", token);
        setItem((prev) => ({ ...prev, status: result.status }));
        setModuleItems((prev) =>
          prev.map((e) => String(e.id) === String(item.id) ? { ...e, status: result.status } : e)
        );
      } catch { /* silent */ }
    };
    markStarted();
  }, [item?.id]);

  const fetchItemDetails = async () => {
    try {
      const token = getToken();
      if (!token) { navigate("/login"); return; }

      if (location.state?.item && location.state?.moduleItems && location.state?.courseId) {
        setLoading(false);
        return;
      }

      const courseIdFromPath = location.state?.courseId;
      if (!courseIdFromPath) throw new Error("Please open this material from the course page.");

      const response = await fetch(`${API_BASE}/api/training/courses/${courseIdFromPath}/`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (response.status === 401) {
        ["access", "access_token", "refresh", "refresh_token"].forEach((k) => localStorage.removeItem(k));
        navigate("/login");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch course material");

      const course = await response.json();
      const modules = Array.isArray(course?.modules) ? course.modules : [];
      let foundItem = null, foundModuleTitle = "", foundModuleId = null, foundModuleItems = [];

      for (const module of modules) {
        const items = Array.isArray(module?.items) ? module.items : [];
        const matched = items.find((e) => String(e.id) === String(id));
        if (matched) {
          foundItem = matched;
          foundModuleTitle = module.title || "";
          foundModuleId = module.id || null;
          foundModuleItems = items;
          break;
        }
      }

      if (!foundItem) throw new Error("Course material not found");

      setItem({
        ...foundItem,
        quiz_data: foundItem.quiz_data || location.state?.item?.quiz_data
      });
      setCourseTitle(course.title || "");
      setModuleTitle(foundModuleTitle);
      setModuleId(foundModuleId);
      setCourseId(course.id || null);
      setModuleItems(foundModuleItems);
    } catch (err) {
      setError(err.message || "Failed to load course material.");
    } finally {
      setLoading(false);
    }
  };

  const moduleProgress = useMemo(() => {
    const total = moduleItems.length;
    const completed = moduleItems.filter((e) => e?.status === "completed").length;
    return { total, completed, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [moduleItems]);

  const currentIndex = useMemo(
    () => moduleItems.findIndex((e) => String(e.id) === String(id)),
    [moduleItems, id]
  );
  const previousItem = currentIndex > 0 ? moduleItems[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < moduleItems.length - 1 ? moduleItems[currentIndex + 1] : null;

  const goToItem = (target) => {
    if (!target) return;
    navigate(`/member/material/${target.id}`, {
      state: { item: target, moduleTitle, moduleId, courseTitle, courseId, moduleItems },
    });
    setItem(target);
    setStatusMessage("");
    setError("");
  };

  const toggleItemStatus = async (itemId = id) => {
    try {
      const token = getToken();
      const current = moduleItems.find((e) => String(e.id) === String(itemId));
      const next = current?.status === "completed" ? "in_progress" : "completed";
      const result = await updateItemStatus(itemId, next, token);

      setItem((prev) => String(prev?.id) === String(itemId) ? { ...prev, status: result.status } : prev);
      setModuleItems((prev) =>
        prev.map((e) => String(e.id) === String(itemId) ? { ...e, status: result.status } : e)
      );
      setStatusMessage(result.status === "completed" ? "Marked as complete." : "Marked as in progress.");
      window.setTimeout(() => setStatusMessage(""), 1800);
    } catch {
      setError("Could not update progress. Please try again.");
    }
  };

  // Sync attempt info whenever the active item changes
  useEffect(() => {
    if (item) {
      setAttemptsUsed(item.attempts_used ?? 0);
      setMaxAttempts(item.quiz_data?.maxAttempts ?? 0);
      setAnswers({});
      setRetaking(false);
      setConfirmUnanswered(false);
    }
  }, [item?.id]);

  const handleSelect = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const actuallySubmitQuiz = async () => {
    setConfirmUnanswered(false);
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/training/items/${item.id}/submit-quiz/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403 && data.attempts_used !== undefined) {
          setAttemptsUsed(data.attempts_used);
          setMaxAttempts(data.max_attempts);
          setError(data.detail);
        } else {
          setError(data.detail || "Failed to submit quiz.");
        }
        return;
      }
      setAttemptsUsed(data.attempts_used);
      setMaxAttempts(data.max_attempts);
      setRetaking(false);
      const newLastAttempt = {
        score_percent: data.percent,
        passed: data.passed,
        submission_status: data.submission_status,
      };
      let newItemStatus;
      if (data.submission_status === "pending_review") {
        newItemStatus = "pending_review";
      } else {
        newItemStatus = data.passed ? "completed" : "in_progress";
      }
      setItem((prev) => ({ ...prev, status: newItemStatus, last_attempt: newLastAttempt }));
      setModuleItems((prev) =>
        prev.map((e) =>
          String(e.id) === String(item.id)
            ? { ...e, status: newItemStatus, last_attempt: newLastAttempt }
            : e
        )
      );
    } catch {
      setError("Could not submit quiz. Please try again.");
    }
  };

  const handleSubmitQuiz = () => {
    if (!item?.quiz_data?.questions) return;
    const unanswered = item.quiz_data.questions.filter(
      (q) => (q.question_type || "multiple_choice") === "multiple_choice" && answers[q.id] === undefined
    ).length;
    if (unanswered > 0) {
      setConfirmUnanswered(unanswered);
      return;
    }
    actuallySubmitQuiz();
  };

  const handleRetakeQuiz = () => {
    if (maxAttempts > 0 && attemptsUsed >= maxAttempts) return;
    setAnswers({});
    setRetaking(true);
    setConfirmUnanswered(false);
  };

  if (loading) return <MemberLayout title="Loading..."><div className="dash-loading">Loading...</div></MemberLayout>;
  if (error && !item) return <MemberLayout title="Course Material"><div className="dash-error">{error}</div></MemberLayout>;
  if (!item) return null;

  const itemTitle = item?.title || "Course Material";
  const itemType = getItemType(item);

  const deriveQuizPhase = () => {
    if (!item) return "form";
    const lastAttempt = item.last_attempt;
    const status = item.status;
    if (status === "pending_review") return "pending_review";
    if (lastAttempt?.submission_status === "pending_review") return "pending_review";
    if (lastAttempt) {
      if (lastAttempt.passed) return "graded_passed";
      const exhausted = maxAttempts > 0 && attemptsUsed >= maxAttempts;
      if (retaking && !exhausted) return "form";
      return exhausted ? "graded_failed_locked" : "graded_failed_retake";
    }
    return "form";
  };
  const quizPhase = deriveQuizPhase();

  return (
    <MemberLayout title={courseTitle || itemTitle}>
      {statusMessage && <div className="dash-success" style={{ marginBottom: "10px" }}>{statusMessage}</div>}
      {error && item && <div className="dash-error" style={{ marginBottom: "10px" }}>{error}</div>}

      <div style={{
        display: "grid",
        gridTemplateColumns: "252px minmax(0, 1fr)",
        border: "1px solid #e4e7ec",
        borderRadius: "16px",
        overflow: "hidden",
        background: "#fff",
        minHeight: "72vh",
      }}>
        {/* ── Sidebar ── */}
        <aside style={{
          borderRight: "1px solid #eaecf0",
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Sidebar header */}
          <div style={{ padding: "14px 16px 12px" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#98a2b3", marginBottom: "8px" }}>
              Contents
            </div>
            <div style={{ fontSize: "0.78rem", color: "#667085", marginBottom: "6px" }}>
              {moduleProgress.completed}/{moduleProgress.total} completed
            </div>
            <div style={{ width: "100%", height: 3, background: "#e4e7ec", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${moduleProgress.percent}%`, height: "100%", background: "#16a34a", transition: "width 0.3s" }} />
            </div>
          </div>

          {/* Sidebar items */}
          <div style={{ borderTop: "1px solid #eaecf0", overflowY: "auto", flex: 1 }}>
            {moduleItems.map((entry) => {
              const active = String(entry.id) === String(id);
              return (
                <div
                  key={entry.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToItem(entry)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") goToItem(entry); }}
                  style={{
                    borderLeft: active ? "3px solid #a855f7" : "3px solid transparent",
                    background: active ? "#f3f0ff" : "transparent",
                    padding: "10px 14px",
                    display: "grid",
                    gridTemplateColumns: "20px 16px minmax(0, 1fr)",
                    gap: "8px",
                    alignItems: "start",
                    cursor: "pointer",
                    transition: "background 0.1s",
                  }}
                >
                  <ProgressCircle
                    status={getItemDisplayStatus(entry)}
                    clickable
                    onClick={() => toggleItemStatus(entry.id)}
                  />
                  <div style={{ color: "#667085", display: "flex", alignItems: "center", paddingTop: "1px" }}>
                    <ItemTypeIcon item={entry} />
                  </div>
                  <div style={{ fontSize: "0.84rem", fontWeight: active ? 600 : 400, color: active ? "#1e1b4b" : "#344054", lineHeight: 1.4, wordBreak: "break-word" }}>
                    {entry.title || "Untitled"}
                    {entry.due_date && (
                      <div style={{ fontSize: "0.72rem", color: "#98a2b3", marginTop: "2px" }}>
                        Due {new Date(entry.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Content area ── */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Top nav bar */}
          <div style={{
            padding: "10px 16px",
            borderBottom: "1px solid #eaecf0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            background: "#fff",
          }}>
            {/* Breadcrumb */}
            <div>
              <div style={{ fontSize: "0.75rem", color: "#98a2b3" }}>{moduleTitle || "Module"}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#142c5c" }}>{itemTitle}</div>
            </div>

            {/* Navigation controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                onClick={() => navigate(`/member/course/${courseId}`)}
                style={{
                  border: "1px solid #e4e7ec",
                  background: "#fff",
                  color: "#344054",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ← Course
              </button>

              <button
                type="button"
                disabled={!previousItem}
                onClick={() => goToItem(previousItem)}
                title={previousItem ? `Previous: ${previousItem.title}` : "No previous item"}
                style={{
                  border: "1px solid #e4e7ec",
                  background: !previousItem ? "#f9fafb" : "#fff",
                  color: !previousItem ? "#c5ccd8" : "#344054",
                  borderRadius: "8px",
                  width: 34,
                  height: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: !previousItem ? "not-allowed" : "pointer",
                  padding: 0,
                }}
              >
                <IconArrowLeft />
              </button>

              <button
                type="button"
                disabled={!nextItem}
                onClick={() => goToItem(nextItem)}
                title={nextItem ? `Next: ${nextItem.title}` : "No next item"}
                style={{
                  border: "1px solid #e4e7ec",
                  background: !nextItem ? "#f9fafb" : "#fff",
                  color: !nextItem ? "#c5ccd8" : "#344054",
                  borderRadius: "8px",
                  width: 34,
                  height: 34,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: !nextItem ? "not-allowed" : "pointer",
                  padding: 0,
                }}
              >
                <IconArrowRight />
              </button>
            </div>
          </div>

          {/* Content body */}
          <div style={{ padding: "20px", minWidth: 0 }}>
            {/* Item header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
              <div style={{ paddingTop: "3px" }}>
                <ProgressCircle
                  status={getItemDisplayStatus(item)}
                  clickable
                  onClick={() => toggleItemStatus(item.id)}
                />
              </div>
              <div>
                <h1 style={{ fontSize: "1.3rem", fontWeight: 600, color: "#142c5c", margin: 0, lineHeight: 1.3 }}>
                  {itemTitle}
                </h1>
                {item?.due_date && (
                  <div style={{ fontSize: "0.78rem", color: "#98a2b3", marginTop: "3px" }}>
                    Due: {new Date(item.due_date).toLocaleDateString()}
                  </div>
                )}
                <div style={{ fontSize: "0.78rem", color: "#98a2b3", marginTop: "2px" }}>
                  {itemType === "quiz"
                    ? (quizPhase === "graded_passed" ? "✓ Completed · Passed"
                      : quizPhase === "graded_failed_locked" || quizPhase === "graded_failed_retake" ? "Completed · Did not pass"
                      : quizPhase === "pending_review" ? "⏳ Submitted · Awaiting review"
                      : item.status === "in_progress" ? "In progress" : "Not started")
                    : (item.status === "completed" ? "✓ Completed" : item.status === "in_progress" ? "In progress" : "Not started")}
                  {itemType !== "quiz" && (
                    <>
                      {" · "}
                      <button
                        type="button"
                        onClick={() => toggleItemStatus(item.id)}
                        style={{ border: "none", background: "none", padding: 0, color: "#6366f1", cursor: "pointer", fontSize: "0.78rem", fontWeight: 500 }}
                      >
                        {item.status === "completed" ? "Unmark" : "Mark complete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content renderer */}
            {itemType === "video" && item?.file_url ? (
              <div style={{ borderRadius: "12px", overflow: "hidden", background: "#000" }}>
                <video controls style={{ width: "100%", maxHeight: "460px", display: "block" }} src={item.file_url}>
                  Your browser does not support video playback.
                </video>
              </div>

            ) : itemType === "external_video" && item?.external_url ? (
              <ExternalVideoPlayer url={item.external_url} />

            ) : itemType === "pdf" ? (
              <PdfBlock fileUrl={item?.file_url} />

            ) : itemType === "link" && item?.external_url ? (
              <div style={{ border: "1px solid #e4e7ec", borderRadius: "12px", padding: "16px 18px", background: "#fafafa", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ color: "#667085" }}><IconLink /></div>
                <div style={{ flex: 1, fontSize: "0.85rem", color: "#344054", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.external_url}
                </div>
                <a href={item.external_url} target="_blank" rel="noreferrer" className="primary-btn"
                  style={{ textDecoration: "none", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                  Open Link <IconExternalLink />
                </a>
              </div>

            ) : itemType === "text" ? (
              <div style={{ border: "1px solid #e4e7ec", borderRadius: "12px", padding: "18px 20px", background: "#fff", color: "#344054", fontSize: "0.95rem", lineHeight: 1.75 }}>
                {renderTextWithBreaks(item?.text_content || "")}
              </div>

            ) : itemType === "quiz" ? (
              <div style={{ border: "1px solid #e4e7ec", borderRadius: "12px", padding: "18px 20px" }}>

                {/* Pending review state */}
                {quizPhase === "pending_review" && (
                  <div style={{ textAlign: "center", padding: "24px 16px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>⏳</div>
                    <h3 style={{ margin: "0 0 8px", color: "#0369a1" }}>Submitted — Awaiting Review</h3>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#667085" }}>
                      Your short answer responses have been submitted and are pending instructor review. You'll see your score once graded.
                    </p>
                  </div>
                )}

                {/* Passed state */}
                {quizPhase === "graded_passed" && (
                  <div style={{ textAlign: "center", padding: "24px 16px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>✅</div>
                    <h3 style={{ margin: "0 0 8px", color: "#16a34a" }}>Passed!</h3>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "#667085" }}>
                      Score: {item.last_attempt?.score_percent ?? 0}%
                    </p>
                  </div>
                )}

                {/* Failed — no retakes left */}
                {quizPhase === "graded_failed_locked" && (
                  <div style={{ textAlign: "center", padding: "24px 16px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📋</div>
                    <h3 style={{ margin: "0 0 8px", color: "#374151" }}>Did not pass</h3>
                    <p style={{ margin: "0 0 4px", fontSize: "0.9rem", color: "#667085" }}>
                      Score: {item.last_attempt?.score_percent ?? 0}%
                    </p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#98a2b3" }}>
                      No attempts remaining.
                    </p>
                  </div>
                )}

                {/* Failed — retake available */}
                {quizPhase === "graded_failed_retake" && (
                  <div style={{ textAlign: "center", padding: "24px 16px" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📋</div>
                    <h3 style={{ margin: "0 0 8px", color: "#374151" }}>Did not pass</h3>
                    <p style={{ margin: "0 0 16px", fontSize: "0.9rem", color: "#667085" }}>
                      Score: {item.last_attempt?.score_percent ?? 0}%
                      {maxAttempts > 0 && ` · ${maxAttempts - attemptsUsed} attempt${maxAttempts - attemptsUsed !== 1 ? "s" : ""} remaining`}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetakeQuiz}
                      style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid #e4e7ec", background: "#f3f4f6", color: "#111", cursor: "pointer", fontWeight: 500 }}
                    >
                      Start new attempt
                    </button>
                  </div>
                )}

                {/* Active form */}
                {quizPhase === "form" && (
                  <>
                    {maxAttempts > 0 && (
                      <div style={{ marginBottom: "14px", fontSize: "0.82rem", color: "#667085" }}>
                        Attempt {attemptsUsed + 1} of {maxAttempts}
                      </div>
                    )}

                    {item?.quiz_data?.questions?.length ? (
                      <>
                        {item.quiz_data.questions.map((q, qIndex) => (
                          <div key={q.id || qIndex} style={{ marginBottom: "20px" }}>
                            <div style={{ fontWeight: "600", marginBottom: "10px" }}>
                              {qIndex + 1}. {q.prompt}
                              {q.points && <span style={{ fontWeight: 400, color: "#98a2b3", fontSize: "0.82rem", marginLeft: "8px" }}>({q.points} pt{q.points !== 1 ? "s" : ""})</span>}
                            </div>

                            {(q.question_type || "multiple_choice") === "multiple_choice" ? (
                              q.options.map((opt) => (
                                <label key={opt.id} style={{ display: "block", marginBottom: "6px", cursor: "pointer" }}>
                                  <input
                                    type="radio"
                                    name={`question-${q.id}`}
                                    value={opt.id}
                                    checked={answers[q.id] === opt.id}
                                    onChange={() => handleSelect(q.id, opt.id)}
                                    style={{ marginRight: "8px" }}
                                  />
                                  {opt.text}
                                </label>
                              ))
                            ) : (
                              <textarea
                                value={answers[q.id] || ""}
                                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Write your answer here..."
                                rows={4}
                                style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #e4e7ec", fontSize: "0.9rem", resize: "vertical", boxSizing: "border-box" }}
                              />
                            )}
                          </div>
                        ))}

                        {confirmUnanswered > 0 && (
                          <div style={{ background: "#f9fafb", border: "1px solid #e4e7ec", borderRadius: "8px", padding: "12px 14px", marginBottom: "12px" }}>
                            <p style={{ margin: "0 0 10px", fontSize: "0.88rem", color: "#374151" }}>
                              {confirmUnanswered} question{confirmUnanswered !== 1 ? "s" : ""} left unanswered — {confirmUnanswered !== 1 ? "they" : "it"} will be marked incorrect.
                            </p>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button type="button" onClick={() => setConfirmUnanswered(false)}
                                style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #e4e7ec", background: "#fff", color: "#374151", cursor: "pointer", fontSize: "0.84rem" }}>
                                Go back
                              </button>
                              <button type="button" onClick={actuallySubmitQuiz}
                                style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontSize: "0.84rem" }}>
                                Submit anyway
                              </button>
                            </div>
                          </div>
                        )}

                        {confirmUnanswered === false && (
                          <button type="button" onClick={handleSubmitQuiz}
                            style={{ marginTop: "10px", padding: "8px 14px", borderRadius: "8px", border: "1px solid #e4e7ec", background: "#2563eb", color: "white", cursor: "pointer" }}>
                            Submit Quiz
                          </button>
                        )}
                      </>
                    ) : (
                      <div>No quiz questions available.</div>
                    )}
                  </>
                )}
              </div>
          ) : (
            <div className="dash-empty-panel">No content available for this item yet.</div>
          )}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
