import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function CourseSelection() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:8000/api/training/dashboard/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      setCourses(data.required_modules || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getProgressValue = (status) => {
    switch (status) {
      case "completed":
        return 100;
      case "in_progress":
        return 50;
      default:
        return 0;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      default:
        return "Not Started";
    }
  };

  const allComplete =
    courses.length > 0 && courses.every((course) => course.status === "completed");

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

  return (
    <MemberLayout title="Courses">
      <div className="course-list">
        {courses.map((course) => {
          const progress = getProgressValue(course.status);

          return (
            <div key={course.id} className="course-item">
              <div className="course-status-strip">
                <span className={`course-status-pill ${course.status}`}>
                  {getStatusLabel(course.status)}
                </span>
              </div>

              <div className="course-content">
                <div className="course-header-row">
                  <div>
                    <div className="course-title">{course.title}</div>
                    <div className="course-description">
                      {course.required ? "Required module" : "Optional module"} •{" "}
                      {getStatusLabel(course.status)}
                    </div>
                  </div>

                  <div className="course-badge-group">
                    {course.required && (
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
                    className={`course-progress-fill ${course.status}`}
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

        <div className={`course-certificate-banner ${allComplete ? "complete" : ""}`}>
          {allComplete
            ? "All courses are complete. Your certificate is ready to view."
            : "Complete all courses to view your certificate."}
        </div>
      </div>
    </MemberLayout>
  );
}
