import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InstructorLayout from "../components/InstructorLayout";
import "./InstructorCourses.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api/training`;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80";

export default function InstructorCourses() {
  const [viewMode, setViewMode] = useState("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
            localStorage.getItem("access") ||
            localStorage.getItem("access_token") ||
            "";
            
        const response = await fetch(`${API_BASE}/instructor/courses/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load instructor courses.");
        }

        const data = await response.json();
        setCourses(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load courses.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (statusFilter !== "All") {
      result = result.filter((course) => course.status === statusFilter);
    }

    const value = searchTerm.trim().toLowerCase();

    if (value) {
      result = result.filter((course) => {
        return (
          (course.title || course.name || "").toLowerCase().includes(value) ||
          (course.subtitle || "").toLowerCase().includes(value) ||
          (course.code || "").toLowerCase().includes(value) ||
          (course.status || "").toLowerCase().includes(value)
        );
      });
    }

    return result;
  }, [courses, searchTerm, statusFilter]);

  const showSearchResults = searchTerm.trim().length > 0;

  return (
    <InstructorLayout breadcrumbs={[{ label: "My Courses", path: "/instructor/courses" }]}>
      <div className="courses-page">
        <div className="courses-header">
          <h1 className="courses-title">My Courses</h1>
        </div>

        <div className="courses-toolbar">
          <div className="view-toggle" aria-label="View toggle">
            <button
              type="button"
              className={viewMode === "cards" ? "toggle-icon-btn active" : "toggle-icon-btn"}
              onClick={() => setViewMode("cards")}
            >
              ⊞
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "toggle-icon-btn active" : "toggle-icon-btn"}
              onClick={() => setViewMode("list")}
            >
              ☰
            </button>
          </div>

          <div className="search-wrap">
            <input
              type="text"
              placeholder="Search your courses"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="course-search"
            />
          </div>

          <div className="filter-wrap">
            <label className="filter-label" htmlFor="statusFilter">
              Filter
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="course-filter"
            >
              <option value="All">All courses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        {loading && <p>Loading courses...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && showSearchResults && (
          <p className="results-count">{filteredCourses.length} results</p>
        )}

        {!loading && !error && viewMode === "cards" && (
          <div className="course-grid">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/instructor/courses/${course.id}`}
                className="course-card-link"
              >
                <div className="course-card">
                  <div
                    className="course-card-image"
                    style={{ backgroundImage: `url(${course.image || FALLBACK_IMAGE})` }}
                  />
                  <div className="course-card-body">
                    <div className="course-card-top">
                      <h3>{course.title || course.name}</h3>
                      <span className={`status-pill ${(course.status || "").toLowerCase()}`}>
                        {course.status}
                      </span>
                    </div>
                    <p className="course-subtitle">{course.subtitle || "Unassigned"}</p>
                    <p className="course-code">{course.code || ""}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && viewMode === "list" && (
          <div className="course-list">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/instructor/courses/${course.id}`}
                className="course-list-link"
              >
                <div className="course-list-row">
                  <div className={`list-accent ${(course.status || "").toLowerCase()}`} />
                  <div className="course-list-content">
                    <p className="list-code">{course.code || ""}</p>
                    <h3>{course.title || course.name}</h3>
                    <div className="list-meta">
                      <span>{course.subtitle || "Unassigned"}</span>
                      <span>{course.instructor_name || ""}</span>
                      <span>{course.status}</span>
                    </div>
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