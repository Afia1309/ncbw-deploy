import { useNavigate } from "react-router-dom";
import MemberLayout from "../components/MemberLayout";
import "./Dashboard.css";

const sections = [
  {
    id: 1,
    title: "What is Strategic Planning?",
    provider: "LinkedIn Learning",
    required: true,
    duration: "20 mins",
    status: "Complete",
  },
  {
    id: 2,
    title: "Creating Your Personal Leadership Plan",
    provider: "Coursera",
    required: true,
    duration: "45 mins",
    status: "Complete",
  },
  {
    id: 3,
    title: "Leadership Fundamentals",
    provider: "YouTube by FutureLearn",
    required: true,
    duration: "30 mins",
    status: "30% Complete",
  },
  {
    id: 4,
    title: "Strategic Thinking",
    provider: "LinkedIn Learning",
    required: true,
    duration: "50 mins",
    status: "Locked",
  },
  {
    id: 5,
    title: "Defining Your Leadership Values and Vision",
    provider: "Coursera",
    required: true,
    duration: "30 mins",
    status: "Locked",
  },
];

export default function CourseDisplay() {
  const navigate = useNavigate();

  return (
    <MemberLayout title="Leadership & Strategic Visioning">
      <div className="course-display-grid">
        {/* Left details card */}
        <section className="course-details-card">
          <div className="dash-section-title">Course Details</div>

          <div className="course-details-label">Duration</div>
          <div className="course-details-value">2h 55m</div>

          <div className="course-details-label">Course Coordinator</div>
          <div className="course-details-value">NCBW Training Team</div>

          <div className="course-details-label">About</div>
          <div className="course-details-about">
            This course consists of 5 sections covering essential topics in
            leadership &amp; strategic visioning. Complete all sections to build
            your expertise in this area.
          </div>

          <button className="primary-btn" type="button">
            Send Feedback
          </button>
        </section>

        {/* Right: list of sections */}
        <section className="section-list">
          {sections.map((s) => {
            const isLocked = s.status === "Locked";
            const isComplete = s.status === "Complete";

            return (
              <div key={s.id} className="section-card">
                <div className="section-main">
                  <div className="section-title">{s.title}</div>
                  <div className="section-meta">
                    Required • {s.duration} • {s.provider}
                  </div>
                </div>

                <div className="section-actions">
                  <div
                    className={
                      "section-status-pill" +
                      (isComplete ? " complete" : "")
                    }
                  >
                    {s.status}
                  </div>

                  {isLocked ? (
                    <div className="section-locked">Locked</div>
                  ) : (
                    <button
                      type="button"
                      className="section-btn"
                      onClick={() => navigate(`/member/material/${s.id}`)}
                    >
                      {isComplete ? "Review" : "Continue"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </MemberLayout>
  );
}
