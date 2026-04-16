import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";
import "./ProfileShared.css";

function splitName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function mergeUpdatedProfile(previousProfile, payload) {
  const updatedUser = payload?.user || payload || {};
  const firstName = updatedUser.first_name ?? splitName(previousProfile?.name).firstName;
  const lastName = updatedUser.last_name ?? splitName(previousProfile?.name).lastName;
  const mergedName =
    updatedUser.name ||
    `${firstName} ${lastName}`.trim() ||
    previousProfile?.name ||
    "Member";

  return {
    ...previousProfile,
    ...updatedUser,
    name: mergedName,
    email: updatedUser.email ?? previousProfile?.email ?? "",
    phone: updatedUser.phone ?? previousProfile?.phone ?? "",
  };
}

function EditProfileModal({ profile, onClose, onSaved }) {
  const { firstName: initialFirstName, lastName: initialLastName } = splitName(profile?.name);

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [email, setEmail] = useState(profile?.email || "");
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
      const response = await api.patch("/auth/profile/", {
        first_name: firstName,
        last_name: lastName,
        email,
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
              {errors.first_name && (
                <span className="profile-modal-error">{getErrorText(errors.first_name)}</span>
              )}
            </div>

            <div className="profile-modal-field">
              <label>Last Name</label>
              <input
                className="profile-modal-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              {errors.last_name && (
                <span className="profile-modal-error">{getErrorText(errors.last_name)}</span>
              )}
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

          {errors.detail && <p className="profile-modal-error">{getErrorText(errors.detail)}</p>}

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
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const getErrorText = (value) => {
    if (Array.isArray(value)) return value[0];
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      await api.post("/auth/change-password/", {
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
              <div className="password-wrapper">
                <input
                  className="profile-modal-input"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowCurrent(v => !v)}>
                  {showCurrent ? "Hide" : "Show"}
                </button>
              </div>
              {errors.current_password && (
                <span className="profile-modal-error">
                  {getErrorText(errors.current_password)}
                </span>
              )}
            </div>

            <div className="profile-modal-field">
              <label>New Password</label>
              <div className="password-wrapper">
                <input
                  className="profile-modal-input"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowNew(v => !v)}>
                  {showNew ? "Hide" : "Show"}
                </button>
              </div>
              {errors.new_password && (
                <span className="profile-modal-error">
                  {getErrorText(errors.new_password)}
                </span>
              )}
            </div>

            <div className="profile-modal-field">
              <label>Confirm New Password</label>
              <div className="password-wrapper">
                <input
                  className="profile-modal-input"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirm_password && (
                <span className="profile-modal-error">
                  {getErrorText(errors.confirm_password)}
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

export default function MemberProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) throw new Error("No refresh token");

      const response = await api.post("/token/refresh/", { refresh });
      localStorage.setItem("access_token", response.data.access);
      return response.data.access;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return null;
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      let response;

      try {
        response = await api.get("/training/me/");
      } catch (err) {
        if (err.response?.status === 401) {
          const newToken = await refreshToken();

          if (newToken) {
            response = await api.get("/training/me/");
          } else {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            navigate("/login");
            return;
          }
        } else {
          throw err;
        }
      }

      setProfile(response.data);
    } catch (err) {
      console.error("Profile error:", err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSaved = (payload) => {
    setProfile((prev) => mergeUpdatedProfile(prev, payload));
  };

  if (loading) {
    return (
      <MemberLayout title="Profile">
        <div className="dash-loading">Loading profile...</div>
      </MemberLayout>
    );
  }

  if (error) {
    return (
      <MemberLayout title="Profile">
        <div className="dash-error">
          <p>{error}</p>
          <button onClick={fetchProfile} className="dash-retry-btn">
            Try Again
          </button>
        </div>
      </MemberLayout>
    );
  }

  if (!profile) {
    return (
      <MemberLayout title="Profile">
        <div className="dash-error">No profile data available.</div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout title="Member Profile">
      <div className="profile-wrapper profile-wrapper--wide">
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-circle">
              {profile.name?.charAt(0) || profile.member_id?.toString().charAt(0) || "U"}
            </div>
          </div>

          <div className="profile-info-section">
            <div className="profile-header-block">
              <div className="dash-eyebrow">Profile Information</div>
              <h2 className="dash-block-title">{profile.name || "Member"}</h2>
              <p className="dash-subtext">
                Review your account details and keep your information up to date.
              </p>
            </div>

            <div className="profile-field-grid">
              <div className="profile-field">
                <span className="profile-label">Member ID</span>
                <span className="profile-value">{profile.member_id || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Full Name</span>
                <span className="profile-value">{profile.name || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Email</span>
                <span className="profile-value">{profile.email || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Phone</span>
                <span className="profile-value">{profile.phone || "—"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Position</span>
                <span className="profile-value">{profile.position || "General Member"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Role</span>
                <span className="profile-value">{profile.role || "Trainee"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Cohort</span>
                <span className="profile-value">{profile.cohort || "2026"}</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="primary-btn profile-main-action-btn"
                type="button"
                onClick={() => setShowEditProfile(true)}
              >
                Edit Profile
              </button>

              <button
                className="primary-btn profile-main-action-btn"
                type="button"
                onClick={() => setShowChangePassword(true)}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditProfile && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onSaved={handleProfileSaved}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </MemberLayout>
  );
}
