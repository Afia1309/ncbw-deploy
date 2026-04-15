import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");
const MAX_FEEDBACK_LENGTH = 500;

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("access");
}

function getItemType(item) {
  return String(item?.item_type || "").toLowerCase();
}

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
  return (
    <span style={{ color: "#667085", display: "inline-flex", alignItems: "center" }}>
      {map[type] ?? null}
    </span>
  );
}

function getVisibleItems(module) {
  return Array.isArray(module?.items) ? module.items : [];
}

function getModuleProgress(module) {
  const items = getVisibleItems(module);
  const total = items.length;
  const completed = items.filter((item) => item?.status === "completed").length;
  const hasInProgress = items.some((item) => item?.status === "in_progress");

  let status = "not_started";
  if (total > 0 && completed === total) {
    status = "completed";
  } else if (completed > 0 || hasInProgress) {
    status = "in_progress";
  }

  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    status,
  };
}

function getCourseProgress(course) {
  if (course?.progress) {
    return course.progress;
  }

  const modules = Array.isArray(course?.modules) ? course.modules : [];
  const allItems = modules.flatMap((module) => getVisibleItems(module));
  const total = allItems.length;
  const completed = allItems.filter((item) => item?.status === "completed").length;
  const hasInProgress = allItems.some((item) => item?.status === "in_progress");

  let status = "not_started";
  if (total > 0 && completed === total) {
    status = "completed";
  } else if (completed > 0 || hasInProgress) {
    status = "in_progress";
  }

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    status,
  };
}

function getStatusDisplay(status) {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  return "Not Started";
}

function ProgressCircle({ status, onClick, clickable = false }) {
  const btnStyle = {
    width: 22,
    height: 22,
    minWidth: 22,
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
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="11" cy="11" r="9" fill="white" stroke="#16a34a" strokeWidth="2" />
        <polyline points="7 11 10 14 15 8" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  } else if (status === "in_progress") {
    inner = (
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="11" cy="11" r="9" fill="white" stroke="#e4e7ec" strokeWidth="2" />
        {/* right half arc — indicates partial progress */}
        <path d="M 11 2 A 9 9 0 0 1 11 20" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  } else {
    inner = (
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
        <circle cx="11" cy="11" r="9" fill="white" stroke="#c5ccd8" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (onClick) onClick();
      }}
      style={btnStyle}
      aria-label={status === "completed" ? "Mark incomplete" : "Mark complete"}
      title={status === "completed" ? "Click to unmark" : "Click to mark complete"}
    >
      {inner}
    </button>
  );
}

async function updateItemStatus(itemId, status, token) {
  const response = await fetch(`${API_BASE}/api/training/items/${itemId}/progress/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Could not update progress");
  }

  return response.json();
}

function FeedbackStars({ value, onChange }) {
  return (
    <div className="course-feedback-stars" aria-label="Select a star rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            className={`course-feedback-star ${filled ? "filled" : ""}`}
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            aria-pressed={filled}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export default function CourseDisplay() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedModules, setExpandedModules] = useState({});
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  useEffect(() => {
    if (!isFeedbackOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFeedbackOpen]);

  const fetchCourseDetails = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/api/training/courses/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh");
        localStorage.removeItem("refresh_token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch course");
      }

      const data = await response.json();
      setCourse(data);

      const visibleModules = Array.isArray(data?.modules) ? data.modules : [];
      const initialExpanded = {};
      visibleModules.forEach((module, index) => {
        initialExpanded[module.id] = index === 0;
      });
      setExpandedModules(initialExpanded);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load course.");
    } finally {
      setLoading(false);
    }
  };

  const visibleModules = useMemo(() => {
    if (!course) return [];
    return Array.isArray(course?.modules) ? course.modules : [];
  }, [course]);

  const courseProgress = useMemo(() => {
    return course
      ? getCourseProgress(course)
      : { total: 0, completed: 0, percent: 0, status: "not_started" };
  }, [course]);

  const toggleModule = (moduleId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const openFeedbackModal = () => {
    setFeedbackSubmitted(false);
    setIsFeedbackOpen(true);
  };

  const closeFeedbackModal = () => {
    setIsFeedbackOpen(false);
    setFeedbackMessage("");
    setFeedbackRating(0);
  };

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault();
    if (!feedbackMessage.trim() || !feedbackRating) return;

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/api/training/courses/${id}/feedback/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating: feedbackRating, message: feedbackMessage.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
    } catch {
      // Submit silently — don't block the success state on a network hiccup
    }

    setFeedbackSubmitted(true);
    window.setTimeout(() => {
      closeFeedbackModal();
      setFeedbackSubmitted(false);
    }, 800);
  };

  const toggleItemStatus = async (item) => {
    try {
      const token = getToken();
      const nextStatus = item.status === "completed" ? "in_progress" : "completed";
      const result = await updateItemStatus(item.id, nextStatus, token);

      setCourse((prev) => {
        if (!prev) return prev;

        const updatedModules = (prev.modules || []).map((module) => ({
          ...module,
          items: (module.items || []).map((entry) =>
            String(entry.id) === String(item.id)
              ? { ...entry, status: result.status }
              : entry
          ),
        }));

        const allItems = updatedModules.flatMap((module) => module.items || []);
        const total = allItems.length;
        const completed = allItems.filter((entry) => entry.status === "completed").length;
        const hasInProgress = allItems.some((entry) => entry.status === "in_progress");

        let status = "not_started";
        if (total > 0 && completed === total) {
          status = "completed";
        } else if (completed > 0 || hasInProgress) {
          status = "in_progress";
        }

        return {
          ...prev,
          modules: updatedModules,
          progress: {
            completed,
            total,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            status,
          },
        };
      });

      setCompletionMessage(
        result.status === "completed"
          ? "Item marked as completed."
          : "Item moved back to in progress."
      );
      setError("");
      window.setTimeout(() => setCompletionMessage(""), 1500);
    } catch (err) {
      setError("Could not update this item right now.");
    }
  };

  if (loading) {
    return (
      <MemberLayout title="Loading...">
        <div className="dash-loading">Loading course details...</div>
      </MemberLayout>
    );
  }

  if (error && !course) {
    return (
      <MemberLayout title="Error">
        <div className="dash-error">{error}</div>
      </MemberLayout>
    );
  }

  if (!course) return null;

  return (
    <MemberLayout title={course.title || "Course"}>
      {completionMessage && <div className="dash-success">{completionMessage}</div>}
      {error && course && <div className="dash-error">{error}</div>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: "18px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #d0d5dd",
            borderRadius: "18px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "22px 24px 16px" }}>
            <div style={{ color: "#667085", fontSize: "0.88rem", marginBottom: "8px" }}>
              {course.code || "Course"}
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "1.9rem",
                lineHeight: 1.1,
                color: "#142c5c",
              }}
            >
              {course.title}
            </h1>

            <p
              style={{
                marginTop: "12px",
                marginBottom: 0,
                color: "#667085",
                lineHeight: 1.7,
              }}
            >
              {course.description || "No course description available."}
            </p>
          </div>

          <div style={{ borderTop: "1px solid #eaecf0" }}>
            {visibleModules.length === 0 ? (
              <div style={{ padding: "18px 24px", color: "#667085" }}>
                No modules are available yet.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px", padding: "16px" }}>
                {visibleModules.map((module) => {
                  const isExpanded = !!expandedModules[module.id];
                  const items = getVisibleItems(module);
                  const moduleProgress = getModuleProgress(module);

                  return (
                    <div
                      key={module.id}
                      style={{
                        border: "1px solid #eaecf0",
                        borderRadius: "16px",
                        overflow: "hidden",
                        background: "#fff",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        style={{
                          width: "100%",
                          border: "none",
                          background: "#f8fafc",
                          padding: "16px 18px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 800, color: "#142c5c" }}>
                            {module.title}
                          </div>
                          <div style={{ color: "#667085", fontSize: "0.9rem", marginTop: "4px" }}>
                            {moduleProgress.completed} of {moduleProgress.total} completed
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span className={`dash-status-badge ${moduleProgress.status}`}>
                            {getStatusDisplay(moduleProgress.status)}
                          </span>
                          <span style={{ color: "#667085", fontSize: "1.2rem" }}>
                            {isExpanded ? "−" : "+"}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div style={{ display: "grid" }}>
                          {items.map((item) => {
                            return (
                              <div
                                key={item.id}
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  navigate(`/member/material/${item.id}`, {
                                    state: {
                                      item,
                                      moduleTitle: module.title,
                                      moduleId: module.id,
                                      courseTitle: course.title,
                                      courseId: course.id,
                                      instructorName: course.instructor_name,
                                      moduleItems: items,
                                    },
                                  })
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    navigate(`/member/material/${item.id}`, {
                                      state: {
                                        item,
                                        moduleTitle: module.title,
                                        moduleId: module.id,
                                        courseTitle: course.title,
                                        courseId: course.id,
                                        instructorName: course.instructor_name,
                                        moduleItems: items,
                                      },
                                    });
                                  }
                                }}
                                style={{
                                  padding: "12px 18px",
                                  display: "grid",
                                  gridTemplateColumns: "24px 22px minmax(0, 1fr)",
                                  gap: "12px",
                                  alignItems: "start",
                                  cursor: "pointer",
                                  borderTop: "1px solid #f2f4f7",
                                }}
                              >
                                <ProgressCircle
                                  status={item.status}
                                  clickable
                                  onClick={() => toggleItemStatus(item)}
                                />

                                <div
                                  style={{
                                    fontSize: "1rem",
                                    lineHeight: 1.2,
                                    textAlign: "center",
                                    color: "#667085",
                                    marginTop: "2px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <ItemTypeIcon item={item} />
                                </div>

                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: "1rem",
                                      fontWeight: 700,
                                      color: "#142c5c",
                                      marginBottom: "2px",
                                    }}
                                  >
                                    {item.title || "Untitled Item"}
                                  </div>
                                  {item?.due_date && (
                                    <div style={{ fontSize: "0.78rem", color: "#667085" }}>
                                      Due: {new Date(item.due_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside style={{ display: "grid", gap: "16px" }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #d0d5dd",
              borderRadius: "18px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 800,
                color: "#142c5c",
                marginBottom: "16px",
              }}
            >
              Course Details
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "0.78rem", color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Instructor
                </div>
                <div style={{ marginTop: 4, fontSize: "0.98rem", fontWeight: 700, color: "#142c5c" }}>
                  {course.instructor_name || "Not assigned"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.78rem", color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Due Date
                </div>
                <div style={{ marginTop: 4, fontSize: "0.98rem", fontWeight: 700, color: "#142c5c" }}>
                  {course?.due_date ? new Date(course.due_date).toLocaleDateString() : "No due date"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.78rem", color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Progress
                </div>
                <div style={{ marginTop: 4, fontSize: "0.98rem", fontWeight: 700, color: "#142c5c" }}>
                  {courseProgress.completed} of {courseProgress.total} completed
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 8,
                    background: "#d0d5dd",
                    borderRadius: 999,
                    overflow: "hidden",
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      width: `${courseProgress.percent}%`,
                      height: "100%",
                      background: "#16a34a",
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.78rem", color: "#667085", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Status
                </div>
                <div style={{ marginTop: 6 }}>
                  <span className={`dash-status-badge ${courseProgress.status}`}>
                    {getStatusDisplay(courseProgress.status)}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="secondary-btn"
              type="button"
              onClick={openFeedbackModal}
              style={{ marginTop: "16px", width: "100%" }}
            >
              Send Feedback
            </button>
          </div>

          <div
            style={{
              background: "#fff",
              border: "1px solid #d0d5dd",
              borderRadius: "18px",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "1rem",
                fontWeight: 800,
                color: "#142c5c",
                marginBottom: "10px",
              }}
            >
              About this course
            </div>

            <div style={{ color: "#667085", lineHeight: 1.6, fontSize: "0.95rem" }}>
              {course?.description || "No course description available."}
            </div>
          </div>
        </aside>
      </div>

      {isFeedbackOpen && (
        <div className="course-feedback-modal-overlay" onClick={closeFeedbackModal}>
          <div
            className="course-feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-feedback-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="course-feedback-close"
              aria-label="Close feedback form"
              onClick={closeFeedbackModal}
            >
              ×
            </button>

            <form className="course-feedback-form" onSubmit={handleFeedbackSubmit}>
              <div className="course-feedback-head">
                <h2 id="course-feedback-title" className="course-feedback-title">
                  Send Feedback
                </h2>
                <p className="course-feedback-subtext">
                  Tell us what worked well or what should be improved for {course.title}.
                </p>
              </div>

              <div className="course-feedback-field">
                <label className="course-feedback-label" htmlFor="course-feedback-message">
                  Message
                </label>
                <textarea
                  id="course-feedback-message"
                  className="course-feedback-textarea"
                  value={feedbackMessage}
                  onChange={(event) =>
                    setFeedbackMessage(event.target.value.slice(0, MAX_FEEDBACK_LENGTH))
                  }
                  maxLength={MAX_FEEDBACK_LENGTH}
                  placeholder="Share your feedback here..."
                  rows={7}
                />
                <div className="course-feedback-count">
                  {feedbackMessage.length}/{MAX_FEEDBACK_LENGTH}
                </div>
              </div>

              <div className="course-feedback-field">
                <div className="course-feedback-label">Rating</div>
                <FeedbackStars value={feedbackRating} onChange={setFeedbackRating} />
              </div>

              <div className="course-feedback-actions">
                <button type="button" className="secondary-btn" onClick={closeFeedbackModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!feedbackMessage.trim() || !feedbackRating}
                >
                  Send
                </button>
              </div>

              {feedbackSubmitted && (
                <div className="dash-success" style={{ marginTop: "12px" }}>
                  Feedback sent.
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}