import React, { useState } from 'react';
import './UserManagerBody.css';

const PageHeader = ({ title }) => <div className="um-page-header"><h1>{title}</h1></div>;
const StatCard = ({ label, value, sub, color }) => (
  <div className="um-stat-card"><p className="um-stat-label">{label}</p><p className="um-stat-value" style={{ color: color || 'var(--brown)' }}>{value}</p><span className="um-stat-sub">{sub}</span></div>
);
const Badge = ({ status }) => <span className={`um-badge um-badge-${status}`}>{status}</span>;
const RoleBadge = ({ role }) => <span className={`um-role-badge um-role-${role.toLowerCase()}`}>{role}</span>;

const usersData = [
  { id: "001", username: "Juan Dela Cruz", pending: 2, barangay: "Centro East", status: "Active", role: "Admin" },
  { id: "002", username: "Marcky Balaba", pending: 1, barangay: "Batal", status: "Active", role: "User" },
  { id: "003", username: "Escanor Noil Nis", pending: 0, barangay: "Dubinan East", status: "Active", role: "User" },
  { id: "004", username: "Gojo Satoru", pending: 0, barangay: "Centro West", status: "Active", role: "Admin" },
  { id: "005", username: "Lelouch vi Britannia", pending: 0, barangay: "Patul", status: "Inactive", role: "User" },
  { id: "006", username: "Reehzie Calinawan", pending: 0, barangay: "Rosario", status: "Active", role: "User" },
  { id: "007", username: "Andrie Abon", pending: 3, barangay: "Malvar", status: "Active", role: "User" },
];

function UserManagerBody() {
  const [filter, setFilter] = useState("All");
  const [users, setUsers] = useState(usersData);

  const filtered = filter === "All" ? users : users.filter(u => u.status === filter);
  const active = users.filter(u => u.status === "Active").length;
  const admins = users.filter(u => u.role === "Admin").length;

  const handleRoleChange = (id, newRole) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="User Dashboard" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Customers" value={users.length} sub="Registered users" />
        <StatCard label="Online Users" value={active} sub="Active now" color="var(--amber)" />
        <StatCard label="Admins" value={admins} sub="With access" color="#8B5010" />
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <h3>Customer List</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="um-select">
            <option>All</option><option>Active</option><option>Inactive</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Pending Orders</th>
              <th>Barangay</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--muted)" }}>{u.id}</td>
                <td>
                  <div className="um-user-row">
                    <span style={{ fontWeight: 600 }}>{u.username}</span>
                  </div>
                </td>
                <td>
                  {u.pending > 0
                    ? <span className="um-pending-badge">{u.pending} pending</span>
                    : <span style={{ color: "var(--muted)", fontSize: 13 }}>—</span>}
                </td>
                <td style={{ color: "var(--muted)" }}>{u.barangay}</td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className="um-role-select"
                  >
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </td>
                <td><Badge status={u.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagerBody;