import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import TripMap from "../components/TripMap.jsx";

const LABEL = {
  accepted: { status: "Heading to pickup", button: "I've Arrived" },
  arrived: { status: "Waiting for passenger", button: "Start Trip" },
  started: { status: "Trip in progress", button: "Complete Trip" },
};

export default function OnTrip() {
  const nav = useNavigate();
  const [trip, setTrip] = useState(undefined); // undefined = loading, null = none

  useEffect(() => { api.currentTrip().then(setTrip); }, []);
  if (trip === undefined) return <p className="muted">Loading...</p>;

  if (trip === null)
    return (
      <>
        <h2>On Trip</h2>
        <div className="card muted">No active trip. Accept a ride request to begin.</div>
        <button className="btn primary" onClick={() => nav("/requests")}>View Requests</button>
      </>
    );

  async function advance() {
    const updated = await api.advanceTrip();
    if (updated.status === "completed") { alert(`Trip complete! You earned ₹${updated.fare}`); nav("/earnings"); }
    else setTrip(updated);
  }

  const info = LABEL[trip.status];
  return (
    <>
      <h2>On Trip</h2>
      <div className="card status-banner">
        <span className="dot blue" /> <strong>{info.status}</strong>
      </div>
      <div className="card">
        <div className="row between"><strong>{trip.rider}</strong><strong>₹{trip.fare}</strong></div>
        <div className="route-item"><span className="dot green" /> {trip.pickup}</div>
        <div className="route-item"><span className="dot red" /> {trip.drop}</div>
      </div>
      <div className="card row between">
        <div><div className="muted small">Distance</div><strong>{trip.distanceKm} km</strong></div>
        <div><div className="muted small">ETA</div><strong>{trip.etaMin} min</strong></div>
        <div><div className="muted small">Fare</div><strong>₹{trip.fare}</strong></div>
      </div>
      <button className="btn primary full" onClick={advance}>{info.button}</button>
      <TripMap pickup={trip.pickup} drop={trip.drop} />
    </>
  );
}
