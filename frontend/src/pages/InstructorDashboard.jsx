import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import InstructorLayout from "../components/InstructorLayout";
import "./InstructorDashboard.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/training`;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80";

export default function InstructorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token =
            localStorage.getItem("access") ||
            localStorage.getItem(access_token) ||
            "";
            
        const response = await fetch(`${API_BASE}/instructor/courses/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load courses");
        }

        const data = await response.json();
        setCourses(data.slice(0, 4));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <InstructorLayout breadcrumbs={[{ label: "My Courses", path: "/instructor/dashboard" }]}>
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

        {loading ? (
          <p>Loading courses...</p>
        ) : (
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
                    style={{ backgroundImage: `url(${course.image || FALLBACK_IMAGE})` }}
                  />
                  <div className="course-tile-body">
                    <div className="course-tile-top">
                      <h3>{course.title || course.name}</h3>
                      <span className={`status-pill ${(course.status || "").toLowerCase()}`}>
                        {course.status}
                      </span>
                    </div>
                    <p>{course.subtitle || "Unassigned"}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}