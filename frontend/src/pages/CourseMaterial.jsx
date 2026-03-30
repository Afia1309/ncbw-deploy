import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function CourseMaterial() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchModuleDetails();
  }, [id]);

  const fetchModuleDetails = async () => {
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

      if (!response.ok) {
        throw new Error("Failed to fetch module details");
      }

      const data = await response.json();
      const foundModule = data.required_modules.find((moduleItem) => moduleItem.id === parseInt(id, 10));

      if (!foundModule) {
        throw new Error("Module not found");
      }

      setModule(foundModule);
      setError("");
    } catch (err) {
      console.error("Failed to fetch module:", err);
      setError(err.message || "Failed to load course material.");
    } finally {
      setLoading(false);
    }
  };

  const updateModuleStatus = async (newStatus) => {
    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(
        `http://localhost:8000/api/training/modules/${id}/status/`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update module status");
      }

      setStatusMessage(
        newStatus === "completed"
          ? "Module marked as completed."
          : "Module started successfully."
      );

      fetchModuleDetails();
    } catch (err) {
      console.error("Failed to update status:", err);
      setStatusMessage("");
      setError("Could not update this module right now.");
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

  if (loading) {
    return (
      <MemberLayout title="Loading...">
        <div className="dash-loading">Loading course material...</div>
      </MemberLayout>
    );
  }

  if (error && !module) {
    return (
      <MemberLayout title="Course Material">
        <div className="dash-error">{error}</div>
      </MemberLayout>
    );
  }

  const isLocked = module?.locked;
  const isComplete = module?.status === "completed";
  const isInProgress = module?.status === "in_progress";
  const progress = isComplete ? 100 : isInProgress ? 50 : 0;

  return (
    <MemberLayout title={module.title}>
      <div className="course-material-grid">
        <aside className="material-sidebar">
          <div className="material-sidebar-title">Course Information</div>

          <div className="sidebar-section-item">
            <span>Status</span>
            <span className={`dash-status-badge ${module.status}`}>
              {getStatusLabel(module.status)}
            </span>
          </div>

          <div className="sidebar-section-item">
            <span>Required</span>
            <span>{module.required ? "Yes" : "No"}</span>
          </div>

          <div className="sidebar-section-item">
            <span>Progress</span>
            <span>{progress}% Complete</span>
          </div>

          {module.due_date && (
            <div className="sidebar-section-item">
              <span>Due Date</span>
              <span>{new Date(module.due_date).toLocaleDateString()}</span>
            </div>
          )}

          <div className="material-progress-group">
            <div className="course-progress-bar">
              <div
                className={`course-progress-fill ${module.status}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </aside>

        <div className="material-main">
          {statusMessage && <div className="dash-success">{statusMessage}</div>}
          {error && module && <div className="dash-error">{error}</div>}

          <div className="material-video">
            <div className="material-video-placeholder">
              <div className="material-video-icon">▶</div>
              <div className="material-video-title">{module.title}</div>
              <div className="material-video-subtext">
                Video and reading materials will appear here.
              </div>
            </div>
          </div>

          <div className="material-actions">
            {!isLocked && !isComplete && (
              <button
                className="primary-btn"
                onClick={() =>
                  updateModuleStatus(isInProgress ? "completed" : "in_progress")
                }
              >
                {isInProgress ? "Mark Complete" : "Start Module"}
              </button>
            )}

            {isComplete && (
              <button className="secondary-btn" disabled>
                Completed
              </button>
            )}

            {isLocked && (
              <button className="disabled-btn" disabled>
                Locked
              </button>
            )}

            <button
              className="secondary-btn"
              type="button"
              onClick={() => navigate(`/member/course/${module.id}`)}
            >
              Back to Course Details
            </button>
          </div>

          <div className="material-description">
            <h3>About this course</h3>
            <p>
              This module covers essential concepts in {module.title}. Complete the
              required activities to master this topic.
            </p>

            {isLocked && (
              <div className="material-note">
                This course is currently locked. Complete the previous module to
                unlock access.
              </div>
            )}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
