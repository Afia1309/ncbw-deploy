import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminCourseManagement.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/auth";

export default function AdminCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructor: "",
    openDate: "",
    status: "Open",
  });

  function getAuthHeaders() {
    const token = localStorage.getItem("access");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function fetchCoursePageData() {
    try {
      setLoading(true);

      const [coursesRes, instructorsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/courses/`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE}/admin/instructors/options/`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (!coursesRes.ok || !instructorsRes.ok) {
        throw new Error("Failed to load course page data.");
      }

      const coursesData = await coursesRes.json();
      const instructorsData = await instructorsRes.json();

      setCourses(coursesData);
      setInstructors(instructorsData);

      if (instructorsData.length > 0) {
        setFormData((prev) => ({
          ...prev,
          instructor: String(instructorsData[0].id),
        }));
      }
    } catch (error) {
      console.error(error);
      alert("Unable to load courses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCoursePageData();
  }, []);

  const filteredCourses = useMemo(() => {
    const value = searchTerm.toLowerCase();

    return courses.filter((course) => {
      const instructorName = (course.instructor_name || "").toLowerCase();
      return (
        course.name.toLowerCase().includes(value) ||
        instructorName.includes(value) ||
        course.status.toLowerCase().includes(value)
      );
    });
  }, [courses, searchTerm]);

  function handleOpenModal() {
    setFormData({
      name: "",
      description: "",
      instructor: instructors.length > 0 ? String(instructors[0].id) : "",
      openDate: "",
      status: "Open",
    });
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSaveCourse(e) {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.openDate ||
      !formData.instructor
    ) {
      alert("Please complete all course fields.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/courses/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          instructor: Number(formData.instructor),
          open_date: formData.openDate,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to create course.");
      }

      setCourses((prev) => [data.course, ...prev]);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function handleDeleteCourse(courseId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/admin/courses/${courseId}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
     });

      let data = {};
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to delete course.");
      }

      setCourses((prev) => prev.filter((course) => course.id !== courseId));
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-course-page">
          <p>Loading courses...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-course-page">
        <div className="course-page-header">
          <div>
            <h1>Courses</h1>
            <p>View available training courses, instructors, and enrollment.</p>
          </div>

          <button className="add-course-btn" onClick={handleOpenModal}>
            Add Course
          </button>
        </div>

        <div className="course-toolbar">
          <input
            type="text"
            className="course-search"
            placeholder="Search by course name, instructor, or status"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="course-table-panel">
          <div className="course-table-scroll">
            <table className="course-table">
              <thead>
                <tr>
                  <th>Course Name</th>
                  <th>Description</th>
                  <th>Open Date</th>
                  <th>Instructor</th>
                  <th>Enrollment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.name}</td>
                      <td>{course.description}</td>
                      <td>{formatDate(course.open_date)}</td>
                      <td>{course.instructor_name}</td>
                      <td>{course.enrollment}</td>
                      <td>
                        <span
                          className={`course-status ${
                            course.status === "Open" ? "status-open" : "status-draft"
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="table-action-btn delete"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No courses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Add Course</h2>
              <p className="modal-subtext">
                Enter the course details and assign an instructor.
              </p>

              <form onSubmit={handleSaveCourse} className="course-form">
                <div className="form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter course name"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter course description"
                    rows="4"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Instructor</label>
                    <select
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleChange}
                    >
                      {instructors.map((instructor) => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Open Date</label>
                    <input
                      type="date"
                      name="openDate"
                      value={formData.openDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn primary">
                    Save Course
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}