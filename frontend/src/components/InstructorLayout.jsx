import InstructorSidebar from "./InstructorSidebar";
import InstructorBreadcrumbs from "./InstructorBreadcrumbs";

export default function InstructorLayout({ children, breadcrumbs = [] }) {
  return (
    <div style={styles.wrapper}>
      <InstructorSidebar />

      <div style={styles.mainArea}>
        <div style={styles.topBar}>
          <InstructorBreadcrumbs items={breadcrumbs} />
        </div>

        <main style={styles.content}>{children}</main>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#F9FAFB",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  topBar: {
    height: "52px",
    display: "flex",
    alignItems: "center",
    padding: "0 28px",
    borderBottom: "1px solid #E5E7EB",
    background: "#FFFFFF",
    boxSizing: "border-box",
  },
  content: {
    padding: "28px",
    boxSizing: "border-box",
  },
};