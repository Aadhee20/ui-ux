import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";

export default function RideDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [ride, setRide] = useState(null);

  useEffect(() => { api.ride(id).then(setRide).catch(() => nav("/requests")); }, [id]);
  if (!ride) return <p className="muted">Loading...</p>;

  async function accept() {
    try { await api.accept(ride.id); nav("/trip"); } catch (e) { alert(e.message); }
  }

  return (
    <>
      <h2>Ride Details</h2>
      <div className="card">
        <div className="section-title">Passenger</div>
        <div className="row between">
          <strong>{ride.rider}</strong>
          <span className="muted">★ {ride.rating}</span>
        </div>
      </div>

      <div className="card">
        <div className="section-title">Route</div>
        <div className="route-item"><span className="dot green" /> <div><div className="muted small">Pickup</div>{ride.pickup}</div></div>
        <div className="route-item"><span className="dot red" /> <div><div className="muted small">Drop</div>{ride.drop}</div></div>
      </div>

      <div className="card row between">
        <div><div className="muted small">Distance</div><strong>{ride.distanceKm} km</strong></div>
        <div><div className="muted small">Pickup ETA</div><strong>{ride.etaMin} min</strong></div>
        <div><div className="muted small">Fare</div><strong>₹{ride.fare}</strong></div>
      </div>

      <div className="row gap">
        <button className="btn outline" onClick={() => nav("/requests")}>Back</button>
        {ride.status === "requested" && <button className="btn primary" onClick={accept}>Accept Ride</button>}
      </div>
    </>
  );
}
