import React, { useMemo, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [instructors, setInstructors] = useState([
    {
      id: 1,
      name: "Kofi Mensah",
      email: "kofi@ncbw.org",
      courses: "3",
      status: "Active",
    },
    {
      id: 2,
      name: "Ama Boateng",
      email: "ama@ncbw.org",
      courses: "2",
      status: "Pending",
    },
    {
      id: 3,
      name: "Yaw Asante",
      email: "yaw@ncbw.org",
      courses: "1",
      status: "Active",
    },
  ]);

  const [members, setMembers] = useState([
    {
      id: 1,
      name: "Abena Owusu",
      email: "abena@email.com",
      position: "General Member",
      status: "Active",
    },
    {
      id: 2,
      name: "Kojo Mensimah",
      email: "kojo@email.com",
      position: "Secretary",
      status: "In Progress",
    },
    {
      id: 3,
      name: "Efua Nyarko",
      email: "efua@email.com",
      position: "Vice President",
      status: "Active",
    },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showInstructorsModal, setShowInstructorsModal] = useState(false);
  const [showTraineesModal, setShowTraineesModal] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState(null);

  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
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

  function handleInviteChange(e) {
    const { name, value } = e.target;
    setInviteForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSaveInvite(e) {
    e.preventDefault();

    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;

    const newInstructor = {
      id: Date.now(),
      name: inviteForm.name,
      email: inviteForm.email,
      courses: "0",
      status: "Pending",
    };

    setInstructors((prev) => [newInstructor, ...prev]);
    setShowInviteModal(false);
  }

  function handleDeleteInstructor(id) {
    const confirmed = window.confirm("Are you sure you want to delete this instructor?");
    if (!confirmed) return;

    setInstructors((prev) => prev.filter((instructor) => instructor.id !== id));
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

  function handleSaveTraineeEdit(e) {
    e.preventDefault();

    setMembers((prev) =>
      prev.map((member) =>
        member.id === editTraineeForm.id
          ? {
              ...member,
              position: editTraineeForm.position,
              status: editTraineeForm.status,
            }
          : member
      )
    );

    closeTraineeEditModal();
  }

  function handleDeleteTrainee(id) {
    const confirmed = window.confirm("Are you sure you want to delete this trainee?");
    if (!confirmed) return;

    setMembers((prev) => prev.filter((member) => member.id !== id));
  }

  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <div className="admin-cards">
          <div className="admin-card">
            <h3>Active Trainees</h3>
            <div className="card-number">128</div>
          </div>

          <div className="admin-card">
            <h3>Instructors</h3>
            <div className="card-number">{instructors.length}</div>
          </div>

          <div className="admin-card">
            <h3>Published Courses</h3>
            <div className="card-number">45</div>
          </div>

          <div className="admin-card warning">
            <h3>Pending Invites</h3>
            <div className="card-number">
              {instructors.filter((i) => i.status === "Pending").length}
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
                {instructors.map((instructor) => (
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
                ))}
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
                onClick={() => setShowTraineesModal(true)}
              >
                View Trainees
              </button>
              <button className="panel-btn secondary">Export</button>
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
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.position}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          member.status === "Active"
                            ? "status-active"
                            : "status-progress"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
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
                    <option value="Active">Active</option>
                    <option value="In Progress">In Progress</option>
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