import MemberLayout from "../components/MemberLayout";
import "./Dashboard.css";

const mockProfile = {
  name: "John Doe",
  track: "Leadership Track",
  completed: 65,
};

const mockCourses = [
  {
    id: 1,
    title: "Leadership & Strategic Visioning",
    progress: 60,
  },
  {
    id: 2,
    title: "Effective Public Speaking & Communication",
    progress: 35,
  },
  {
    id: 3,
    title: "Conflict Resolution & Mediation",
    progress: 20,
  },
];

const mockReminders = [
  {
    id: 1,
    title: "Complete Strategic Planning Module 3",
    date: "2025-12-01",
  },
  {
    id: 2,
    title: "Submit Leadership Assignment",
    date: "2025-12-05",
  },
];

const mockMessages = [
  {
    id: 1,
    from: "Admin",
    timeAgo: "2 hours ago",
    text: "Welcome to the training portal! Please complete your first module.",
  },
  {
    id: 2,
    from: "Coordinator",
    timeAgo: "1 day ago",
    text: "New course materials have been added to your track.",
  },
];

export default function MemberDashboard() {
  const profile = mockProfile;
  const courses = mockCourses;

  return (
    <MemberLayout title="Dashboard">
      <div className="dash-dashboard-grid">
        {/* Overall progress */}
        <section className="dash-card progress-card">
          <div className="dash-progress-circle">
            <div className="dash-progress-inner">
              <div className="dash-progress-number">
                {profile.completed}%
              </div>
              <div className="dash-progress-caption">Completed</div>
            </div>
          </div>

          <div className="dash-progress-text">
            <p>Your Overall Progress</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>
              Leadership Track: {profile.track}
            </p>

            {courses.map((c) => (
              <div key={c.id} className="dash-course-row">
                <div className="dash-course-name">{c.title}</div>
                <div className="dash-progress-bar">
                  <div
                    className="dash-progress-fill"
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Calendar & reminders */}
        <section className="dash-card reminders-card">
          <div className="dash-section-title">Calendar & Reminders</div>
          {mockReminders.map((r) => (
            <div key={r.id} className="dash-reminder">
              <div className="dash-reminder-title">{r.title}</div>
              <div className="dash-reminder-date">{r.date}</div>
            </div>
          ))}
        </section>
      </div>

      <div className="dash-dashboard-bottom">
        {/* Enrolled courses */}
        <section className="dash-card">
          <div className="dash-section-title">Enrolled Courses</div>
          {courses.map((c) => (
            <div key={c.id} className="dash-course-row">
              <div className="dash-course-name">{c.title}</div>
              <div className="dash-progress-bar">
                <div
                  className="dash-progress-fill"
                  style={{ width: `${c.progress}%` }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* Messages */}
        <section className="dash-card messages-card">
          <div className="dash-section-title">Messages</div>
          {mockMessages.map((m) => (
            <div key={m.id} className="dash-message-card">
              <div className="dash-message-header">
                <span className="dash-message-from">{m.from}</span>
                <span className="dash-message-time">{m.timeAgo}</span>
              </div>
              <div className="dash-message-body">{m.text}</div>
            </div>
          ))}
        </section>
      </div>
    </MemberLayout>
  );
}
