import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

const sections = [
  "What is Strategic Planning?",
  "Creating Your Personal Leadership Plan",
  "Leadership Fundamentals",
  "Strategic Thinking",
  "Defining Your Leadership Values and Vision",
];

const transcript = `
[00:00]
Welcome to this session on Leadership Fundamentals. In this video, we'll explore
the key concepts and practical applications that will help you excel in your
leadership role.

[00:15]
Let's begin by understanding the fundamental principles. These core ideas form
the foundation of effective leadership and organizational success.

[00:45]
Throughout this course, you'll learn how to apply these concepts in real-world
scenarios. We'll provide examples from successful organizations and leaders.

[01:20]
It's important to take notes and reflect on how these principles can be applied
to your specific situation and leadership context.
`;

export default function CourseMaterial() {
  const activeIndex = 2; // "Leadership Fundamentals" – you can hook this to URL later

  return (
    <MemberLayout title="Leadership Fundamentals">
      <div className="course-material-grid">
        {/* Left side: section list */}
        <aside className="material-sidebar">
          <div className="material-sidebar-title">Course Sections</div>
          {sections.map((title, idx) => {
            const complete = idx < activeIndex;
            const locked = idx > activeIndex + 1;

            const classNames = [
              "sidebar-section-item",
              idx === activeIndex ? "active" : "",
              complete ? "complete" : "",
              locked ? "locked" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div key={title} className={classNames}>
                <span>{title}</span>
                {complete && "✓"}
              </div>
            );
          })}
        </aside>

        {/* Right side: video + transcript */}
        <div className="material-main">
          <div className="material-video">
            <div className="material-video-play">▶</div>
            <div>Video: Leadership Fundamentals</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              YouTube by FutureLearn • 30 mins
            </div>
          </div>

          <div className="material-transcript">
            <h3>Transcript</h3>
            {transcript.split("\n").map((line, i) => (
              <p key={i}>{line.trim()}</p>
            ))}
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
