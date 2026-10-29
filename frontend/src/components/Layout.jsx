import { NavLink } from "react-router-dom";

const links = [
  { to: "/requests", label: "Ride Requests" },
  { to: "/trip", label: "On Trip" },
  { to: "/earnings", label: "Earnings" },
  { to: "/profile", label: "Profile" },
];

export default function Layout({ children }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">DriveApp</div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? "nav active" : "nav")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
