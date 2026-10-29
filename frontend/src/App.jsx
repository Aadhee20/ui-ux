import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import RideRequests from "./pages/RideRequests.jsx";
import RideDetails from "./pages/RideDetails.jsx";
import OnTrip from "./pages/OnTrip.jsx";
import Earnings from "./pages/Earnings.jsx";
import Profile from "./pages/Profile.jsx";

function Protected({ children }) {
  return localStorage.getItem("token") ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/requests" element={<Protected><RideRequests /></Protected>} />
      <Route path="/rides/:id" element={<Protected><RideDetails /></Protected>} />
      <Route path="/trip" element={<Protected><OnTrip /></Protected>} />
      <Route path="/earnings" element={<Protected><Earnings /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
