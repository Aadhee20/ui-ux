import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../api.js";

const today = () => new Date().toLocaleDateString("en-CA");
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA");
};

const csvCell = (v) => `"${String(v).replace(/"/g, '""')}"`;

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(s) {
  const rows = [
    ["Earnings Statement"],
    ["Driver", s.driver.name],
    ["Phone", s.driver.phone],
    ["Vehicle", s.driver.plate],
    ["Period", `${s.start} to ${s.end}`],
    [],
    ["Date", "Time", "Pickup", "Drop", "Distance (km)", "Fare (INR)"],
    ...s.trips.map((t) => [t.date, t.time, t.pickup, t.drop, t.distanceKm, t.fare]),
    [],
    ["Total trips", s.totalTrips],
    ["Total distance (km)", s.totalDistanceKm],
    ["Total earnings (INR)", s.totalEarnings],
  ];
  const csv = "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\n");
  saveBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `earnings-statement_${s.start}_to_${s.end}.csv`);
}

function downloadPdf(s) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setTextColor(11, 95, 255);
  doc.text("Earnings Statement", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Driver: ${s.driver.name}`, 14, 30);
  doc.text(`Phone: ${s.driver.phone}`, 14, 36);
  doc.text(`Vehicle: ${s.driver.plate}`, 14, 42);
  doc.text(`Period: ${s.start} to ${s.end}`, pageWidth - 14, 30, { align: "right" });
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, pageWidth - 14, 36, { align: "right" });

  autoTable(doc, {
    startY: 50,
    head: [["Date", "Time", "Pickup", "Drop", "Distance (km)", "Fare (Rs.)"]],
    body: s.trips.map((t) => [t.date, t.time, t.pickup, t.drop, t.distanceKm, t.fare]),
    headStyles: { fillColor: [11, 95, 255] },
    styles: { fontSize: 9 },
    columnStyles: { 4: { halign: "right" }, 5: { halign: "right" } },
  });

  let y = doc.lastAutoTable.finalY + 12;
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(`Total trips: ${s.totalTrips}`, 14, y);
  doc.text(`Total distance: ${s.totalDistanceKm} km`, 14, y + 7);
  doc.setFontSize(13);
  doc.text(`Total earnings: Rs. ${s.totalEarnings.toLocaleString("en-IN")}`, 14, y + 16);

  doc.save(`earnings-statement_${s.start}_to_${s.end}.pdf`);
}

export default function Earnings() {
  const [data, setData] = useState(null);
  const [start, setStart] = useState(daysAgo(7));
  const [end, setEnd] = useState(today());
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.earnings().then(setData); }, []);

  // format: "preview" | "csv" | "pdf"
  async function getStatement(format) {
    setError("");
    setBusy(true);
    try {
      const s = await api.statement(start, end);
      setPreview(s);
      if (format !== "preview") {
        if (s.trips.length === 0) setError("No trips found in this date range.");
        else if (format === "csv") downloadCsv(s);
        else downloadPdf(s);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="muted">Loading...</p>;

  const max = Math.max(...data.week.map((d) => d.amount));
  const weekTotal = data.week.reduce((s, d) => s + d.amount, 0);

  return (
    <>
      <div className="topbar"><h2>Earnings</h2><span className="pill on">This Week</span></div>

      <div className="card">
        <div className="muted small">Today</div>
        <div className="big">₹{data.today.toLocaleString("en-IN")}</div>
        <div className="row gap muted small">
          <span>{data.tripsToday} trips</span><span>{data.onlineHours} hrs online</span>
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <strong>Weekly Overview</strong>
          <span className="muted small">Total ₹{weekTotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="chart">
          {data.week.map((d, i) => (
            <div className="bar-col" key={d.day}>
              <div className={`bar ${i === data.week.length - 1 ? "today" : ""}`} style={{ height: `${(d.amount / max) * 100}%` }} title={`₹${d.amount}`} />
              <span className="muted small">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <strong>Download Statement</strong>
        <div className="date-row">
          <div>
            <label>Start date</label>
            <input type="date" value={start} max={end} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label>End date</label>
            <input type="date" value={end} min={start} max={today()} onChange={(e) => setEnd(e.target.value)} />
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {preview && (
          <div className="row between trip-row">
            <span>{preview.totalTrips} trips • {preview.totalDistanceKm} km</span>
            <strong>₹{preview.totalEarnings.toLocaleString("en-IN")}</strong>
          </div>
        )}

        <div className="row gap" style={{ marginTop: 14, flexWrap: "wrap" }}>
          <button className="btn outline" disabled={busy} onClick={() => getStatement("preview")}>Preview</button>
          <button className="btn primary" disabled={busy} onClick={() => getStatement("pdf")}>
            {busy ? "Please wait..." : "Download PDF"}
          </button>
          <button className="btn primary" disabled={busy} onClick={() => getStatement("csv")}>
            {busy ? "Please wait..." : "Download CSV"}
          </button>
        </div>
      </div>

      <div className="card">
        <strong>Recent Trips</strong>
        {data.recent.map((t) => (
          <div className="row between trip-row" key={t.id + t.time}>
            <div><div>{t.route}</div><div className="muted small">{t.time}</div></div>
            <strong>₹{t.amount}</strong>
          </div>
        ))}
      </div>
    </>
  );
}