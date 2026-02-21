import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import "./Dashboard.css";

export default function AdminProfile() {
  const [form, setForm] = useState({
    name: "Admin User",
    email: "admin@ncbw.org",
    pronouns: "",
    password: "password123",
    position: "Administrator",
  });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // later this can call the backend
    alert("Admin profile saved (frontend only).");
  };

  const initial =
    form.name && form.name.trim().length > 0
      ? form.name.trim()[0].toUpperCase()
      : "A";

  return (
    <AdminLayout title="Profile">
      <div className="profile-wrapper">
        <div className="profile-card">
          {/* Left: avatar + button */}
          <div>
            <div className="profile-avatar-circle">{initial}</div>
            <div className="profile-avatar-actions">
              <button type="button" className="profile-change-btn">
                Change Picture
              </button>
            </div>
          </div>

          {/* Right: form */}
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-field">
              <label className="profile-label">Full Name</label>
              <input
                className="profile-input"
                value={form.name}
                onChange={handleChange("name")}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Email Address</label>
              <input
                className="profile-input"
                value={form.email}
                onChange={handleChange("email")}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Pronouns</label>
              <input
                className="profile-input"
                placeholder="e.g., she/her, he/him, they/them"
                value={form.pronouns}
                onChange={handleChange("pronouns")}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Password</label>
              <input
                type="password"
                className="profile-input"
                value={form.password}
                onChange={handleChange("password")}
              />
            </div>

            <div className="profile-field">
              <label className="profile-label">Position</label>
              <input
                className="profile-input"
                value={form.position}
                onChange={handleChange("position")}
              />
            </div>

            <div className="profile-actions-row">
              <button type="submit" className="profile-save-btn">
                Edit Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
