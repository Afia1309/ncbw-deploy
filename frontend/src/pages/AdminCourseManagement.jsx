import React, { useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminCourseManagement.css";

export default function AdminCourseManagement() {
  const instructors = [
    "Kofi Mensah",
    "Ama Boateng",
    "Yaw Asante",
    "Efua Nyarko",
    "Kojo Mensimah",
  ];

  const [courses, setCourses] = useState([
    {
      id: 1,
      name: "Leadership Foundations",
      description: "Introduction to foundational leadership principles.",
      openDate: "Mar 1, 2026",
      instructor: "Kofi Mensah",
      enrollment: 35,
      status: "Open",
    },
    {
      id: 2,
      name: "Team Communication",
      description: "Build effective communication and collaboration skills.",
      openDate: "Mar 8, 2026",
      instructor: "Ama Boateng",
      enrollment: 28,
      status: "Open",
    },
    {
      id: 3,
      name: "Conflict Resolution",
      description: "Learn how to manage and resolve conflict well.",
      openDate: "Mar 15, 2026",
      instructor: "Yaw Asante",
      enrollment: 22,
      status: "Open",
    },
    {
      id: 4,
      name: "Time Management",
      description: "Practical strategies for planning and prioritization.",
      openDate: "Apr 2, 2026",
      instructor: "Efua Nyarko",
      enrollment: 18,
      status: "Draft",
    },
    {
      id: 5,
      name: "Servant Leadership",
      description: "Understand leadership through service and influence.",
      openDate: "Apr 10, 2026",
      instructor: "Kofi Mensah",
      enrollment: 31,
      status: "Open",
    },
    {
      id: 6,
      name: "Public Speaking",
      description: "Develop confidence and clarity in public speaking.",
      openDate: "Apr 18, 2026",
      instructor: "Ama Boateng",
      enrollment: 16,
      status: "Open",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructor: instructors[0],
    openDate: "",
    status: "Open",
  });

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const value = searchTerm.toLowerCase();
      return (
        course.name.toLowerCase().includes(value) ||
        course.instructor.toLowerCase().includes(value) ||
        course.status.toLowerCase().includes(value)
      );
    });
  }, [courses, searchTerm]);

  function handleOpenModal() {
    setFormData({
      name: "",
      description: "",
      instructor: instructors[0],
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

  function handleSaveCourse(e) {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || !formData.openDate) {
      return;
    }

    const newCourse = {
      id: Date.now(),
      name: formData.name,
      description: formData.description,
      instructor: formData.instructor,
      openDate: new Date(formData.openDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      enrollment: 0,
      status: formData.status,
    };

    setCourses((prev) => [newCourse, ...prev]);
    setShowModal(false);
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
                </tr>
              </thead>

              <tbody>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.name}</td>
                      <td>{course.description}</td>
                      <td>{course.openDate}</td>
                      <td>{course.instructor}</td>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="empty-state">
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
                        <option key={instructor} value={instructor}>
                          {instructor}
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
                    <option value="Open">Open</option>
                    <option value="Draft">Draft</option>
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