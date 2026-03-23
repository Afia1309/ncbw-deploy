import React, { useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";

const reportData = [
  {
    id: 1,
    name: "John Doe",
    role: "President",
    reportDate: "2025-11-28",
    coursesEnrolled: 5,
    coursesCompleted: 2,
    averageScore: 85,
    timeSpent: "12 hours",
    lastActivity: "2025-11-27",
    performance: [
      { course: "Leadership & Strategic Visioning", score: 88 },
      { course: "Effective Public Speaking", score: 82 },
      { course: "Conflict Resolution", score: 90 },
      { course: "Delegation & Time Mgmt", score: 0 },
      { course: "Organizational Culture", score: 0 },
    ],
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Treasurer",
    reportDate: "2025-11-28",
    coursesEnrolled: 4,
    coursesCompleted: 3,
    averageScore: 91,
    timeSpent: "15 hours",
    lastActivity: "2025-11-26",
    performance: [
      { course: "Nonprofit Financial Mgmt", score: 94 },
      { course: "Leadership Foundations", score: 89 },
      { course: "Team Communication", score: 90 },
      { course: "Project Management", score: 0 },
    ],
  },
  {
    id: 3,
    name: "Mike Johnson",
    role: "Vice President",
    reportDate: "2025-11-28",
    coursesEnrolled: 6,
    coursesCompleted: 4,
    averageScore: 87,
    timeSpent: "18 hours",
    lastActivity: "2025-11-25",
    performance: [
      { course: "Project Management", score: 92 },
      { course: "Conflict Resolution", score: 88 },
      { course: "Team Communication", score: 84 },
      { course: "Meeting Leadership", score: 86 },
      { course: "Delegation & Time Mgmt", score: 0 },
      { course: "Organizational Culture", score: 0 },
    ],
  },
  {
    id: 4,
    name: "Sarah Williams",
    role: "Corresponding Secretary",
    reportDate: "2025-11-28",
    coursesEnrolled: 5,
    coursesCompleted: 3,
    averageScore: 83,
    timeSpent: "10 hours",
    lastActivity: "2025-11-24",
    performance: [
      { course: "Professional Writing", score: 86 },
      { course: "Email Etiquette", score: 88 },
      { course: "Leadership Foundations", score: 75 },
      { course: "Team Communication", score: 0 },
      { course: "Public Speaking", score: 0 },
    ],
  },
];

function ScoreBar({ label, value }) {
  return (
    <div className="admin-report-chart-item">
      <div className="admin-report-chart-bar-wrap">
        <div
          className="admin-report-chart-bar"
          style={{ height: `${value}%` }}
          title={`${label}: ${value}%`}
        />
      </div>
      <div className="admin-report-chart-label">{label}</div>
    </div>
  );
}

export default function AdminReports() {
  const [openIds, setOpenIds] = useState([reportData[0].id]);

  const summary = useMemo(() => {
    const totalMembers = reportData.length;
    const totalCoursesCompleted = reportData.reduce(
      (sum, item) => sum + item.coursesCompleted,
      0
    );
    const averageScore = Math.round(
      reportData.reduce((sum, item) => sum + item.averageScore, 0) / totalMembers
    );

    return {
      totalMembers,
      totalCoursesCompleted,
      averageScore,
    };
  }, []);

  function toggleReport(id) {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  return (
    <AdminLayout title="Reports">
      <div className="admin-reports-page">
        <div className="admin-report-list">
          {reportData.map((report) => {
            const isOpen = openIds.includes(report.id);

            return (
              <section key={report.id} className="dash-card admin-report-card">
                <button
                  type="button"
                  className="admin-report-toggle"
                  onClick={() => toggleReport(report.id)}
                >
                  <div className="admin-report-header-left">
                    <h2 className="admin-report-name">{report.name}</h2>
                    <div className="admin-report-subtitle">
                      {report.role} • Report Date: {report.reportDate}
                    </div>
                  </div>

                  <div className={`admin-report-chevron ${isOpen ? "open" : ""}`}>
                    ⌃
                  </div>
                </button>

                {isOpen && (
                  <div className="admin-report-body">
                    <div className="admin-report-metrics-grid">
                      <div className="admin-report-metric-tile">
                        <div className="admin-report-metric-label">
                          Courses Enrolled
                        </div>
                        <div className="admin-report-metric-value">
                          {report.coursesEnrolled}
                        </div>
                      </div>

                      <div className="admin-report-metric-tile">
                        <div className="admin-report-metric-label">
                          Courses Completed
                        </div>
                        <div className="admin-report-metric-value">
                          {report.coursesCompleted}
                        </div>
                      </div>

                      <div className="admin-report-metric-tile">
                        <div className="admin-report-metric-label">Average Score</div>
                        <div className="admin-report-metric-value">
                          {report.averageScore}%
                        </div>
                      </div>

                      <div className="admin-report-metric-tile">
                        <div className="admin-report-metric-label">Time Spent</div>
                        <div className="admin-report-metric-value">
                          {report.timeSpent}
                        </div>
                      </div>

                      <div className="admin-report-metric-tile admin-report-metric-wide">
                        <div className="admin-report-metric-label">Last Activity</div>
                        <div className="admin-report-metric-value">
                          {report.lastActivity}
                        </div>
                      </div>
                    </div>

                    <div className="admin-report-chart-panel">
                      <div className="admin-report-chart-title">
                        Performance by Course
                      </div>

                      <div className="admin-report-chart">
                        {report.performance.map((item) => (
                          <ScoreBar
                            key={`${report.id}-${item.course}`}
                            label={item.course}
                            value={item.score}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
