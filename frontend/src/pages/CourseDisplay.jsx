import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

const MAX_FEEDBACK_LENGTH = 500;

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
  const [error, setError] = useState(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  useEffect(() => {
    if (!isFeedbackOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFeedbackOpen]);

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      if (!id) {
        setError("No course ID provided.");
        setLoading(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/training/dashboard/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch course");

      const data = await response.json();
      const courseIdNum = parseInt(id, 10);
      const foundCourse = data.required_modules.find((module) => module.id === courseIdNum);

      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        setError(`Course not found. ID: ${id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    if (status === "completed") return "Completed";
    if (status === "in_progress") return "In Progress";
    return "Not Started";
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

  const handleFeedbackSubmit = (event) => {
    event.preventDefault();

    if (!feedbackMessage.trim() || !feedbackRating) {
      return;
    }

    setFeedbackSubmitted(true);

    window.setTimeout(() => {
      closeFeedbackModal();
      setFeedbackSubmitted(false);
    }, 800);
  };

  if (loading) {
    return (
      <MemberLayout title="Loading...">
        <div className="dash-loading">Loading course details...</div>
      </MemberLayout>
    );
  }

  if (error || !course) {
    return (
      <MemberLayout title="Error">
        <div className="dash-error">{error || "Course not found."}</div>
      </MemberLayout>
    );
  }

  const isLocked = course.locked || false;
  const isComplete = course.status === "completed";
  const progress =
    course.status === "completed" ? 100 : course.status === "in_progress" ? 50 : 0;
  const isSubmitDisabled = !feedbackMessage.trim() || !feedbackRating;

  return (
    <MemberLayout title={course.title}>
      {feedbackSubmitted && (
        <div className="dash-success course-feedback-success">
          Feedback submitted successfully.
        </div>
      )}

      <div className="course-display-grid">
        <section className="course-details-card">
          <div className="dash-section-title">Course Details</div>

          <div className="course-details-stack">
            <div className="course-detail-item">
              <div className="course-details-label">Status</div>
              <div className="course-details-value">
                <span className={`dash-status-badge ${course.status}`}>
                  {getStatusDisplay(course.status)}
                </span>
              </div>
            </div>

            <div className="course-detail-item">
              <div className="course-details-label">Progress</div>
              <div className="course-details-value">{progress}% Complete</div>
            </div>

            <div className="course-detail-item">
              <div className="course-details-label">Due Date</div>
              <div className="course-details-value">
                {course.due_date
                  ? new Date(course.due_date).toLocaleDateString()
                  : "No due date"}
              </div>
            </div>

            <div className="course-detail-item">
              <div className="course-details-label">Course Coordinator</div>
              <div className="course-details-value">NCBW Training Team</div>
            </div>

            <div className="course-detail-item">
              <div className="course-details-label">About</div>
              <div className="course-details-about">
                This course covers essential topics in {course.title}. Complete this
                module to build your expertise in this area.
              </div>
            </div>
          </div>

          <div className="course-detail-actions">
            <button className="secondary-btn" type="button" onClick={openFeedbackModal}>
              Send Feedback
            </button>

            <button className="secondary-btn" type="button" onClick={() => navigate(`/member/courses`)} style={{ marginLeft: "25px" }}>
              Back to Courses 
            </button>
          </div>
        </section>

        <section className="section-list">
          <div className="section-card">
            <div className="section-main">
              <div className="section-header-line">
                <div>
                  <div className="section-title">{course.title}</div>
                  <div className="section-meta">
                    {course.required ? "Required module" : "Optional module"}
                  </div>
                </div>

                <div className="section-badges">
                  <div className={`section-status-pill ${course.status}`}>
                    {getStatusDisplay(course.status)}
                  </div>
                  {isLocked && <div className="section-locked">Locked</div>}
                </div>
              </div>

              <div className="section-progress-block">
                <div className="course-progress-meta">
                  <span>{progress}% Complete</span>
                  {isLocked && (
                    <span className="course-lock-note">
                      Complete the previous module to unlock this course.
                    </span>
                  )}
                </div>

                <div className="course-progress-bar">
                  <div
                    className={`course-progress-fill ${course.status}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="section-actions">
              {isLocked ? (
                <button type="button" className="disabled-btn" disabled>
                  Locked
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => navigate(`/member/material/${course.id}`)}
                >
                  {isComplete ? "Review Module" : "Continue"}
                </button>
              )}
            </div>
          </div>
        </section>
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
                <button type="submit" className="primary-btn" disabled={isSubmitDisabled}>
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MemberLayout>
  );
}
