import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import "./Dashboard.css";

const mockCourses = [
  {
    id: 1,
    title: "Leadership & Strategic Visioning",
    status: "Published",
    lastUpdated: "2025-11-25",
  },
  {
    id: 2,
    title: "Effective Public Speaking & Communication",
    status: "Published",
    lastUpdated: "2025-11-24",
  },
  {
    id: 3,
    title: "Conflict Resolution & Mediation",
    status: "Published",
    lastUpdated: "2025-11-23",
  },
  {
    id: 4,
    title: "Delegation & Time Management",
    status: "Published",
    lastUpdated: "2025-11-22",
  },
  {
    id: 5,
    title: "Organizational Culture & Ethics",
    status: "Published",
    lastUpdated: "2025-11-21",
  },
  {
    id: 6,
    title: "Project Management Essentials",
    status: "Published",
    lastUpdated: "2025-11-20",
  },
  {
    id: 7,
    title: "Effective Communication & Team Dynamics",
    status: "Published",
    lastUpdated: "2025-11-19",
  },
  {
    id: 8,
    title: "Strategic Planning & Operational Support",
    status: "Draft",
    lastUpdated: "2025-11-18",
  },
  {
    id: 9,
    title: "Succession Planning & Mentorship",
    status: "Draft",
    lastUpdated: "2025-11-17",
  },
  {
    id: 10,
    title: "Risk Management & Crisis Response",
    status: "Draft",
    lastUpdated: "2025-11-16",
  },
];

export default function AdminCourseManagement() {
  const navigate = useNavigate();

  const handleAddNew = () => {
    navigate("/admin/courses/new");
  };

  const handleEdit = (id) => {
    navigate(`/admin/courses/${id}/edit`);
  };

  const handleDelete = (id) => {
    // frontend-only for now
    alert(`Delete course ${id} (frontend only demo)`);
  };

  return (
    <AdminLayout title="Course Management">
      <div className="course-mgmt-wrapper">
        <div className="course-mgmt-table">
          <div className="course-mgmt-header-row">
            <div className="course-mgmt-col-title">Course Title</div>
            <div className="course-mgmt-col-status">Status</div>
            <div className="course-mgmt-col-updated">Last Updated</div>
            <div className="course-mgmt-col-actions">Actions</div>
          </div>

          {mockCourses.map((course) => (
            <div key={course.id} className="course-mgmt-row">
              <div className="course-mgmt-cell title">{course.title}</div>

              <div className="course-mgmt-cell status">
                <span
                  className={
                    "admin-status-pill " +
                    (course.status === "Published" ? "active" : "draft")
                  }
                >
                  {course.status}
                </span>
              </div>

              <div className="course-mgmt-cell updated">
                {course.lastUpdated}
              </div>

              <div className="course-mgmt-cell actions">
                <button
                  type="button"
                  className="course-mgmt-action edit"
                  onClick={() => handleEdit(course.id)}
                >
                  <span className="course-mgmt-action-icon">✏️</span>
                  Edit
                </button>
                <button
                  type="button"
                  className="course-mgmt-action delete"
                  onClick={() => handleDelete(course.id)}
                >
                  <span className="course-mgmt-action-icon">🗑</span>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="course-mgmt-add-btn"
          onClick={handleAddNew}
        >
          Add New Course
        </button>
      </div>
    </AdminLayout>
  );
}
