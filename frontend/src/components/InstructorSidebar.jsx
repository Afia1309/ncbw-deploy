import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_BASE = `${
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
}/api`;

function getToken() {
  return localStorage.getItem("access_token") || localStorage.getItem("access") || "";
}

export default function InstructorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    fetch(`${API_BASE}/notifications/unread-count/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.unread !== undefined) setUnread(data.unread);
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleSignOut = async () => {
    const token = getToken();
    const refresh = localStorage.getItem("refresh_token") || localStorage.getItem("refresh");

    try {
      if (refresh) {
        await fetch(`${API_BASE}/auth/logout/`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh }),
        });
      }
    } catch {
      /* continue regardless */
    }

    ["access_token", "access", "refresh_token", "refresh", "user"].forEach((k) =>
      localStorage.removeItem(k)
    );

    navigate("/login");
  };

  const navItem = (path) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "13px 18px",
    borderRadius: "999px",
    textDecoration: "none",
    color: "#18324B",
    fontWeight: 600,
    fontSize: "16px",
    background: location.pathname.startsWith(path) ? "#EEE7D3" : "transparent",
    marginBottom: "6px",
    transition: "background 0.15s",
  });

  return (
    <aside style={styles.sidebar}>
      <div>
        <h1 style={styles.logo}>NCBW-QCMC</h1>

        <nav style={{ marginTop: "36px" }}>
          <Link to="/instructor/courses" style={navItem("/instructor/courses")}>
            My Courses
          </Link>

          <Link to="/instructor/notifications" style={navItem("/instructor/notifications")}>
            <span>Notifications</span>
            {unread > 0 && (
              <span
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "1px 7px",
                  minWidth: 20,
                  textAlign: "center",
                }}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>

          <Link to="/instructor/profile" style={navItem("/instructor/profile")}>
            Profile
          </Link>
        </nav>
      </div>

      <button type="button" style={styles.signOut} onClick={handleSignOut}>
        Sign Out
      </button>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "270px",
    minHeight: "100vh",
    background: "#FFFFFF",
    borderRight: "1px solid #E5E7EB",
    padding: "32px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },
  logo: {
    color: "#D4AF37",
    fontSize: "24px",
    fontWeight: 800,
    margin: 0,
    letterSpacing: "0.2px",
  },
  signOut: {
    border: "none",
    background: "transparent",
    color: "#EF4444",
    fontSize: "15px",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    padding: "10px 18px",
    borderRadius: "999px",
    width: "100%",
    transition: "background 0.15s",
  },
};
