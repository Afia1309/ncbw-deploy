import AdminLayout from "../../components/AdminLayout";
import "./Dashboard.css";

const publishedCourses = [
  { name: "Leadership & Strategic Visioning", status: "Active" },
  { name: "Effective Public Speaking & Communication", status: "Active" },
  { name: "Conflict Resolution & Mediation", status: "Active" },
  { name: "Delegation & Time Management", status: "Draft" },
];

const recentMessages = [
  {
    id: 1,
    name: "John Doe",
    preview: "Question about course materials...",
    timeAgo: "1 hour ago",
  },
  {
    id: 2,
    name: "Jane Smith",
    preview: "Request for deadline extension...",
    timeAgo: "3 hours ago",
  },
];

const enrollmentTrend = [50, 55, 63, 60, 74, 82]; // Jan–Jun
const completionRates = [65, 70, 74, 72, 78, 80];

const feedbackItems = [
  {
    id: 1,
    name: "Mike Johnson",
    text: "Great course content, very helpful!",
    rating: 5,
    timeAgo: "2 hours ago",
  },
  {
    id: 2,
    name: "Sarah Williams",
    text: "Would like more video examples...",
    rating: 4,
    timeAgo: "1 day ago",
  },
];

export default function AdminDashboard() {
  const totalCourses = 45;

  return (
    <AdminLayout title="Admin Dashboard">
      {/* Top row: Published courses + Recent messages */}
      <div className="admin-top-grid">
        {/* Published Courses */}
        <section className="admin-card-gold">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Published Courses</h2>
          </div>

          <div className="admin-published-list">
            {publishedCourses.map((course) => (
              <div key={course.name} className="admin-published-row">
                <span>{course.name}</span>
                <span
                  className={
                    "admin-status-pill " +
                    (course.status === "Active" ? "active" : "draft")
                  }
                >
                  {course.status}
                </span>
              </div>
            ))}
          </div>

          <div className="admin-published-footer">
            Total: {totalCourses} courses
          </div>
        </section>

        {/* Recent Messages */}
        <section className="admin-card-gold admin-recent-messages">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Recent Messages</h2>
            <button type="button" className="admin-link-button">
              See All →
            </button>
          </div>

          <div className="admin-message-list">
            {recentMessages.map((msg) => (
              <div key={msg.id} className="admin-message-item">
                <div className="admin-message-main">
                  <div className="admin-message-name">{msg.name}</div>
                  <div className="admin-message-preview">{msg.preview}</div>
                </div>
                <div className="admin-message-time">{msg.timeAgo}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Middle row: charts */}
      <div className="admin-middle-grid">
        {/* Enrollment Trends (line-ish chart) */}
        <section className="dash-card admin-chart-card">
          <div className="admin-card-title">Enrollment Trends</div>
          <div className="admin-chart admin-line-chart">
            {enrollmentTrend.map((value, index) => (
              <div key={index} className="admin-line-point-wrapper">
                <div
                  className="admin-line-point"
                  style={{ bottom: `${value}%` }}
                />
              </div>
            ))}
            <div className="admin-chart-xaxis">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Completion Rate Overview (bar chart) */}
        <section className="dash-card admin-chart-card">
          <div className="admin-card-title">Completion Rate Overview</div>
          <div className="admin-chart admin-bar-chart">
            {completionRates.map((value, index) => (
              <div key={index} className="admin-bar-wrapper">
                <div
                  className="admin-bar"
                  style={{ height: `${value}%` }}
                />
              </div>
            ))}
            <div className="admin-chart-xaxis">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((m) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Bottom: Recent Feedback */}
      <section className="admin-card-gold admin-feedback-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Recent Feedback</h2>
          <button type="button" className="admin-link-button">
            See All →
          </button>
        </div>

        <div className="admin-feedback-row">
          {feedbackItems.map((fb) => (
            <div key={fb.id} className="admin-feedback-item">
              <div className="admin-feedback-header">
                <span className="admin-feedback-name">{fb.name}</span>
                <span className="admin-feedback-time">{fb.timeAgo}</span>
              </div>
              <div className="admin-feedback-text">{fb.text}</div>
              <div className="admin-feedback-rating">
                {"★".repeat(fb.rating)}
                {"☆".repeat(5 - fb.rating)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </AdminLayout>
  );
}
