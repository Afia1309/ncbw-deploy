import { useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import "./Dashboard.css";

const prereqOptions = [
  "No prerequisite",
  "Completion of another course",
  "Leadership role required",
];

export default function AdminCourseForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [courseTitle, setCourseTitle] = useState(
    "Leadership & Strategic Visioning"
  );
  const [description, setDescription] = useState(
    "Develop leadership skills and learn strategic visioning for organizational success..."
  );
  const [duration, setDuration] = useState("3h 5m");

  const [sections, setSections] = useState([
    {
      id: 1,
      title: "What is Strategic Planning?",
      minutes: "20 mins",
      prerequisite: "No prerequisite",
      provider: "LinkedIn Learning",
      required: true,
    },
    {
      id: 2,
      title: "Creating Your Personal Leadership Plan",
      minutes: "45 mins",
      prerequisite: "No prerequisite",
      provider: "Coursera",
      required: true,
    },
  ]);

  const handleSectionChange = (sectionId, field, value) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s))
    );
  };

  const handleToggleRequired = (sectionId) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, required: !s.required } : s
      )
    );
  };

  const handleAddSection = () => {
    const nextId = sections.length
      ? Math.max(...sections.map((s) => s.id)) + 1
      : 1;
    setSections((prev) => [
      ...prev,
      {
        id: nextId,
        title: "",
        minutes: "",
        prerequisite: "No prerequisite",
        provider: "",
        required: true,
      },
    ]);
  };

  const handleRemoveSection = (sectionId) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // temporary: show a basic summary
    console.log({
      courseTitle,
      description,
      duration,
      sections,
    });
    alert("Course data logged to console (frontend only).");
  };

  return (
    <AdminLayout title={isEdit ? "Edit Course" : "Add Course"}>
      <div className="course-form-wrapper">
        <form className="course-form-card" onSubmit={handleSubmit}>
          {/* Course Title */}
          <section className="course-form-section">
            <h2 className="course-form-section-heading">Course Title</h2>
            <input
              className="course-form-input"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Enter course title"
            />
          </section>

          {/* Description */}
          <section className="course-form-section">
            <h2 className="course-form-section-heading">Description</h2>
            <textarea
              className="course-form-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the course content and objectives..."
            />
          </section>

          {/* Duration */}
          <section className="course-form-section">
            <h2 className="course-form-section-heading">Estimated Duration</h2>
            <input
              className="course-form-input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 3h 5m"
            />
          </section>

          {/* Course Sections */}
          <section className="course-form-section">
            <div className="course-form-section-header">
              <h2 className="course-form-section-heading">Course Sections</h2>
              <button
                type="button"
                className="course-form-add-section-btn"
                onClick={handleAddSection}
              >
                + Add Section
              </button>
            </div>

            {sections.map((section, index) => (
              <div key={section.id} className="course-form-section-card">
                <div className="course-form-section-card-header">
                  <span className="course-form-section-label">
                    Section {index + 1}
                  </span>
                  <button
                    type="button"
                    className="course-form-delete-section-btn"
                    onClick={() => handleRemoveSection(section.id)}
                    title="Remove section"
                  >
                    🗑
                  </button>
                </div>

                <div className="course-form-field-grid">
                  <div className="course-form-field">
                    <label className="course-form-label">
                      Section Title
                    </label>
                    <input
                      className="course-form-input"
                      value={section.title}
                      onChange={(e) =>
                        handleSectionChange(section.id, "title", e.target.value)
                      }
                      placeholder="Enter section title"
                    />
                  </div>

                  <div className="course-form-field">
                    <label className="course-form-label">Duration</label>
                    <input
                      className="course-form-input"
                      value={section.minutes}
                      onChange={(e) =>
                        handleSectionChange(
                          section.id,
                          "minutes",
                          e.target.value
                        )
                      }
                      placeholder="e.g., 30 mins"
                    />
                  </div>

                  <div className="course-form-field">
                    <label className="course-form-label">
                      Prerequisite
                    </label>
                    <select
                      className="course-form-select"
                      value={section.prerequisite}
                      onChange={(e) =>
                        handleSectionChange(
                          section.id,
                          "prerequisite",
                          e.target.value
                        )
                      }
                    >
                      {prereqOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="course-form-field">
                    <label className="course-form-label">Source</label>
                    <input
                      className="course-form-input"
                      value={section.provider}
                      onChange={(e) =>
                        handleSectionChange(
                          section.id,
                          "provider",
                          e.target.value
                        )
                      }
                      placeholder="e.g., LinkedIn Learning"
                    />
                  </div>
                </div>

                <label className="course-form-required">
                  <input
                    type="checkbox"
                    checked={section.required}
                    onChange={() => handleToggleRequired(section.id)}
                  />
                  <span>Required section</span>
                </label>
              </div>
            ))}
          </section>

          {/* Actions */}
          <div className="course-form-actions">
            <button
              type="button"
              className="course-form-btn secondary"
              onClick={() => alert("Preview course (frontend only)")}
            >
              👁 Preview Course
            </button>
            <button type="submit" className="course-form-btn primary">
              Publish Course
            </button>
            <button
              type="button"
              className="course-form-btn tertiary"
              onClick={() => alert("Saved as draft (frontend only)")}
            >
              Save as Draft
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
