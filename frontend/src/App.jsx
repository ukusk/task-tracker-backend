import { useEffect, useState } from "react";
import { getTasks, createTask } from "./services/taskApi.js";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const created = await createTask(title);
      setTasks((prev) => [...prev, created]);
      setTitle("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main>
      <h1>Task Tracker</h1>
      {error && <p role="alert" style={{ color: "crimson" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task" />
        <button type="submit">Add</button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {tasks.map((t) => (
            <li key={t.id}>
              <input type="checkbox" checked={t.completed} readOnly /> {t.title}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
