import React, { useEffect, useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboard.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/auth";

export default function AdminDashboard() {
  const [instructors, setInstructors] = useState([]);
  const [members, setMembers] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState({
    active_trainees: 0,
    instructors_count: 0,
    published_courses_count: 0,
    pending_invites_count: 0,
  });
  const [loading, setLoading] = useState(true);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTraineeInviteModal, setShowTraineeInviteModal] = useState(false);
  const [showInstructorsModal, setShowInstructorsModal] = useState(false);
  const [showTraineesModal, setShowTraineesModal] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState(null);

  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
  });

  const [traineeInviteForm, setTraineeInviteForm] = useState({
    emails: "",
  });

  const [instructorSearch, setInstructorSearch] = useState("");
  const [traineeSearch, setTraineeSearch] = useState("");

  const [editTraineeForm, setEditTraineeForm] = useState({
    id: "",
    name: "",
    email: "",
    position: "",
    status: "",
  });

  function getAuthHeaders() {
    const token = localStorage.getItem("access");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async function fetchDashboardData() {
    try {
      setLoading(true);

      const [instructorsRes, traineesRes, summaryRes] = await Promise.all([
        fetch(`${API_BASE}/admin/instructors/`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE}/admin/trainees/`, {
          headers: getAuthHeaders(),
        }),
        fetch(`${API_BASE}/admin/dashboard-summary/`, {
          headers: getAuthHeaders(),
        }),
      ]);

      if (!instructorsRes.ok || !traineesRes.ok || !summaryRes.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      const instructorsData = await instructorsRes.json();
      const traineesData = await traineesRes.json();
      const summaryData = await summaryRes.json();

      setInstructors(instructorsData);
      setMembers(traineesData);
      setDashboardSummary(summaryData);
    } catch (error) {
      console.error(error);
      alert("Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredInstructors = useMemo(() => {
    const value = instructorSearch.toLowerCase();
    return instructors.filter(
      (instructor) =>
        instructor.name.toLowerCase().includes(value) ||
        instructor.email.toLowerCase().includes(value) ||
        instructor.status.toLowerCase().includes(value)
    );
  }, [instructors, instructorSearch]);

  const filteredTrainees = useMemo(() => {
    const value = traineeSearch.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(value) ||
        member.email.toLowerCase().includes(value) ||
        member.position.toLowerCase().includes(value) ||
        member.status.toLowerCase().includes(value)
    );
  }, [members, traineeSearch]);

  function openInviteModal() {
    setInviteForm({ name: "", email: "" });
    setShowInviteModal(true);
  }

  function closeInviteModal() {
    setShowInviteModal(false);
  }

  function openTraineeInviteModal() {
    setTraineeInviteForm({ emails: "" });
    setShowTraineeInviteModal(true);
  }

  function closeTraineeInviteModal() {
    setShowTraineeInviteModal(false);
  }

  function handleInviteChange(e) {
    const { name, value } = e.target;
    setInviteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleTraineeInviteChange(e) {
    const { name, value } = e.target;
    setTraineeInviteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSaveInvite(e) {
    e.preventDefault();

    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      alert("Please enter the instructor's name and email.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/instructors/invite/`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: inviteForm.name,
          email: inviteForm.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data?.email?.[0] ||
          data?.name?.[0] ||
          data?.detail ||
          "Failed to send instructor invite.";
        throw new Error(errorMessage);
      }

      setInstructors((prev) => [data.invite, ...prev]);
      setDashboardSummary((prev) => ({
        ...prev,
        instructors_count: prev.instructors_count + 1,
        pending_invites_count: prev.pending_invites_count + 1,
      }));
      setShowInviteModal(false);
      setInviteForm({ name: "", email: "" });

      if (!data.email_sent) {
        alert(
          "Instructor was created, but email was not sent yet because Postmark is not configured."
        );
      }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function handleSaveTraineeInvites(e) {
    e.preventDefault();

    const emailList = traineeInviteForm.emails
      .split("\n")
      .map((email) => email.trim())
      .filter(Boolean);

    if (emailList.length === 0) {
      alert("Please enter at least one trainee email address.");
      return;
    }

    const successes = [];
    const failures = [];

    for (const email of emailList) {
      try {
        const response = await fetch(`${API_BASE}/admin/trainees/invite/`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            email,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const message =
            data?.email?.[0] || data?.detail || "Failed to invite trainee.";
          failures.push(`${email}: ${message}`);
          continue;
        }

        successes.push(data.invite);
      } catch (error) {
        failures.push(`${email}: ${error.message}`);
      }
    }

    if (successes.length > 0) {
      setMembers((prev) => [...successes, ...prev]);
      setDashboardSummary((prev) => ({
        ...prev,
        pending_invites_count: prev.pending_invites_count + successes.length,
      }));
    }

    closeTraineeInviteModal();
    setTraineeInviteForm({ emails: "" });

    if (successes.length > 0 && failures.length === 0) {
      alert(`Successfully sent ${successes.length} trainee invite(s).`);
    } else if (successes.length > 0 && failures.length > 0) {
      alert(
        `Sent ${successes.length} trainee invite(s).\n\nSome failed:\n${failures.join(
          "\n"
        )}`
      );
    } else if (failures.length > 0) {
      alert(`No trainee invites were sent.\n\n${failures.join("\n")}`);
    }
  }

  async function handleDeleteInstructor(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this instructor?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/admin/instructors/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to delete instructor.");
      }

      const deletedInstructor = instructors.find((instructor) => instructor.id === id);

      setInstructors((prev) =>
        prev.filter((instructor) => instructor.id !== id)
      );

      setDashboardSummary((prev) => ({
        ...prev,
        instructors_count: Math.max(prev.instructors_count - 1, 0),
        pending_invites_count:
          deletedInstructor?.status === "Pending"
            ? Math.max(prev.pending_invites_count - 1, 0)
            : prev.pending_invites_count,
      }));
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  function openTraineeEditModal(member) {
    setEditingTrainee(member.id);
    setEditTraineeForm({
      id: member.id,
      name: member.name,
      email: member.email,
      position: member.position,
      status: member.status,
    });
  }

  function closeTraineeEditModal() {
    setEditingTrainee(null);
    setEditTraineeForm({
      id: "",
      name: "",
      email: "",
      position: "",
      status: "",
    });
  }

  function handleEditTraineeChange(e) {
    const { name, value } = e.target;
    setEditTraineeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSaveTraineeEdit(e) {
    e.preventDefault();

    try {
      const statusMap = {
        Active: "active",
        "In Progress": "in_progress",
        Inactive: "inactive",
        Pending: "pending",
      };

      const response = await fetch(
        `${API_BASE}/admin/trainees/${editTraineeForm.id}/`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            position: editTraineeForm.position,
            status: statusMap[editTraineeForm.status] || "active",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to update trainee.");
      }

      setMembers((prev) =>
        prev.map((member) =>
          member.id === editTraineeForm.id ? data.trainee : member
        )
      );

      closeTraineeEditModal();
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  async function handleDeleteTrainee(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this trainee?"
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/admin/trainees/${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to delete trainee.");
      }

      const deletedMember = members.find((member) => member.id === id);

      setMembers((prev) => prev.filter((member) => member.id !== id));

      setDashboardSummary((prev) => ({
        ...prev,
        active_trainees:
          deletedMember?.status === "Active"
            ? Math.max(prev.active_trainees - 1, 0)
            : prev.active_trainees,
        pending_invites_count:
          deletedMember?.status === "Pending"
            ? Math.max(prev.pending_invites_count - 1, 0)
            : prev.pending_invites_count,
      }));
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="admin-dashboard">
          <p>Loading dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="admin-cards">
          <div className="admin-card">
            <h3>Active Trainees</h3>
            <div className="card-number">{dashboardSummary.active_trainees}</div>
          </div>

          <div className="admin-card">
            <h3>Instructors</h3>
            <div className="card-number">{dashboardSummary.instructors_count}</div>
          </div>

          <div className="admin-card">
            <h3>Published Courses</h3>
            <div className="card-number">
              {dashboardSummary.published_courses_count}
            </div>
          </div>

          <div className="admin-card warning">
            <h3>Pending Invites</h3>
            <div className="card-number">
              {dashboardSummary.pending_invites_count}
            </div>
          </div>
        </div>

        <section className="admin-panel">
          <div className="panel-top">
            <div>
              <h2>Instructor Management</h2>
              <p>View instructors, positions, and invitation status.</p>
            </div>

            <div className="panel-actions">
              <button className="panel-btn primary" onClick={openInviteModal}>
                Send Invite
              </button>
              <button
                className="panel-btn secondary"
                onClick={() => setShowInstructorsModal(true)}
              >
                View All
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Courses</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {instructors.length > 0 ? (
                  instructors.map((instructor) => (
                    <tr key={instructor.id}>
                      <td>{instructor.name}</td>
                      <td>{instructor.email}</td>
                      <td>{instructor.courses}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            instructor.status === "Active"
                              ? "status-active"
                              : "status-pending"
                          }`}
                        >
                          {instructor.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No instructors yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel">
          <div className="panel-top">
            <div>
              <h2>Trainee Management</h2>
              <p>View trainees, positions, and overall training status.</p>
            </div>

            <div className="panel-actions">
              <button
                className="panel-btn primary"
                onClick={openTraineeInviteModal}
              >
                Send Invite
              </button>
              <button
                className="panel-btn secondary"
                onClick={() => setShowTraineesModal(true)}
              >
                View All
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {members.length > 0 ? (
                  members.map((member) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.position}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            member.status === "Active"
                              ? "status-active"
                              : member.status === "Pending"
                              ? "status-pending"
                              : "status-progress"
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No trainees yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {showInviteModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Send Instructor Invite</h2>
              <p className="modal-subtext">
                Enter the instructor’s name and email address.
              </p>

              <form onSubmit={handleSaveInvite} className="dashboard-form">
                <div className="form-group">
                  <label>Instructor Name</label>
                  <input
                    type="text"
                    name="name"
                    value={inviteForm.name}
                    onChange={handleInviteChange}
                    placeholder="Enter instructor name"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={inviteForm.email}
                    onChange={handleInviteChange}
                    placeholder="Enter instructor email"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closeInviteModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn primary">
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showTraineeInviteModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Invite Trainees</h2>
              <p className="modal-subtext">
                Enter one or more trainee email addresses, one per line.
              </p>

              <form
                onSubmit={handleSaveTraineeInvites}
                className="dashboard-form"
              >
                <div className="form-group">
                  <label>Email Addresses</label>
                  <textarea
                    name="emails"
                    value={traineeInviteForm.emails}
                    onChange={handleTraineeInviteChange}
                    placeholder={`example1@email.com\nexample2@email.com\nexample3@email.com`}
                    rows={7}
                    style={{
                      width: "100%",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      background: "#ffffff",
                      color: "#111827",
                      border: "1px solid #d1d5db",
                      resize: "vertical",
                    }}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closeTraineeInviteModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn primary">
                    Send Invites
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showInstructorsModal && (
          <div className="modal-overlay">
            <div className="modal-card modal-large">
              <div className="modal-header-row">
                <div>
                  <h2>All Instructors</h2>
                  <p className="modal-subtext">
                    Search, review, and manage instructors.
                  </p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowInstructorsModal(false)}
                >
                  Close
                </button>
              </div>

              <input
                type="text"
                className="modal-search"
                placeholder="Search instructors"
                value={instructorSearch}
                onChange={(e) => setInstructorSearch(e.target.value)}
              />

              <div className="modal-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Courses</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInstructors.map((instructor) => (
                      <tr key={instructor.id}>
                        <td>{instructor.name}</td>
                        <td>{instructor.email}</td>
                        <td>{instructor.courses}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              instructor.status === "Active"
                                ? "status-active"
                                : "status-pending"
                            }`}
                          >
                            {instructor.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="table-action-btn delete"
                            onClick={() => handleDeleteInstructor(instructor.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredInstructors.length === 0 && (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No instructors found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {showTraineesModal && (
          <div className="modal-overlay">
            <div className="modal-card modal-large">
              <div className="modal-header-row">
                <div>
                  <h2>All Trainees</h2>
                  <p className="modal-subtext">
                    Search, edit positions, and manage trainees.
                  </p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowTraineesModal(false)}
                >
                  Close
                </button>
              </div>

              <input
                type="text"
                className="modal-search"
                placeholder="Search trainees"
                value={traineeSearch}
                onChange={(e) => setTraineeSearch(e.target.value)}
              />

              <div className="modal-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Position</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainees.map((member) => (
                      <tr key={member.id}>
                        <td>{member.name}</td>
                        <td>{member.email}</td>
                        <td>{member.position}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              member.status === "Active"
                                ? "status-active"
                                : member.status === "Pending"
                                ? "status-pending"
                                : "status-progress"
                            }`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-action-group">
                            <button
                              className="table-action-btn edit"
                              onClick={() => openTraineeEditModal(member)}
                            >
                              Edit
                            </button>
                            <button
                              className="table-action-btn delete"
                              onClick={() => handleDeleteTrainee(member.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredTrainees.length === 0 && (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No trainees found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {editingTrainee && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h2>Edit Trainee</h2>
              <p className="modal-subtext">
                Update trainee position and status.
              </p>

              <form onSubmit={handleSaveTraineeEdit} className="dashboard-form">
                <div className="form-group">
                  <label>Name</label>
                  <input type="text" value={editTraineeForm.name} disabled />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input type="text" value={editTraineeForm.email} disabled />
                </div>

                <div className="form-group">
                  <label>Position</label>
                  <select
                    name="position"
                    value={editTraineeForm.position}
                    onChange={handleEditTraineeChange}
                  >
                    <option value="General Member">General Member</option>
                    <option value="President">President</option>
                    <option value="Vice President">Vice President</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="Chaplain">Chaplain</option>
                    <option value="Parliamentarian">Parliamentarian</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editTraineeForm.status}
                    onChange={handleEditTraineeChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn secondary"
                    onClick={closeTraineeEditModal}
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
      </div>
    </AdminLayout>
  );
}