import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function ManageProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // profile or password
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get("/training/me/");
      const nameParts = response.data.name.split(' ');
      
      setFormData({
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(' ') || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
      });
    } catch (err) {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put("/auth/profile/", formData);
      setSuccess("Profile updated successfully!");
      
      // Refresh profile data
      await fetchProfile();
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        const errorMessage = Object.values(errorData).flat().join(' ');
        setError(errorMessage);
      } else {
        setError("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError("New passwords do not match");
      setSaving(false);
      return;
    }

    try {
      await api.post("/auth/change-password/", passwordData);
      setSuccess("Password changed successfully!");
      
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      if (err.response?.data) {
        const errorData = err.response.data;
        const errorMessage = Object.values(errorData).flat().join(' ');
        setError(errorMessage);
      } else {
        setError("Failed to change password");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <MemberLayout title="Manage Profile">
        <div className="dash-loading">Loading profile...</div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout title="Manage Profile">
      <div className="profile-wrapper">
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Edit Profile
          </button>
          <button
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        <div className="profile-card">
          {activeTab === 'profile' ? (
            <form className="profile-form" onSubmit={handleSubmitProfile}>
              <div className="profile-field">
                <label className="profile-label">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  className="profile-input"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  className="profile-input"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="profile-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="profile-input"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              {/* Position removed - not editable by user */}

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <div className="profile-actions-row">
                <button 
                  type="submit" 
                  className="profile-save-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button 
                  type="button" 
                  className="profile-cancel-btn"
                  onClick={() => navigate('/member/profile')}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <form className="profile-form" onSubmit={handleSubmitPassword}>
              <div className="profile-field">
                <label className="profile-label">Current Password</label>
                <input
                  type="password"
                  name="current_password"
                  className="profile-input"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">New Password</label>
                <input
                  type="password"
                  name="new_password"
                  className="profile-input"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  required
                />
                <div className="password-hint">
                  Password must be at least 8 characters long and contain
                  uppercase, lowercase, numbers, and special characters.
                </div>
              </div>

              <div className="profile-field">
                <label className="profile-label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirm_password"
                  className="profile-input"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  required
                />
              </div>

              {error && <div className="auth-error">{error}</div>}
              {success && <div className="auth-success">{success}</div>}

              <div className="profile-actions-row">
                <button 
                  type="submit" 
                  className="profile-save-btn"
                  disabled={saving}
                >
                  {saving ? "Changing..." : "Change Password"}
                </button>
                <button 
                  type="button" 
                  className="profile-cancel-btn"
                  onClick={() => setActiveTab('profile')}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </MemberLayout>
  );
}