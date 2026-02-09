import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const mockCourses = [
  {
    id: 1,
    title: "Leadership & Strategic Visioning",
    description: "Complete 5 sections to master leadership & strategic visioning.",
    progress: 60,
  },
  {
    id: 2,
    title: "Effective Public Speaking & Communication",
    description: "Build your confidence in speaking and communicating clearly.",
    progress: 20,
  },
  {
    id: 3,
    title: "Conflict Resolution & Mediation",
    description: "Learn techniques for resolving conflict in teams.",
    progress: 0,
  },
  {
    id: 4,
    title: "Delegation & Time Management",
    description: "Improve your prioritization and delegation skills.",
    progress: 0,
  },
  {
    id: 5,
    title: "Organizational Culture & Ethics",
    description: "Understand culture, ethics, and inclusive leadership.",
    progress: 0,
  },
];

export default function CourseSelection() {
  const navigate = useNavigate();

  const allComplete = mockCourses.every((c) => c.progress === 100);

  return (
    <MemberLayout title="Courses">
      <div className="course-list">
        {mockCourses.map((course) => (
          <div key={course.id} className="course-item">
            <div className="course-header-row">
              <div className="course-title">{course.title}</div>
            </div>

            <div className="course-description">{course.description}</div>

            <div className="course-meta">
              <span>{course.progress}% Complete</span>
              <div className="course-progress-bar">
                <div
                  className="course-progress-fill"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
              <button
                className="course-view-btn"
                type="button"
                onClick={() => navigate(`/member/course/${course.id}`)}
              >
                View Course
              </button>
            </div>
          </div>
        ))}

        <div className="course-certificate-banner">
          {allComplete
            ? "All courses complete! View your certificate."
            : "Complete all courses to view your certificate."}
        </div>
      </div>
    </MemberLayout>
  );
}
