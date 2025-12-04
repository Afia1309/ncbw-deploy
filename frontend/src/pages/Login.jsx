import React, { useState } from "react";
import api from "../api/apiClient";
import { useNavigate, Link } from "react-router-dom";
import "../Auth.css";
import bgImage from "../assets/login-bg.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      await api.post("/auth/login/", {
        member_id: memberId,
        password,
      });
      navigate("/dashboard");
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
        setError("Something went wrong. Please try again.");
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
          Welcome to NCBW
          <br />
          Training Portal
        </h1>
      </div>

      <div className="auth-card">
        <h1>Login</h1>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="memberId">Member ID</label>
            <input
              id="memberId"
              className="auth-input"
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              required
            />
            {fieldErrors.member_id && (
              <div className="field-error">{fieldErrors.member_id}</div>
            )}
          </div>

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
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-footer">
            Create an account <Link to="/signup">here.</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
