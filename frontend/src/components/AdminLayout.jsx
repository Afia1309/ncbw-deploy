import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate("/login");
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">NCBW</div>

        <nav className="admin-nav">
          <Link
            to="/admin/dashboard"
            className={location.pathname === "/admin/dashboard" ? "active" : ""}
          >
            Dashboard
          </Link>

          <Link
            to="/admin/profile"
            className={location.pathname === "/admin/profile" ? "active" : ""}
          >
            Profile
          </Link>

          <Link
            to="/admin/courses"
            className={location.pathname.startsWith("/admin/courses") ? "active" : ""}
          >
            Courses
          </Link>
        </nav>

        {/* SIGN OUT BUTTON */}
        <div className="admin-signout">
          <button onClick={handleLogout}>Sign Out</button>
        </div>

      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}