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
      const token = localStorage.getItem('access_token');
      

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/training/dashboard/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

 
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (status) => {
    switch(status) {
      case 'completed': return 100;
      case 'in_progress': return 50;
      default: return 0;
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
        <div className="dash-error">No dashboard data available</div>
      </MemberLayout>
    );
  }

  const { user, program, progress, required_modules } = dashboardData;

  return (
    <MemberLayout title={`Welcome, ${user.name}!`}>
      <div className="dash-dashboard-grid">
        {/* Overall progress */}
        <section className="dash-card progress-card">
         <div 
            className="dash-progress-circle" 
             style={{ '--progress-deg': `${progress.percent_complete * 3.6}deg` }}
             >
            <div className="dash-progress-inner">
              <div className="dash-progress-number">
                {progress.percent_complete}%
              </div>
              <div className="dash-progress-caption">Completed</div>
            </div>
          </div>

          <div className="dash-progress-text">
            <p>Your Overall Progress</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              {program.track}: {program.phase} • {program.cohort}
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              Member ID: {user.member_id}
            </p>

            {/* Show first 3 modules as progress bars */}
            {required_modules.slice(0, 3).map((module) => (
              <div key={module.id} className="dash-course-row">
                <div className="dash-course-name">{module.title}</div>
                <div className="dash-progress-bar">
                  <div
                    className="dash-progress-fill"
                    style={{ width: `${getModuleProgress(module.status)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {}
        <section className="dash-card reminders-card">
          <div className="dash-section-title">Calendar & Reminders</div>
          {required_modules
            .filter(m => m.due_date && m.status !== 'completed')
            .slice(0, 2)
            .map((module) => (
              <div key={module.id} className="dash-reminder">
                <div className="dash-reminder-title">
                  {module.title} {module.locked && "🔒"}
                </div>
                <div className="dash-reminder-date">
                  Due: {new Date(module.due_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          {required_modules.filter(m => m.due_date && m.status !== 'completed').length === 0 && (
            <div className="dash-reminder" style={{ color: "#6b7280" }}>
              No upcoming deadlines
            </div>
          )}
        </section>
      </div>

      <div className="dash-dashboard-bottom">
        {}
        <section className="dash-card">
          <div className="dash-section-title">
            Required Modules ({progress.completed_required}/{progress.total_required})
          </div>
          {required_modules.map((module) => (
            <div key={module.id} className="dash-course-row">
              <div className="dash-course-info">
                <span className="dash-course-name">{module.title}</span>
                {module.required && (
                  <span className="dash-required-badge">Required</span>
                )}
                {module.locked && (
                  <span className="dash-locked-badge">🔒 Locked</span>
                )}
              <span className={`dash-status-badge ${module.status}`}>
               {module.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div className="dash-progress-bar">
                <div
                  className={`dash-progress-fill ${module.status}`}
                  style={{ width: `${getModuleProgress(module.status)}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        {}
        <section className="dash-card messages-card">
          <div className="dash-section-title">Quick Stats</div>
          <div style={{ padding: "1rem" }}>
            <div style={{ marginBottom: "1rem" }}>
              <strong>Completed:</strong> {progress.completed_required} modules
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <strong>In Progress:</strong> {
                required_modules.filter(m => m.status === 'in_progress').length
              } modules
            </div>
            <div>
              <strong>Not Started:</strong> {
                required_modules.filter(m => m.status === 'not_started').length
              } modules
            </div>
          </div>
        </section>
      </div>
    </MemberLayout>
  );
}