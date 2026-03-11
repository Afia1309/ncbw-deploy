import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/apiClient";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function MemberProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
      <div className="profile-wrapper">
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
                <span className="profile-label">Track</span>
                <span className="profile-value">{profile.track || "Leadership Track"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Phase</span>
                <span className="profile-value">{profile.phase || "Phase 1"}</span>
              </div>

              <div className="profile-field">
                <span className="profile-label">Cohort</span>
                <span className="profile-value">{profile.cohort || "2026"}</span>
              </div>
            </div>

            <div className="profile-actions">
              <button
                className="primary-btn"
                onClick={() => navigate("/member/manage-profile")}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </MemberLayout>
  );
}
