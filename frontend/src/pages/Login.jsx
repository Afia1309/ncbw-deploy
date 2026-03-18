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
      const response = await api.post("/token/", {
        username: memberId,
        password: password,
      });

      const data = response.data;

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      const role = data.user?.role;

      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "instructor") {
        navigate("/instructor/dashboard");
      } else {
        navigate("/member/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data);

      if (err.response && err.response.data) {
        const data = err.response.data;

        if (data.detail) {
          setError(data.detail);
        } else if (data.non_field_errors) {
          setError(data.non_field_errors.join(" "));
        } else {
          setError("Invalid Member ID or password.");
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const isLocked =
    typeof error === "string" && error.toLowerCase().includes("locked");

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${bgImage})` }}>
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
              placeholder="Enter your Member ID"
              required
            />
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
                placeholder="Enter your password"
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

            <div style={{ marginTop: 10, textAlign: "right" }}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <div className="auth-error">
              {error}
              {isLocked && (
                <div style={{ marginTop: 8 }}>
                  <Link to="/forgot-password">Reset password</Link>
                </div>
              )}
            </div>
          )}

          <div className="auth-footer">
            Don't have an account? <Link to="/signup">Create one here.</Link>
          </div>
        </form>
      </div>
    </div>
  );
}