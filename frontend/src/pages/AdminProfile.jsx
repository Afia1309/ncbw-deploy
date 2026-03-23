import React, { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import api from "../api/apiClient";
import "./AdminProfile.css";

export default function AdminProfile() {
  const [adminProfile, setAdminProfile] = useState({
    displayName: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    memberId: "",
    created: "",
  });

  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    department: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  async function fetchAdminProfile() {
    try {
      setLoading(true);
      const response = await api.get("/auth/admin/profile/");
      const user = response.data.user;

      const formattedProfile = {
        displayName: user.name || "",
        email: user.email || "",
        role: formatRole(user.role),
        department: user.department || "",
        phone: user.phone || "",
        memberId: user.member_id || "",
        created: user.created
          ? new Date(user.created).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "",
      };

      setAdminProfile(formattedProfile);
      setEditForm({
        displayName: formattedProfile.displayName,
        email: formattedProfile.email,
        department: formattedProfile.department,
        phone: formattedProfile.phone,
      });
    } catch (err) {
      console.error("Failed to load admin profile:", err);
      alert("Unable to load admin profile.");
    } finally {
      setLoading(false);
    }
  }

  function formatRole(role) {
    if (!role) return "";
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  function openEditModal() {
    setEditForm({
      displayName: adminProfile.displayName,
      email: adminProfile.email,
      department: adminProfile.department,
      phone: adminProfile.phone,
    });
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

  async function handleSaveAccountInfo(e) {
    e.preventDefault();

    try {
      const response = await api.patch("/auth/admin/profile/", {
        name: editForm.displayName,
        email: editForm.email,
        department: editForm.department,
        phone: editForm.phone,
      });

      const user = response.data.user;

      setAdminProfile((prev) => ({
        ...prev,
        displayName: user.name || prev.displayName,
        email: user.email || prev.email,
        department: user.department || "",
        phone: user.phone || "",
        role: formatRole(user.role) || prev.role,
        memberId: user.member_id || prev.memberId,
        created: user.created
          ? new Date(user.created).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : prev.created,
      }));

      setShowEditModal(false);
      alert("Account information updated successfully.");
    } catch (err) {
      console.error(err);
      const data = err.response?.data;
      if (data?.email?.[0]) {
        alert(data.email[0]);
      } else {
        alert(data?.detail || "Failed to update account info.");
      }
    }
  }

  async function handleSavePassword(e) {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      alert("Please complete all password fields.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await api.post("/auth/admin/change-password/", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        confirm_password: passwordForm.confirmPassword,
      });

      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      alert(response.data?.message || "Password updated successfully.");
    } catch (err) {
      console.error(err);
      const data = err.response?.data;

      if (data?.current_password?.[0]) {
        alert(data.current_password[0]);
      } else if (data?.new_password?.[0]) {
        alert(data.new_password[0]);
      } else if (data?.detail) {
        alert(data.detail);
      } else {
        alert("Failed to update password.");
      }
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-profile-page">
          <p>Loading profile...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-profile-page">
        <div className="admin-profile-header">
          <div className="admin-profile-badge">
            {(adminProfile.displayName || "N").charAt(0).toUpperCase()}
          </div>

          <div>
            <h1>{adminProfile.displayName}</h1>
            <p>{adminProfile.email}</p>
            <span className="role-badge">{adminProfile.role}</span>
          </div>
        </div>

        <div className="admin-profile-grid">
          <section className="profile-panel">
            <h2>Account Information</h2>

            <div className="info-list">
              <div className="info-row">
                <span className="info-label">Email</span>
                <span className="info-value">{adminProfile.email}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Role</span>
                <span className="info-value">{adminProfile.role}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Department</span>
                <span className="info-value">{adminProfile.department || "—"}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Phone</span>
                <span className="info-value">{adminProfile.phone || "—"}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Member ID</span>
                <span className="info-value">{adminProfile.memberId || "—"}</span>
              </div>

              <div className="info-row">
                <span className="info-label">Created</span>
                <span className="info-value">{adminProfile.created || "—"}</span>
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
                Update the saved account details.
              </p>

              <form onSubmit={handleSaveAccountInfo} className="profile-form">
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={editForm.displayName}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
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
                Update the password for this admin account.
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