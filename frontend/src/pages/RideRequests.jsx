import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function RideRequests() {
  const nav = useNavigate();
  const [rides, setRides] = useState([]);
  const [online, setOnline] = useState(true);

  const load = () => api.requests().then(setRides).catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // check for new requests every 5 seconds
    return () => clearInterval(t);
  }, []);

  async function accept(id) {
    try { await api.accept(id); nav("/trip"); } catch (e) { alert(e.message); }
  }
  async function decline(id) {
    await api.decline(id);
    load();
  }
  async function newRequest() {
    await api.simulate();
    load();
  }

  return (
    <>
      <div className="topbar">
        <h2>Ride Requests</h2>
        <div className="row gap">
          <button className="btn outline" onClick={newRequest}>+ New Request</button>
          <button className={`pill ${online ? "on" : "off"}`} onClick={() => setOnline(!online)}>
            {online ? "● Online" : "○ Offline"}
          </button>
        </div>
      </div>

      {!online && <div className="card muted">You are offline. Go online to receive requests.</div>}
      {online && rides.length === 0 && <div className="card muted">No new requests right now.</div>}

      {online && rides.map((r) => (
        <div className="card ride" key={r.id}>
          <div className="ride-main" onClick={() => nav(`/rides/${r.id}`)}>
            <div className="row between">
              <strong>{r.rider} <span className="muted small">★ {r.rating}</span></strong>
              <strong>₹{r.fare}</strong>
            </div>
            <div className="muted small">📍 {r.pickup}</div>
            <div className="muted small">🏁 {r.drop}</div>
            <div className="muted small">{r.distanceKm} km • pickup in {r.etaMin} min</div>
          </div>
          <div className="row gap">
            <button className="btn outline" onClick={() => decline(r.id)}>Decline</button>
            <button className="btn primary" onClick={() => accept(r.id)}>Accept</button>
          </div>
        </div>
      ))}
    </>
  );
}