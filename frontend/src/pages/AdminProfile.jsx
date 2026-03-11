import React, { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminProfile.css";

export default function AdminProfile() {
  const [adminProfile, setAdminProfile] = useState({
    orgName: "NCBW Training Administration",
    email: "training@ncbw.org",
    role: "System Administrator",
    department: "Training & Development",
    phone: "(980) 555-0128",
    location: "Charlotte, NC",
    accountType: "Shared Organization Account",
    created: "Jan 12, 2026",
  });

  const overview = {
    coursesManaged: 6,
    instructors: 4,
    trainees: 128,
    pendingInvites: 3,
  };

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [editForm, setEditForm] = useState({ ...adminProfile });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function openEditModal() {
    setEditForm({ ...adminProfile });
    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
  }

  function openPasswordModal() {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswordModal(true);
  }

  function closePasswordModal() {
    setShowPasswordModal(false);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSaveAccountInfo(e) {
    e.preventDefault();
    setAdminProfile({ ...editForm });
    setShowEditModal(false);
  }

  function handleSavePassword(e) {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    setShowPasswordModal(false);
    alert("Password updated successfully.");
  }

  return (
    <AdminLayout>
      <div className="admin-profile-page">
        <div className="admin-profile-header">
          <div className="admin-profile-badge">N</div>

          <div>
            <h1>{adminProfile.orgName}</h1>
            <p>{adminProfile.email}</p>
            <span className="role-badge">{adminProfile.role}</span>
          </div>
        </div>

        <div className="admin-profile-grid">
          <section className="profile-panel">
            <h2>Account Information</h2>

            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Organization Email</span>
                <span className="info-value">{adminProfile.email}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Role</span>
                <span className="info-value">{adminProfile.role}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Department</span>
                <span className="info-value">{adminProfile.department}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Phone</span>
                <span className="info-value">{adminProfile.phone}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Location</span>
                <span className="info-value">{adminProfile.location}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Account Type</span>
                <span className="info-value">{adminProfile.accountType}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{adminProfile.created}</span>
              </div>
            </div>
          </section>

          <section className="profile-panel">
            <h2>Admin Overview</h2>

            <div className="overview-grid">
              <div className="overview-card">
                <span className="overview-number">{overview.coursesManaged}</span>
                <span className="overview-label">Courses Managed</span>
              </div>

              <div className="overview-card">
                <span className="overview-number">{overview.instructors}</span>
                <span className="overview-label">Active Instructors</span>
              </div>

              <div className="overview-card">
                <span className="overview-number">{overview.trainees}</span>
                <span className="overview-label">Trainees</span>
              </div>

              <div className="overview-card warning">
                <span className="overview-number">{overview.pendingInvites}</span>
                <span className="overview-label">Pending Invites</span>
              </div>
            </div>
          </section>
        </div>

        <section className="profile-panel">
          <h2>Account Actions</h2>
          <p className="panel-subtext">
            Manage this organization account and administrative access settings.
          </p>

          <div className="profile-actions">
            <button className="profile-btn primary" onClick={openEditModal}>
              Edit Account Info
            </button>
            <button className="profile-btn secondary" onClick={openPasswordModal}>
              Change Password
            </button>
          </div>
        </section>

        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Edit Account Info</h2>
              <p className="modal-subtext">
                Update the shared organization account details.
              </p>

              <form onSubmit={handleSaveAccountInfo} className="profile-form">
                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    name="orgName"
                    value={editForm.orgName}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Organization Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      name="department"
                      value={editForm.department}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editForm.location}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Account Type</label>
                    <input
                      type="text"
                      name="accountType"
                      value={editForm.accountType}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn primary">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Change Password</h2>
              <p className="modal-subtext">
                Update the password for this organization account.
              </p>

              <form onSubmit={handleSavePassword} className="profile-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closePasswordModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn primary">
                    Save Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}