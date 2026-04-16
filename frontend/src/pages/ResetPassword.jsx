import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/apiClient";
import "../Auth.css";
import bgImage from "../assets/login-bg.jpg";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const uid = useMemo(() => searchParams.get("uid") || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", msg: "" });
    setLoading(true);

    try {
      const res = await api.post("/auth/reset-password/", {
        uid,
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setStatus({
        type: "success",
        msg: res.data.message || "Password has been reset successfully.",
      });

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const data = err.response?.data;
    const msg =
        data?.detail ||
        data?.new_password?.[0] ||
        data?.confirm_password?.[0] ||
        data?.current_password?.[0] ||
        "Could not reset password.";

    setStatus({
        type: "error",
        msg,
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
        <h2>Set New Password</h2>
        <p>Enter your new password below.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              className="auth-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>

          {status.msg && (
            <div className={status.type === "error" ? "auth-error" : "auth-success"}>
              {status.msg}
            </div>
          )}

          <div className="auth-footer" style={{ marginTop: 12 }}>
            <Link to="/login">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}