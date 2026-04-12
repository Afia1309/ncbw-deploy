import { useNavigate, useLocation } from "react-router-dom";
import "../src/pages/Dashboard.css";

export default function AdminLayout({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Profile", path: "/admin/profile" },
    { label: "Courses", path: "/admin/courses" },
    { label: "Messages", path: "/admin/messages" },
    { label: "Feedback", path: "/admin/feedback" },
    { label: "Members", path: "/admin/members" },
    { label: "Reports", path: "/admin/reports" },
  ];

  const adminName = "Admin User";
  const getInitial = () =>
    adminName && adminName.trim().length > 0
      ? adminName.trim()[0].toUpperCase()
      : "A";

  return (
    <div className="dash-page">
      <aside className="dash-sidebar">
        <div
          className="dash-logo"
          style={{
            color: "#D4AF37",
            fontSize: "18px",
            letterSpacing: "0.08em",
          }}
        >
          NCBW-QCMC
        </div>

        <nav className="dash-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={
                "dash-sidebar-link" +
                (location.pathname.startsWith(item.path) ? " active" : "")
              }
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            className="dash-sidebar-link signout"
            onClick={() => navigate("/login")}
          >
            Sign Out
          </button>
        </nav>
      </aside>

      <main className="dash-main">
        <header className="dash-header">
          <div className="dash-header-left">
            <div className="dash-avatar">{getInitial()}</div>
            <div className="dash-header-text">
              <div className="dash-header-title">{title}</div>
            </div>
          </div>
          <div className="dash-header-brand">NCBW-QCMC</div>
        </header>

        <div className="dash-content">{children}</div>
      </main>
    </div>
  );
}
