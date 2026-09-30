const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("Server is not reachable");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Request failed (${res.status})`);
  return data;
}

export const getTasks = () => request("/api/tasks");

export const createTask = (title) =>
  request("/api/tasks", { method: "POST", body: JSON.stringify({ title }) });

export const updateTask = (id, changes) =>
  request(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(changes) });

export const deleteTask = (id) => request(`/api/tasks/${id}`, { method: "DELETE" });
