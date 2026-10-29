const getToken = () => localStorage.getItem("token");

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("Cannot reach server. Is the backend running on port 4000?");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
    throw new Error(data.error || `Server error (${res.status}). Check the backend terminal.`);
  }
  return data;
}

export const api = {
  login: (identifier, password) => request("/auth/login", { method: "POST", body: { identifier, password } }),
  logout: () => request("/auth/logout", { method: "POST" }),
  requests: () => request("/rides/requests"),
  ride: (id) => request(`/rides/${id}`),
  accept: (id) => request(`/rides/${id}/accept`, { method: "POST" }),
  decline: (id) => request(`/rides/${id}/decline`, { method: "POST" }),
  simulate: () => request("/rides/simulate", { method: "POST" }),
  currentTrip: () => request("/trip/current"),
  advanceTrip: () => request("/trip/advance", { method: "POST" }),
  earnings: () => request("/earnings"),
  profile: () => request("/profile"),
  updateProfile: (body) => request("/profile", { method: "PUT", body }),
  statement: (start, end) => request(`/earnings/statement?start=${start}&end=${end}`),
};