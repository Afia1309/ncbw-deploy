import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/apiClient";
import "../Auth.css";
import bgImage from "../assets/login-bg.jpg";

export default function ForgotPassword() {
  const [memberId, setMemberId] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", msg: "" });
    setLoading(true);

    try {
      // ✅ correct path with your apiClient baseURL
      await api.post("/auth/password-reset/", { member_id: memberId });

      setStatus({
        type: "success",
        msg: "If an account exists for that Member ID, a reset link has been sent to the email on file.",
      });
      setMemberId("");
    } catch (err) {
      console.error(err);
      setStatus({
        type: "error",
        msg: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

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
        <h2>Reset Password</h2>
        <p>Enter your Member ID and we’ll send a password reset link.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="memberId">Member ID</label>
            <input
              id="memberId"
              className="auth-input"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="e.g. 12345"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>

          {status.msg && (
            <div className={status.type === "error" ? "auth-error" : "auth-success"}>
              {status.msg}
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: 12 }}>
            <Link to="/">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
