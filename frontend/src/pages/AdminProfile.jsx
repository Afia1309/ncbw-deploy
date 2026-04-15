import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/apiClient";
import "./Dashboard.css";
import "./ProfileShared.css";

function splitName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function formatRole(role) {
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatCreatedDate(dateValue) {
  if (!dateValue) return "";
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildAdminProfile(user = {}) {
  return {
    displayName: user.name || "",
    email: user.email || "",
    role: formatRole(user.role),
    department: user.department || "",
    phone: user.phone || "",
    memberId: user.member_id || "",
    created: formatCreatedDate(user.created),
  };
}

function mergeUpdatedAdminProfile(previousProfile, payload) {
  const updatedUser = payload?.user || payload || {};

  return {
    ...previousProfile,
    ...buildAdminProfile(updatedUser),
    displayName:
      updatedUser.name ||
      previousProfile?.displayName ||
      "",
    email: updatedUser.email ?? previousProfile?.email ?? "",
    department: updatedUser.department ?? previousProfile?.department ?? "",
    phone: updatedUser.phone ?? previousProfile?.phone ?? "",
    memberId: updatedUser.member_id ?? previousProfile?.memberId ?? "",
    role: formatRole(updatedUser.role) || previousProfile?.role || "",
    created: updatedUser.created
      ? formatCreatedDate(updatedUser.created)
      : previousProfile?.created || "",
  };
}

function EditProfileModal({ profile, onClose, onSaved }) {
  const { firstName: initialFirstName, lastName: initialLastName } = splitName(
    profile?.displayName
  );

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(profile?.email || "");
  const [department, setDepartment] = useState(profile?.department || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const getErrorText = (value) => {
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const combinedName = `${firstName} ${lastName}`.trim();

      const response = await api.patch("/auth/admin/profile/", {
        name: combinedName,
        email,
        department,
        phone,
      });

      onSaved(response.data);
      onClose();
    } catch (err) {
      setErrors(
        err.response?.data && typeof err.response.data === "object"
          ? err.response.data
          : { detail: "Failed to save changes." }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="profile-modal-header">
          <h2>Edit Profile</h2>
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-modal-form">
          <div className="profile-modal-row">
            <div className="profile-modal-field">
              <label>First Name</label>
              <input
                className="profile-modal-input"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="profile-modal-field">
              <label>Last Name</label>
              <input
                className="profile-modal-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="profile-modal-field">
            <label>Email</label>
            <input
              className="profile-modal-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && (
              <span className="profile-modal-error">{getErrorText(errors.email)}</span>
            )}
          </div>

          <div className="profile-modal-row">
            <div className="profile-modal-field">
              <label>Department</label>
              <input
                className="profile-modal-input"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              {errors.department && (
                <span className="profile-modal-error">
                  {getErrorText(errors.department)}
                </span>
              )}
            </div>

            <div className="profile-modal-field">
              <label>Phone</label>
              <input
                className="profile-modal-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {errors.phone && (
                <span className="profile-modal-error">{getErrorText(errors.phone)}</span>
              )}
            </div>
          </div>

          {errors.detail && (
            <p className="profile-modal-error">{getErrorText(errors.detail)}</p>
          )}

          <div className="profile-modal-actions">
            <button
              type="button"
              className="profile-modal-cancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="profile-modal-confirm"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const getErrorText = (value) => {
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      await api.post("/auth/admin/change-password/", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrors(
        err.response?.data && typeof err.response.data === "object"
          ? err.response.data
          : { detail: "Failed to change password." }
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="profile-modal-header">
          <h2>Change Password</h2>
          <button
            type="button"
            className="profile-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {success ? (
          <p className="profile-modal-success">Password changed successfully.</p>
        ) : (
          <form onSubmit={handleSubmit} className="profile-modal-form">
            <div className="profile-modal-field">
              <label>Current Password</label>
              <input
                className="profile-modal-input"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              {errors.current_password && (
                <span className="profile-modal-error">
                  {getErrorText(errors.current_password)}
                </span>
              )}
            </div>

            <div className="profile-modal-field">
              <label>New Password</label>
              <input
                className="profile-modal-input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              {errors.new_password && (
                <span className="profile-modal-error">
                  {getErrorText(errors.new_password)}
                </span>
              )}
            </div>

            <div className="profile-modal-field">
              <label>Confirm New Password</label>
              <input
                className="profile-modal-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {errors.confirm_password && (
                <span className="profile-modal-error">
                  {getErrorText(errors.confirm_password)}
                </span>
              )}
              {!errors.confirm_password && errors.new_password && (
                <span className="profile-modal-error">
                  {getErrorText(errors.new_password)}
                </span>
              )}
            </div>

            {errors.detail && (
              <p className="profile-modal-error">{getErrorText(errors.detail)}</p>
            )}

            <div className="profile-modal-actions">
              <button
                type="button"
                className="profile-modal-cancel"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-modal-confirm"
                disabled={saving}
              >
                {saving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const [adminProfile, setAdminProfile] = useState({
    displayName: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    memberId: "",
    created: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  async function fetchAdminProfile() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/auth/admin/profile/");
      const user = response.data?.user || {};

      setAdminProfile(buildAdminProfile(user));
    } catch (err) {
      console.error("Failed to load admin profile:", err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }

  function handleProfileSaved(payload) {
    setAdminProfile((prev) => mergeUpdatedAdminProfile(prev, payload));
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="dash-loading">Loading profile...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="dash-error">
          <p>{error}</p>
          <button onClick={fetchAdminProfile} className="dash-retry-btn">
            Try Again
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="profile-wrapper profile-wrapper--wide">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-circle">
              {(adminProfile.displayName || adminProfile.memberId || "A")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>

          <div className="profile-info-section">
            <div className="profile-header-block">
              <div className="dash-eyebrow">Profile Information</div>
              <h2 className="dash-block-title">
                {adminProfile.displayName || "Admin"}
              </h2>
              <p className="dash-subtext">
                Review your account details and keep your information up to date.
              </p>
            </div>

            <div className="profile-field-grid">
              <div className="profile-field">
                <span className="profile-label">Member ID</span>
                <span className="profile-value">{adminProfile.memberId || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Full Name</span>
                <span className="profile-value">{adminProfile.displayName || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Email</span>
                <span className="profile-value">{adminProfile.email || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Phone</span>
                <span className="profile-value">{adminProfile.phone || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Department</span>
                <span className="profile-value">
                  {adminProfile.department || "—"}
                </span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Role</span>
                <span className="profile-value">{adminProfile.role || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Created</span>
                <span className="profile-value">{adminProfile.created || "—"}</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="primary-btn profile-main-action-btn"
                type="button"
                onClick={() => setShowEditModal(true)}
              >
                Edit Profile
              </button>

              <button
                className="primary-btn profile-main-action-btn"
                type="button"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProfileModal
          profile={adminProfile}
          onClose={() => setShowEditModal(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
    </AdminLayout>
  );
}
