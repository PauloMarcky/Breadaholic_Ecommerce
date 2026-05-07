import "./SidebarAdmin.css";
import { useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";

const navItems = [
  { id: "products", path: "/product_manager", icon: "📦", label: "Product Management" },
  { id: "orders", path: "/order_manager", icon: "🧾", label: "Order Manager" },
  { id: "sales", path: "/admin/sales", icon: "📊", label: "Sales Reports" },
  { id: "users", path: "/admin/users", icon: "👥", label: "Users" },
];

export function SidebarAdmin({ setPage }) {
  const navigate = useNavigate();
  const currentAdminId = localStorage.getItem("currentAdminId");

  // --- Handlers ---
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // --- Effects ---
  useEffect(() => {
    if (!currentAdminId) {
      console.log("No admin logged in");
    }
  }, [currentAdminId]);

  return (
    <>
      <aside className="sb">
        {/* Header */}
        <div className="sb-header">
          <h1 className="sb-title">Breadaholic</h1>
          <p className="sb-subtitle">Admin Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="sb-nav">
          {navItems.map((n) => (
            <NavLink
              key={n.id}
              to={n.path}
              onClick={() => setPage && setPage(n.id)}
              className={({ isActive }) =>
                isActive ? "sb-nav-item sb-active" : "sb-nav-item"
              }
            >
              <span className="sb-nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        {/* Log Out */}
        <div className="sb-footer">
          <div className="sb-logout" onClick={handleLogout}>
            <span className="sb-nav-icon">🚪</span>
            Log Out
          </div>
        </div>

        {/* Credits */}
        <div className="sb-credits">
          IT ELECTIVE &amp; ADVANCE DATABASE SYSTEM
        </div>
      </aside>
    </>
  );
}