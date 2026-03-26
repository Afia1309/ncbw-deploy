import InstructorLayout from "../components/InstructorLayout";
import "./InstructorProfile.css";

const instructorProfile = {
  fullName: "Afua S Atiase",
  email: "atiasea2@mailbox.winthrop.edu",
  role: "Instructor",
  department: "Leadership Training",
  phone: "0244364582",
  memberId: "INST001",
  createdAt: "Mar 12, 2026",
};

export default function InstructorProfile() {
  const firstInitial = instructorProfile.fullName?.charAt(0)?.toUpperCase() || "I";

  return (
    <InstructorLayout
      breadcrumbs={[
        { label: "Profile", path: "/instructor/profile" },
      ]}
    >
      <div className="instructor-profile-page">
        <div className="profile-hero">
          <div className="profile-avatar">{firstInitial}</div>

          <div className="profile-hero-text">
            <h1>{instructorProfile.fullName}</h1>
            <p>{instructorProfile.email}</p>
            <span className="profile-role-pill">{instructorProfile.role}</span>
          </div>
        </div>

        <div className="profile-card">
          <h2>Account Information</h2>

          <div className="profile-info-list">
            <div className="profile-info-row">
              <span>Email</span>
              <strong>{instructorProfile.email}</strong>
            </div>

            <div className="profile-info-row">
              <span>Role</span>
              <strong>{instructorProfile.role}</strong>
            </div>

            <div className="profile-info-row">
              <span>Department</span>
              <strong>{instructorProfile.department}</strong>
            </div>

            <div className="profile-info-row">
              <span>Phone</span>
              <strong>{instructorProfile.phone}</strong>
            </div>

            <div className="profile-info-row">
              <span>Member ID</span>
              <strong>{instructorProfile.memberId}</strong>
            </div>

            <div className="profile-info-row">
              <span>Created</span>
              <strong>{instructorProfile.createdAt}</strong>
            </div>
          </div>
        </div>

        <div className="profile-card">
          <h2>Account Actions</h2>
          <p className="profile-card-helper">
            Manage this instructor account and profile settings.
          </p>

          <div className="profile-actions">
            <button className="primary-profile-btn">Edit Account Info</button>
            <button className="secondary-profile-btn">Change Password</button>
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
}