import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">
          <span className="brand__name" style={{ fontSize: "1.05rem" }}>
            Panflute <em>Admin</em>
          </span>
        </div>
        <nav>
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? "is-active" : "")}>
            Albums
          </NavLink>
          <NavLink to="/" target="_blank">
            View site ↗
          </NavLink>
          <button onClick={logout}>Log out</button>
        </nav>
        {user && (
          <p style={{ fontSize: "0.78rem", color: "var(--ink-faint)", marginTop: "auto" }}>
            {user.email}
          </p>
        )}
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
