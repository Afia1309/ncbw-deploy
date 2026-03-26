import { Link } from "react-router-dom";
import InstructorLayout from "../components/InstructorLayout";
import "./InstructorDashboard.css";

const courses = [
  {
    id: 1,
    title: "Leadership Training 101",
    subtitle: "General Members",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
  },
  {
    id: 2,
    title: "Vice President Leadership Track",
    subtitle: "Vice Presidents",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    status: "Draft",
  },
  {
    id: 3,
    title: "President Strategy Series",
    subtitle: "Presidents",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
  },
  {
    id: 4,
    title: "Chapter Operations Essentials",
    subtitle: "Selected Students",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
  },
];

export default function InstructorDashboard() {
  return (
    <InstructorLayout
      breadcrumbs={[{ label: "My Courses", path: "/instructor/dashboard" }]}
    >
      <div className="instructor-page">
        <div className="section-header-row">
          <div>
            <h1 className="section-title">My Courses</h1>
            <p className="section-subtitle">
              Manage videos, PDFs, quizzes, tags, visibility, and progress.
            </p>
          </div>

          <Link to="/instructor/courses" className="gold-button-link">
            View All
          </Link>
        </div>

        <div className="course-tile-grid">
          {courses.map((course) => (
            <Link
              key={course.id}
              to={`/instructor/courses/${course.id}`}
              className="course-tile-link"
            >
              <div className="course-tile">
                <div
                  className="course-tile-image"
                  style={{ backgroundImage: `url(${course.image})` }}
                />
                <div className="course-tile-body">
                  <div className="course-tile-top">
                    <h3>{course.title}</h3>
                    <span className={`status-pill ${course.status.toLowerCase()}`}>
                      {course.status}
                    </span>
                  </div>
                  <p>{course.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </InstructorLayout>
  );
}