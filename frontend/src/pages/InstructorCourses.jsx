import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InstructorLayout from "../components/InstructorLayout";
import "./InstructorCourses.css";

const courses = [
  {
    id: 1,
    title: "Leadership Training 101",
    subtitle: "General Members",
    instructor: "Afua Atiase",
    code: "NCBW-101",
    image:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
  },
  {
    id: 2,
    title: "Vice President Leadership Track",
    subtitle: "Vice Presidents",
    instructor: "Afua Atiase",
    code: "NCBW-201",
    image:
      "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
    status: "Draft",
  },
  {
    id: 3,
    title: "President Strategy Series",
    subtitle: "Presidents",
    instructor: "Afua Atiase",
    code: "NCBW-301",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
  },
  {
    id: 4,
    title: "Chapter Operations Essentials",
    subtitle: "Selected Students",
    instructor: "Afua Atiase",
    code: "NCBW-220",
    image:
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
    status: "Published",
  },
  {
    id: 5,
    title: "General Member Orientation",
    subtitle: "General Members",
    instructor: "Afua Atiase",
    code: "NCBW-100",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    status: "Draft",
  },
];

function CardViewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="10.5" y="1.5" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="1.5" y="10.5" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="10.5" y="10.5" width="6" height="6" rx="1.2" fill="currentColor" />
    </svg>
  );
}

function ListViewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="1.5" y="2" width="3" height="3" rx="0.8" fill="currentColor" />
      <rect x="6.5" y="2.3" width="10" height="2.4" rx="1.2" fill="currentColor" />
      <rect x="1.5" y="7.5" width="3" height="3" rx="0.8" fill="currentColor" />
      <rect x="6.5" y="7.8" width="10" height="2.4" rx="1.2" fill="currentColor" />
      <rect x="1.5" y="13" width="3" height="3" rx="0.8" fill="currentColor" />
      <rect x="6.5" y="13.3" width="10" height="2.4" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export default function InstructorCourses() {
  const [viewMode, setViewMode] = useState("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredCourses = useMemo(() => {
    let result = [...courses];

    if (statusFilter !== "All") {
      result = result.filter((course) => course.status === statusFilter);
    }

    const value = searchTerm.trim().toLowerCase();

    if (value) {
      result = result.filter((course) => {
        return (
          course.title.toLowerCase().includes(value) ||
          course.subtitle.toLowerCase().includes(value) ||
          course.code.toLowerCase().includes(value) ||
          course.status.toLowerCase().includes(value)
        );
      });
    }

    return result;
  }, [searchTerm, statusFilter]);

  const showSearchResults = searchTerm.trim().length > 0;

  return (
    <InstructorLayout
      breadcrumbs={[{ label: "My Courses", path: "/instructor/courses" }]}
    >
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
              title="Card view"
              aria-label="Card view"
            >
              <CardViewIcon />
            </button>
            <button
              type="button"
              className={viewMode === "list" ? "toggle-icon-btn active" : "toggle-icon-btn"}
              onClick={() => setViewMode("list")}
              title="List view"
              aria-label="List view"
            >
              <ListViewIcon />
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

        {showSearchResults && (
          <p className="results-count">{filteredCourses.length} results</p>
        )}

        {viewMode === "cards" ? (
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
                    style={{ backgroundImage: `url(${course.image})` }}
                  />
                  <div className="course-card-body">
                    <div className="course-card-top">
                      <h3>{course.title}</h3>
                      <span className={`status-pill ${course.status.toLowerCase()}`}>
                        {course.status}
                      </span>
                    </div>
                    <p className="course-subtitle">{course.subtitle}</p>
                    <p className="course-code">{course.code}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="course-list">
            {filteredCourses.map((course) => (
              <Link
                key={course.id}
                to={`/instructor/courses/${course.id}`}
                className="course-list-link"
              >
                <div className="course-list-row">
                  <div className={`list-accent ${course.status.toLowerCase()}`} />
                  <div className="course-list-content">
                    <p className="list-code">{course.code}</p>
                    <h3>{course.title}</h3>
                    <div className="list-meta">
                      <span>{course.subtitle}</span>
                      <span>{course.instructor}</span>
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