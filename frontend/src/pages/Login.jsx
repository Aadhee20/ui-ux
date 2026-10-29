import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Login() {
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("driver@demo.com");
  const [password, setPassword] = useState("driver123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await api.login(identifier, password);
      localStorage.setItem("token", token);
      nav("/requests");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      <form className="login-card" onSubmit={submit}>
        <div className="avatar">D</div>
        <h2>Driver Login</h2>
        <p className="muted">Sign in to start accepting rides</p>

        <label>Email / Phone</label>
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter email or phone" />

        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" />

        {error && <div className="error">{error}</div>}
        <button className="btn primary full" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        <p className="muted small center">Forgot password?</p>
      </form>
    </div>
  );
}
