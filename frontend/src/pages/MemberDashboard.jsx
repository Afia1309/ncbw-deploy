import { useEffect, useMemo, useState } from "react";
import api from "../api/apiClient";
import "./Dashboard.css";
import { useNavigate, useLocation } from "react-router-dom";

export default function MemberDashboard() {
  const [profile, setProfile] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const [pRes, mRes] = await Promise.all([
          api.get("me/"),
          api.get("me/modules/"),
        ]);
        setProfile(pRes.data);
        setModules(mRes.data);
      } catch (e) {
        console.error(e);
        setErr("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { percent, required, doneCount, totalCount } = useMemo(() => {
    const req = modules.filter((m) => m.required);
    const done = req.filter((m) => m.completed).length;
    return {
      required: req,
      doneCount: done,
      totalCount: req.length,
      percent: req.length ? Math.round((done / req.length) * 100) : 0,
    };
  }, [modules]);

  if (loading) return <div className="dash-page">Loading…</div>;
  if (err) return <div className="dash-page">{err}</div>;
  if (!profile) return <div className="dash-page">Not logged in.</div>;

  return (
    <div className="dash-page">
      {/* LEFT SIDEBAR */}
      <aside className="dash-sidebar">
        <div className="dash-profile">
          <div className="dash-avatar" aria-hidden />
          <div className="dash-name">{profile.name || "Member"}</div>
          <div className="dash-id">Member ID: {profile.member_id || ""}</div>
        </div>

<nav className="dash-nav">
  <button
    className={`dash-nav-item ${location.pathname === "/member/dashboard" ? "active" : ""}`}
    onClick={() => navigate("/member/dashboard")}
  >
    Dashboard
  </button>

  <button
    className={`dash-nav-item ${location.pathname === "/member/notifications" ? "active" : ""}`}
    onClick={() => navigate("/member/notifications")}
  >
    Notifications
  </button>

  <button
    className={`dash-nav-item ${location.pathname === "/member/profile" ? "active" : ""}`}
    onClick={() => navigate("/member/profile")}
  >
    Manage Profile
  </button>

  <button
    className={`dash-nav-item ${location.pathname === "/member/modules" ? "active" : ""}`}
    onClick={() => navigate("/member/modules")}
  >
    Modules
  </button>

  <button
    className={`dash-nav-item ${location.pathname === "/member/account" ? "active" : ""}`}
    onClick={() => navigate("/member/account")}
  >
    Account
  </button>

  <button
    className="dash-nav-item danger"
    onClick={() => {
      // later you can clear JWT tokens here if you add them
      navigate("/login");
    }}
  >
    Logout
  </button>
</nav>

      </aside>

      {/* MAIN */}
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <div className="dash-title">Dashboard</div>
            <div className="dash-subtitle">Leadership Track: {profile.track || "—"}</div>
          </div>

          <button className="dash-primary-btn">View Profile</button>
        </div>

        {/* Progress Card */}
        <section className="dash-card">
          <div className="dash-card-title">
            Your progress is {percent}% complete
          </div>
          <div className="dash-progress-wrap">
            <div className="dash-progress-bar">
              <div className="dash-progress-fill" style={{ width: `${percent}%` }} />
            </div>
            <div className="dash-progress-meta">
              Completed {doneCount} of {totalCount} required modules
            </div>
          </div>
        </section>

        {/* Required Modules */}
        <section className="dash-card">
          <div className="dash-card-title">Required Modules</div>

          <div className="dash-module-grid">
            {required.map((m) => (
              <div key={m.id} className="dash-module">
                <div className="dash-module-name">{m.title}</div>
                <div className={`dash-badge ${m.completed ? "done" : "todo"}`}>
                  {m.completed ? "Completed" : "Incomplete"}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Optional: add more cards later */}
      </main>
    </div>
  );
}
