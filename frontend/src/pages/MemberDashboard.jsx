import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function MemberDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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
        localStorage.removeItem("refresh_token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (status) => {
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
          <button onClick={fetchDashboardData} className="dash-retry-btn">
            Try Again
          </button>
        </div>
      </MemberLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MemberLayout title="Dashboard">
        <div className="dash-error">No dashboard data available.</div>
      </MemberLayout>
    );
  }

  const { user, program, progress, required_modules } = dashboardData;

  const reminders = required_modules.filter(
    (module) => module.due_date && module.status !== "completed"
  );

  const inProgressCount = required_modules.filter(
    (module) => module.status === "in_progress"
  ).length;

  const notStartedCount = required_modules.filter(
    (module) => module.status === "not_started"
  ).length;

  return (
    <MemberLayout title={`Welcome, ${user.name}!`}>
      <div className="dash-dashboard-grid">
        <section className="dash-card progress-card">
          <div
            className="dash-progress-circle"
            style={{ "--progress-deg": `${progress.percent_complete * 3.6}deg` }}
          >
            <div className="dash-progress-inner">
              <div className="dash-progress-number">
                {progress.percent_complete}%
              </div>
              <div className="dash-progress-caption">Completed</div>
            </div>
          </div>

          <div className="dash-progress-text">
            <p className="dash-eyebrow">Overall Progress</p>
            <h2 className="dash-block-title">
              {program.track}: {program.phase}
            </h2>
            <p className="dash-subtext">{program.cohort}</p>
            <p className="dash-meta-line">Member ID: {user.member_id}</p>

            <div className="dash-course-summary-list">
              {required_modules.slice(0, 3).map((module) => (
                <div key={module.id} className="dash-course-row">
                  <div className="dash-course-row-top">
                    <div className="dash-course-name">{module.title}</div>
                    <div className={`dash-status-badge ${module.status}`}>
                      {getStatusLabel(module.status)}
                    </div>
                  </div>

                  <div className="dash-progress-bar">
                    <div
                      className={`dash-progress-fill ${module.status}`}
                      style={{ width: `${getModuleProgress(module.status)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="dash-card reminders-card">
          <div className="dash-section-title">Calendar &amp; Reminders</div>

          {reminders.length > 0 ? (
            <div className="dash-reminders-list">
              {reminders.slice(0, 3).map((module) => (
                <div key={module.id} className="dash-reminder">
                  <div className="dash-reminder-main">
                    <div className="dash-reminder-title">
                      {module.title}
                      {module.locked ? " 🔒" : ""}
                    </div>
                    <div className="dash-reminder-date">
                      Due: {new Date(module.due_date).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => navigate(`/member/course/${module.id}`)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="dash-empty-panel">No upcoming deadlines</div>
          )}
        </section>
      </div>

      <div className="dash-dashboard-bottom">
        <section className="dash-card">
          <div className="dash-section-head">
            <div className="dash-section-title">
              Required Modules ({progress.completed_required}/{progress.total_required})
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/member/courses")}
            >
              View All
            </button>
          </div>

          <div className="dash-module-list">
            {required_modules.map((module) => (
              <div key={module.id} className="dash-module-item">
                <div className="dash-module-item-top">
                  <div className="dash-course-info">
                    <span className="dash-course-name">{module.title}</span>

                    {module.required && (
                      <span className="dash-required-badge">Required</span>
                    )}

                    {module.locked && (
                      <span className="dash-locked-badge">Locked</span>
                    )}
                  </div>

                  <div className={`dash-status-badge ${module.status}`}>
                    {getStatusLabel(module.status)}
                  </div>
                </div>

                <div className="dash-progress-bar">
                  <div
                    className={`dash-progress-fill ${module.status}`}
                    style={{ width: `${getModuleProgress(module.status)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="dash-card quick-stats-card">
          <div className="dash-section-title">Quick Stats</div>

          <div className="dash-stats-list">
            <div className="dash-stat-row">
              <span className="dash-stat-label">Completed</span>
              <span className="dash-stat-value">{progress.completed_required} modules</span>
            </div>

            <div className="dash-stat-row">
              <span className="dash-stat-label">In Progress</span>
              <span className="dash-stat-value">{inProgressCount} modules</span>
            </div>

            <div className="dash-stat-row">
              <span className="dash-stat-label">Not Started</span>
              <span className="dash-stat-value">{notStartedCount} modules</span>
            </div>
          </div>
        </section>
      </div>
    </MemberLayout>
  );
}
