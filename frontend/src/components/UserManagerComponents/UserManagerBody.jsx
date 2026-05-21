import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserManagerBody.css';

const API_BASE = 'http://10.137.201.159:5000';

const PageHeader = ({ title }) => <div className="um-page-header"><h1>{title}</h1></div>;

const StatCard = ({ label, value, sub, color }) => (
  <div className="um-stat-card">
    <p className="um-stat-label">{label}</p>
    <p className="um-stat-value" style={{ color: color || 'var(--brown)' }}>{value}</p>
    <span className="um-stat-sub">{sub}</span>
  </div>
);

export default function UserManagerBody() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // ✅ Removed: currentUserId & socket logic

  useEffect(() => {
    fetchUsers();
    // ✅ Removed: socket emit & listener cleanup
  }, []); // ✅ Removed dependency: [currentUserId]

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin/getUsers`);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await axios.put(`${API_BASE}/admin/updateUserRole`, {
        user_id: Number(userId),
        role: newRole
      });
      setUsers(prev => prev.map(u =>
        String(u.user_id) === String(userId) ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      console.error("Role update failed:", err);
      alert("Failed to update role. Check console.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === "All"
    ? users
    : users.filter(u => {
      const userRole = (u.role || 'User').trim().toLowerCase();
      const filterRole = filter.trim().toLowerCase();
      return userRole === filterRole;
    });

  const adminCount = users.filter(u => (u.role || 'User').trim().toLowerCase() === 'admin').length;
  const userCount = users.filter(u => (u.role || 'User').trim().toLowerCase() === 'user').length;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading users...</div>;

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="User Dashboard" />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Users" value={users.length} sub="Registered accounts" />
        <StatCard label="Admins" value={adminCount} sub="With full access" color="#8B5010" />
        <StatCard label="Customers" value={userCount} sub="Regular users" color="var(--amber)" />
      </div>

      <div className="table-wrapper">
        <div className="table-header">
          <h3>User List</h3>
          <select value={filter} onChange={e => setFilter(e.target.value)} className="um-select">
            <option value="All">All Roles</option>
            <option value="User">Customers</option>
            <option value="Admin">Admins</option>
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
              {/* ✅ REMOVED: Status column header */}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)' }}>
                  {/* ✅ Updated colSpan from 6 → 5 */}
                  No users found{filter !== "All" ? ` with role "${filter}"` : ''}
                </td>
              </tr>
            ) : (
              filtered.map(u => {
                const userRole = (u.role || 'User').trim();
                return (
                  <tr key={u.user_id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--muted)" }}>
                      #{String(u.user_id).padStart(3, '0')}
                    </td>
                    <td>
                      <div className="um-user-row">
                        <span style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td>
                      {u.pending_orders > 0
                        ? <span className="um-pending-badge">{u.pending_orders} pending</span>
                        : <span style={{ color: "var(--muted)", fontSize: 13 }}>—</span>
                      }
                    </td>
                    <td style={{ color: "var(--muted)" }}>{u.barangay || 'N/A'}</td>
                    <td>
                      <select
                        value={userRole}
                        onChange={(e) => handleRoleChange(u.user_id, e.target.value)}
                        className="um-role-select"
                        disabled={updatingId === u.user_id}
                      >
                        <option value="Admin">Admin</option>
                        <option value="User">User</option>
                      </select>
                    </td>
                    {/* ✅ REMOVED: StatusBadge cell */}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}