import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("access");
}

function getStatusLabel(status) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    default:
      return "Not Started";
  }
}

export default function CourseSelection() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [certificateEligible, setCertificateEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE}/api/training/courses/`, {
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
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      const courseList = Array.isArray(data) ? data : [];
      setCourses(courseList);

      const visibleCourses = courseList.filter(
        (course) =>
          course?.is_published !== false &&
          course?.published !== false &&
          course?.visible !== false
      );

      const requiredCourses = visibleCourses.filter((course) => course.required ?? true);

      const allRequiredCompleted =
        requiredCourses.length > 0 &&
        requiredCourses.every((course) => (course?.progress?.status || "not_started") === "completed");

      setCertificateEligible(allRequiredCompleted);
    } catch (err) {
      setError(err.message);
      console.error("Courses error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MemberLayout title="Courses">
        <div className="dash-loading">Loading courses...</div>
      </MemberLayout>
    );
  }

  if (error) {
    return (
      <MemberLayout title="Courses">
        <div className="dash-error">{error}</div>
      </MemberLayout>
    );
  }

  const visibleCourses = courses.filter(
    (course) =>
      course?.is_published !== false &&
      course?.published !== false &&
      course?.visible !== false
  );

  return (
    <MemberLayout title="Courses">
      <div className="course-list">
        {visibleCourses.map((course) => {
          const progressData = course.progress || {
            percent: 0,
            status: "not_started",
          };

          const progress = progressData.percent || 0;
          const status = progressData.status || "not_started";

          return (
            <div key={course.id} className="course-item">
              <div className="course-status-strip">
                <span className={`course-status-pill ${status}`}>
                  {getStatusLabel(status)}
                </span>
              </div>

              <div className="course-content">
                <div className="course-header-row">
                  <div>
                    <div className="course-title">{course.title}</div>
                    <div className="course-description">
                      {(course.required ?? true) ? "Required course" : "Optional course"} •{" "}
                      {getStatusLabel(status)}
                    </div>
                  </div>

                  <div className="course-badge-group">
                    {(course.required ?? true) && (
                      <span className="dash-required-badge">Required</span>
                    )}
                    {course.locked && (
                      <span className="dash-locked-badge">Locked</span>
                    )}
                  </div>
                </div>

                <div className="course-progress-meta">
                  <span>{progress}% Complete</span>
                  {course.locked && (
                    <span className="course-lock-note">
                      Complete the previous module to unlock this one.
                    </span>
                  )}
                </div>

                <div className="course-progress-bar">
                  <div
                    className={`course-progress-fill ${status}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="course-actions">
                  <button
                    className={course.locked ? "disabled-btn" : "primary-btn"}
                    type="button"
                    onClick={() => navigate(`/member/course/${course.id}`)}
                    disabled={course.locked}
                  >
                    {course.locked ? "Locked" : "View Course"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div className={`course-certificate-banner ${certificateEligible ? "complete" : ""}`}>
          {certificateEligible ? (
            <>
              <div>All required modules are complete. Your certificate is ready to view.</div>

              <button
                className="primary-btn"
                style={{ marginTop: "12px" }}
                onClick={() => navigate("/member/certificate")}
              >
                View Certificate
              </button>
            </>
          ) : (
            "Complete all required modules to view your certificate."
          )}
        </div>
      </div>
    </MemberLayout>
  );
}