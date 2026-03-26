import { Link, useLocation } from "react-router-dom";

export default function InstructorSidebar() {
  const location = useLocation();

  const navItemStyle = (path) => ({
    display: "block",
    padding: "16px 18px",
    borderRadius: "999px",
    textDecoration: "none",
    color: "#18324B",
    fontWeight: 600,
    fontSize: "18px",
    background: location.pathname.startsWith(path) ? "#EEE7D3" : "transparent",
    marginBottom: "12px",
  });

  return (
    <aside style={styles.sidebar}>
      <div>
        <h1 style={styles.logo}>NCBW</h1>

        <nav style={{ marginTop: "40px" }}>
          <Link to="/instructor/courses" style={navItemStyle("/instructor/courses")}>
            My Courses
          </Link>

          <Link to="/instructor/profile" style={navItemStyle("/instructor/profile")}>
            Profile
          </Link>
        </nav>
      </div>

      <button style={styles.signOut}>Sign Out</button>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "290px",
    minHeight: "100vh",
    background: "#FFFFFF",
    borderRight: "1px solid #E5E7EB",
    padding: "36px 24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },
  logo: {
    color: "#C9A227",
    fontSize: "30px",
    fontWeight: 800,
    margin: 0,
    letterSpacing: "0.5px",
  },
  signOut: {
    border: "none",
    background: "transparent",
    color: "#EF4444",
    fontSize: "18px",
    textAlign: "left",
    cursor: "pointer",
    padding: "0 18px",
  },
};