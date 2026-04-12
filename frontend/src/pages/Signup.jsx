import React, { useState } from "react";
import api from "../api/apiClient";
import { useNavigate, Link } from "react-router-dom";
import "../Auth.css";
import bgImage from "../assets/login-bg.jpg";

const POSITIONS = [
  "President",
  "Vice President",
  "Treasurer",
  "Secretary",
  "Chaplain",
  "Parliamentarian",
  "General Member",
];

export default function Signup() {
  const navigate = useNavigate();

  const [role, setRole] = useState("trainee");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!agree) {
      setError("You must agree to the terms of service.");
      return;
    }
    if (password !== passwordConfirm) {
      setFieldErrors((prev) => ({
        ...prev,
        password_confirm: "Passwords do not match.",
      }));
      setError("Please fix the errors below.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register/", {
        role,
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        position: role === "instructor" ? "General Member" : position,
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
          setError("Please fix the errors below.");
        }
      } else {
        setError("Unable to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
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
        <p style={{ fontSize: "0.85rem", color: "#f20606", margin: "-8px 0 16px" }}>
          Your account ID will be generated automatically based on your role.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="role">Account Role</label>
            <select
              id="role"
              className="auth-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="trainee">Member / Trainee</option>
              <option value="instructor">Instructor</option>
            </select>
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
              onChange={(e) => setEmail(e.target.value)}
              required
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

          {role === "trainee" && (
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

          <div className="auth-checkbox-row">
            <input
              id="tos"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <label htmlFor="tos">I agree to the terms of service</label>
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
