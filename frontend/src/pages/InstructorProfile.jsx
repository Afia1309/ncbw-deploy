import { useEffect, useState } from "react";
import InstructorLayout from "../components/InstructorLayout";
import "./InstructorProfile.css";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}/api`;

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("access") || "";
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

// ── Edit Account Modal ────────────────────────────────────────────────────────

function EditModal({ profile, onClose, onSaved }) {
  const [firstName, setFirstName] = useState(profile.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(profile.name?.split(" ").slice(1).join(" ") || "");
  const [email, setEmail] = useState(profile.email || "");
  const [phone, setPhone] = useState(profile.phone || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const data = await apiFetch("/auth/profile/", {
        method: "PATCH",
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, phone }),
      });
      onSaved(data.user);
      onClose();
    } catch (err) {
      setErrors(typeof err === "object" ? err : { detail: "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ip-modal-overlay" onClick={onClose}>
      <div className="ip-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ip-modal-header">
          <h2>Edit Account Info</h2>
          <button type="button" className="ip-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="ip-modal-form">
          <div className="ip-modal-row">
            <div className="ip-field">
              <label>First Name</label>
              <input className="ip-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              {errors.first_name && <span className="ip-field-error">{errors.first_name}</span>}
            </div>
            <div className="ip-field">
              <label>Last Name</label>
              <input className="ip-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              {errors.last_name && <span className="ip-field-error">{errors.last_name}</span>}
            </div>
          </div>
          <div className="ip-field">
            <label>Email</label>
            <input className="ip-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {errors.email && <span className="ip-field-error">{Array.isArray(errors.email) ? errors.email[0] : errors.email}</span>}
          </div>
          <div className="ip-field">
            <label>Phone</label>
            <input className="ip-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {errors.phone && <span className="ip-field-error">{errors.phone}</span>}
          </div>
          {errors.detail && <p className="ip-field-error">{errors.detail}</p>}
          <div className="ip-modal-actions">
            <button type="button" className="secondary-profile-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-profile-btn" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────────────

function PasswordModal({ onClose }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await apiFetch("/auth/change-password/", {
        method: "POST",
        body: JSON.stringify({ current_password: current, new_password: newPwd, confirm_password: confirm }),
      });
      setSuccess(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setErrors(typeof err === "object" ? err : { detail: "Failed to change password." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ip-modal-overlay" onClick={onClose}>
      <div className="ip-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ip-modal-header">
          <h2>Change Password</h2>
          <button type="button" className="ip-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {success ? (
          <p className="ip-success">Password changed successfully.</p>
        ) : (
          <form onSubmit={handleSubmit} className="ip-modal-form">
            <div className="ip-field">
              <label>Current Password</label>
              <input className="ip-input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
              {errors.current_password && <span className="ip-field-error">{Array.isArray(errors.current_password) ? errors.current_password[0] : errors.current_password}</span>}
            </div>
            <div className="ip-field">
              <label>New Password</label>
              <input className="ip-input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required />
              {errors.new_password && <span className="ip-field-error">{Array.isArray(errors.new_password) ? errors.new_password[0] : errors.new_password}</span>}
            </div>
            <div className="ip-field">
              <label>Confirm New Password</label>
              <input className="ip-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              {errors.confirm_password && <span className="ip-field-error">{Array.isArray(errors.confirm_password) ? errors.confirm_password[0] : errors.confirm_password}</span>}
            </div>
            {errors.detail && <p className="ip-field-error">{errors.detail}</p>}
            <div className="ip-modal-actions">
              <button type="button" className="secondary-profile-btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-profile-btn" disabled={saving}>
                {saving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InstructorProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    apiFetch("/training/me/")
      .then(setProfile)
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  const firstInitial = profile?.name?.charAt(0)?.toUpperCase() || "I";

  const formatRole = (role) =>
    role ? role.charAt(0).toUpperCase() + role.slice(1) : "Instructor";

  return (
    <InstructorLayout breadcrumbs={[{ label: "Profile", path: "/instructor/profile" }]}>
      <div className="instructor-profile-page">
        {loading ? (
          <div style={{ color: "#667085", padding: "32px 0" }}>Loading profile...</div>
        ) : error ? (
          <div style={{ color: "#ef4444", padding: "32px 0" }}>{error}</div>
        ) : (
          <>
            <div className="profile-hero">
              <div className="profile-avatar">{firstInitial}</div>
              <div className="profile-hero-text">
                <h1>{profile.name}</h1>
                <p>{profile.email}</p>
                <span className="profile-role-pill">{formatRole(profile.role)}</span>
              </div>
            </div>

            <div className="profile-card">
              <h2>Account Information</h2>
              <div className="profile-info-list">
                <div className="profile-info-row">
                  <span>Account ID</span>
                  <strong>{profile.member_id || "—"}</strong>
                </div>
                <div className="profile-info-row">
                  <span>Email</span>
                  <strong>{profile.email || "—"}</strong>
                </div>
                <div className="profile-info-row">
                  <span>Role</span>
                  <strong>{formatRole(profile.role)}</strong>
                </div>
                <div className="profile-info-row">
                  <span>Position</span>
                  <strong>{profile.position || "—"}</strong>
                </div>
                <div className="profile-info-row">
                  <span>Phone</span>
                  <strong>{profile.phone || "—"}</strong>
                </div>
              </div>
            </div>

            <div className="profile-card profile-actions-card">
              <h2>Account Actions</h2>
              <div className="profile-actions">
                <button className="primary-profile-btn" type="button" onClick={() => setShowEdit(true)}>
                  Edit Account Info
                </button>
                <button className="secondary-profile-btn" type="button" onClick={() => setShowPassword(true)}>
                  Change Password
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {showEdit && profile && (
        <EditModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => setProfile((prev) => ({ ...prev, ...updated, name: updated.name || `${updated.first_name || ""} ${updated.last_name || ""}`.trim() || prev.name }))}
        />
      )}

      {showPassword && (
        <PasswordModal onClose={() => setShowPassword(false)} />
      )}
    </InstructorLayout>
  );
}
