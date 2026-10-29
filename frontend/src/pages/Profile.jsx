import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Profile() {
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });

  useEffect(() => { api.profile().then((d) => { setP(d); setForm({ name: d.name, phone: d.phone }); }); }, []);
  if (!p) return <p className="muted">Loading...</p>;

  async function save() {
    const updated = await api.updateProfile(form);
    setP(updated);
    setEditing(false);
  }
  async function logout() {
    try { await api.logout(); } catch {}
    localStorage.removeItem("token");
    nav("/");
  }

  return (
    <>
      <div className="topbar"><h2>Profile</h2></div>

      <div className="card row between">
        <div className="row gap">
          <div className="avatar">{p.name[0]}</div>
          <div><strong>{p.name}</strong><div className="muted small">★ {p.rating} • {p.totalTrips} trips</div></div>
        </div>
        {editing
          ? <button className="btn primary" onClick={save}>Save</button>
          : <button className="btn outline" onClick={() => setEditing(true)}>Edit Profile</button>}
      </div>

      <div className="card">
        <div className="section-title">Personal Info</div>
        {editing ? (
          <>
            <label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </>
        ) : (
          <div className="row between">
            <div><div className="muted small">Phone</div>{p.phone}</div>
            <div><div className="muted small">Email</div>{p.email}</div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title">Vehicle</div>
        <div className="row between">
          <div><div className="muted small">Model</div>{p.vehicle.model}</div>
          <div><div className="muted small">Plate</div>{p.vehicle.plate}</div>
          <div><div className="muted small">Color</div>{p.vehicle.color}</div>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Documents</div>
        {p.documents.map((d) => (
          <div className="row between trip-row" key={d.name}>
            <span>{d.name}</span>
            <span className={d.status === "Verified" ? "ok" : "warn"}>{d.status}</span>
          </div>
        ))}
      </div>

      <button className="btn outline full" onClick={logout}>Logout</button>
    </>
  );
}
