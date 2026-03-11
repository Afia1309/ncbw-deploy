import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function CourseDisplay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

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

  return (
    <MemberLayout title={course.title}>
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
            <button className="secondary-btn" type="button">
              Send Feedback
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
    </MemberLayout>
  );
}
