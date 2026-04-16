import React, { useState, useEffect } from "react";
import api from "../api/apiClient";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../Auth.css";
import bgImage from "../assets/login-bg.jpg";

const POSITIONS = [
  "President",
  "Vice President",
  "Treasurer",
  "Chaplain",
  "Parliamentarian",
  "General Member",
];

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const memberId = params.get("member_id");

  const [inviteRole, setInviteRole] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!memberId) {
      setInviteLoading(false);
      return;
    }
    api
      .get(`/auth/invite-info/?member_id=${memberId}`)
      .then((res) => {
        setInviteRole(res.data.role);
        setEmail(res.data.email);
      })
      .catch(() => {
        setInviteRole(null);
      })
      .finally(() => setInviteLoading(false));
  }, [memberId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (password !== passwordConfirm) {
      setFieldErrors((prev) => ({
        ...prev,
        password_confirm: "Passwords do not match.",
      }));
      setError("Please fix the above errors.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register/", {
        member_id: memberId,
        role: inviteRole,
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        position: inviteRole === "instructor" ? "General Member" : position,
        password,
        password_confirm: passwordConfirm,
      });
      navigate("/login");
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        const newFieldErrors = {};
        Object.entries(data).forEach(([key, value]) => {
          if (Array.isArray(value)) newFieldErrors[key] = value.join(" ");
          else if (typeof value === "string") newFieldErrors[key] = value;
        });
        setFieldErrors(newFieldErrors);

        if (data.detail || data.non_field_errors) {
          setError(data.detail || data.non_field_errors.join(" "));
        } else {
          setError("Please fix the above errors.");
        }
      } else {
        setError("Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // Block direct access — signup is invite-only
  if (!memberId) {
    return (
      <div className="auth-page" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="auth-left">
          <h1 className="auth-title">
            Welcome to the NCBW-QCMC
            <br />
            Training Portal
          </h1>
        </div>
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: "12px" }}>Invalid Invitation</h1>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "24px" }}>
            This page is only accessible via a valid invitation link. Please check your email for an invite from NCBW.
          </p>
          <button className="auth-button" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (inviteLoading) {
    return (
      <div className="auth-page" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="auth-left">
          <h1 className="auth-title">
            Welcome to the NCBW-QCMC
            <br />
            Training Portal
          </h1>
        </div>
        <div className="auth-card" style={{ textAlign: "center" }}>
          <p style={{ color: "#6b7280" }}>Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!inviteRole) {
    return (
      <div className="auth-page" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="auth-left">
          <h1 className="auth-title">
            Welcome to the NCBW-QCMC
            <br />
            Training Portal
          </h1>
        </div>
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: "12px" }}>Invalid Invitation</h1>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "24px" }}>
            This invitation link is invalid or has already been used. Please check your email or contact NCBW.
          </p>
          <button className="auth-button" onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="auth-page"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="auth-left">
        <h1 className="auth-title">
          Welcome to the NCBW-QCMC
          <br />
          Training Portal
        </h1>
      </div>

      <div className="auth-card signup-card">
        <h1>Sign Up</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Role display — read-only, driven by invite */}
          <div className="auth-field">
            <label>Account Role</label>
            <input
              className="auth-input"
              type="text"
              value={inviteRole === "instructor" ? "Instructor" : "Member / Trainee"}
              readOnly
              style={{ background: "#f3f4f6", color: "#6b7280", cursor: "default" }}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              className="auth-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            {fieldErrors.first_name && (
              <div className="field-error">{fieldErrors.first_name}</div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              className="auth-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            {fieldErrors.last_name && (
              <div className="field-error">{fieldErrors.last_name}</div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              type="email"
              value={email}
              readOnly
              style={{ background: "#f3f4f6", color: "#6b7280", cursor: "default" }}
            />
            {fieldErrors.email && (
              <div className="field-error">{fieldErrors.email}</div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              className="auth-input"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            {fieldErrors.phone_number && (
              <div className="field-error">{fieldErrors.phone_number}</div>
            )}
          </div>

          {inviteRole === "trainee" && (
            <div className="auth-field">
              <label htmlFor="position">Position You Are Going For</label>
              <select
                id="position"
                className="auth-select"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              >
                <option value="">Select a position</option>
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {fieldErrors.position && (
                <div className="field-error">{fieldErrors.position}</div>
              )}
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="password-wrapper">
              <input
                id="password"
                className="auth-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="password-hint">
              Password must be at least 8 characters long and contain
              uppercase, lowercase, numbers, and special characters.
            </div>
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="passwordConfirm">Confirm Password</label>
            <div className="password-wrapper">
              <input
                id="passwordConfirm"
                className="auth-input"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {fieldErrors.password_confirm && (
              <div className="field-error">
                {fieldErrors.password_confirm}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
