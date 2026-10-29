const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- in-memory "database" ----------
const db = {
  driver: {
    id: "d1",
    name: "Arun Kumar",
    email: "driver@demo.com",
    password: "driver123",
    phone: "+91 98765 43210",
    rating: 4.8,
    totalTrips: 1243,
    vehicle: { model: "Maruti Dzire", plate: "TN 09 AB 1234", color: "White" },
    documents: [
      { name: "Driving License", status: "Verified" },
      { name: "Vehicle RC", status: "Verified" },
      { name: "Insurance", status: "Expiring soon" },
    ],
  },
  rides: [
    { id: "r1", rider: "Priya S.", rating: 4.9, pickup: "T. Nagar Bus Terminus", drop: "Chennai Airport", distanceKm: 14.2, etaMin: 4, fare: 420, status: "requested" },
    { id: "r2", rider: "Rahul M.", rating: 4.6, pickup: "Anna Nagar West", drop: "Marina Beach", distanceKm: 11.5, etaMin: 7, fare: 310, status: "requested" },
    { id: "r3", rider: "Sneha K.", rating: 4.7, pickup: "Velachery MRTS", drop: "OMR Tidel Park", distanceKm: 8.1, etaMin: 3, fare: 230, status: "requested" },
  ],
  currentTripId: null,
  earnings: {
    today: 1260,
    tripsToday: 9,
    onlineHours: 6.5,
    week: [
      { day: "Mon", amount: 980 }, { day: "Tue", amount: 1120 }, { day: "Wed", amount: 760 },
      { day: "Thu", amount: 1340 }, { day: "Fri", amount: 1500 }, { day: "Sat", amount: 1710 },
      { day: "Sun", amount: 1260 },
    ],
    recent: [
      { id: "t1", route: "Adyar → Guindy", amount: 180, time: "10:15 AM" },
      { id: "t2", route: "Mylapore → T. Nagar", amount: 140, time: "11:40 AM" },
      { id: "t3", route: "Egmore → Central", amount: 95, time: "01:05 PM" },
    ],
  },
};
// ---------- trip history (used for statements) ----------
const ymd = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD
const seedPlaces = ["Adyar", "Guindy", "T. Nagar", "Velachery", "Anna Nagar", "Egmore", "Mylapore", "Porur", "Tambaram", "OMR"];
db.trips = [];
for (let i = 29; i >= 0; i--) {
  const day = new Date();
  day.setDate(day.getDate() - i);
  const count = 3 + Math.floor(Math.random() * 6);
  for (let j = 0; j < count; j++) {
    const km = +(2 + Math.random() * 16).toFixed(1);
    const a = seedPlaces[Math.floor(Math.random() * seedPlaces.length)];
    let b = seedPlaces[Math.floor(Math.random() * seedPlaces.length)];
    if (b === a) b = "Central";
    db.trips.push({
      id: `h${i}-${j}`,
      date: ymd(day),
      time: `${String(7 + j * 2).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
      pickup: a, drop: b, distanceKm: km, fare: Math.round(50 + km * 18),
    });
  }
}
// ---------- auth ----------
const sessions = new Map(); // token -> driverId
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
  next();
}
const publicDriver = ({ password, ...rest }) => rest;

app.post("/api/auth/login", (req, res) => {
  const { identifier, password } = req.body || {};
  const d = db.driver;
  if ((identifier === d.email || identifier === d.phone) && password === d.password) {
    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, d.id);
    return res.json({ token, driver: publicDriver(d) });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/auth/logout", auth, (req, res) => {
  sessions.delete((req.headers.authorization || "").replace("Bearer ", ""));
  res.json({ ok: true });
});

// ---------- rides ----------
app.get("/api/rides/requests", auth, (req, res) =>
  res.json(db.rides.filter((r) => r.status === "requested"))
);

app.get("/api/rides/:id", auth, (req, res) => {
  const ride = db.rides.find((r) => r.id === req.params.id);
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  res.json(ride);
});

app.post("/api/rides/:id/accept", auth, (req, res) => {
  const ride = db.rides.find((r) => r.id === req.params.id);
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  if (db.currentTripId) return res.status(409).json({ error: "Finish current trip first" });
  ride.status = "accepted";
  db.currentTripId = ride.id;
  res.json(ride);
});

app.post("/api/rides/:id/decline", auth, (req, res) => {
  const ride = db.rides.find((r) => r.id === req.params.id);
  if (!ride) return res.status(404).json({ error: "Ride not found" });
  ride.status = "declined";
  res.json({ ok: true });
});

// ---------- current trip ----------
// status flow: accepted -> arrived -> started -> completed
const NEXT = { accepted: "arrived", arrived: "started", started: "completed" };

app.get("/api/trip/current", auth, (req, res) => {
  const ride = db.rides.find((r) => r.id === db.currentTripId);
  res.json(ride || null);
});

app.post("/api/trip/advance", auth, (req, res) => {
  const ride = db.rides.find((r) => r.id === db.currentTripId);
  if (!ride) return res.status(404).json({ error: "No active trip" });
  ride.status = NEXT[ride.status];
  if (ride.status === "completed") {
    db.currentTripId = null;
    db.earnings.today += ride.fare;
    db.earnings.tripsToday += 1;
    db.earnings.week[6].amount += ride.fare;
    db.trips.push({
      id: ride.id, date: ymd(new Date()),
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      pickup: ride.pickup, drop: ride.drop, distanceKm: ride.distanceKm, fare: ride.fare,
    });
    db.earnings.recent.unshift({
      id: ride.id, route: `${ride.pickup} → ${ride.drop}`, amount: ride.fare,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    });
  }
  res.json(ride);
});

// ---------- earnings & profile ----------
app.get("/api/earnings", auth, (req, res) => res.json(db.earnings));
app.get("/api/earnings/statement", auth, (req, res) => {
  const { start, end } = req.query;
  const valid = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");
  if (!valid(start) || !valid(end)) return res.status(400).json({ error: "Provide start and end dates" });
  if (start > end) return res.status(400).json({ error: "Start date must be before end date" });

  const trips = db.trips
    .filter((t) => t.date >= start && t.date <= end)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  res.json({
    driver: { name: db.driver.name, phone: db.driver.phone, plate: db.driver.vehicle.plate },
    start, end, trips,
    totalTrips: trips.length,
    totalDistanceKm: +trips.reduce((s, t) => s + t.distanceKm, 0).toFixed(1),
    totalEarnings: trips.reduce((s, t) => s + t.fare, 0),
  });
});
app.get("/api/profile", auth, (req, res) => res.json(publicDriver(db.driver)));
app.put("/api/profile", auth, (req, res) => {
  const { name, phone } = req.body || {};
  if (name) db.driver.name = name;
  if (phone) db.driver.phone = phone;
  res.json(publicDriver(db.driver));
});
// ---- demo: generate a new ride request ----
const riders = ["Karthik R.", "Divya P.", "Mohan L.", "Anitha V.", "Vikram S."];
const places = ["Adyar Signal", "Guindy Station", "Nungambakkam", "Besant Nagar", "Porur Junction", "Tambaram", "Egmore Station", "Mylapore Tank"];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function createRide() {
  let pickup = pick(places), drop = pick(places);
  while (drop === pickup) drop = pick(places);
  const distanceKm = +(3 + Math.random() * 15).toFixed(1);
  const ride = {
    id: "r" + Date.now(),
    rider: pick(riders),
    rating: +(4 + Math.random()).toFixed(1),
    pickup, drop, distanceKm,
    etaMin: 2 + Math.floor(Math.random() * 8),
    fare: Math.round(50 + distanceKm * 18),
    status: "requested",
  };
  db.rides.push(ride);
  return ride;
}

app.post("/api/rides/simulate", auth, (req, res) => res.json(createRide()));

// auto-create a request every 20s while fewer than 5 are waiting
setInterval(() => {
  if (db.rides.filter((r) => r.status === "requested").length < 5) createRide();
}, 20000);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
