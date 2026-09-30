import express from "express";
import cors from "cors";
import { HttpError } from "./errors.js";
import { getAllTasks, getTaskById, getCompletedTasks } from "./tasks.js";
import { sampleTasks } from "./data.js";

export function createApp({
  tasks = structuredClone(sampleTasks),
  save = async () => {},
  frontendOrigin = "http://localhost:5173",
  logging = true,
} = {}) {
  const app = express();
  let nextId = Math.max(0, ...tasks.map((t) => t.id)) + 1;

  if (logging) {
    app.use((req, res, next) => {
      const start = Date.now();
      res.on("finish", () => {
        console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
      });
      next();
    });
  }
  app.use(cors({ origin: frontendOrigin }));
  app.use(express.json());

  function parseId(raw) {
    const id = Number(raw);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, "Task id must be a positive integer");
    return id;
  }

  function findIndexOrThrow(id) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new HttpError(404, "Task not found");
    return index;
  }

  function validateTitle(title) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new HttpError(400, "Title must be a non-empty string");
    }
    return title.trim();
  }

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/tasks", (req, res) => {
    const { completed } = req.query;
    if (completed === undefined) return res.json(getAllTasks(tasks));
    if (completed === "true") return res.json(getCompletedTasks(tasks));
    if (completed === "false") return res.json(getAllTasks(tasks).filter((t) => !t.completed));
    throw new HttpError(400, 'Query parameter "completed" must be "true" or "false"');
  });

  app.get("/api/tasks/:id", (req, res) => {
    const task = getTaskById(tasks, parseId(req.params.id));
    if (!task) throw new HttpError(404, "Task not found");
    res.json(task);
  });

  app.post("/api/tasks", async (req, res) => {
    const title = validateTitle(req.body?.title);
    const task = { id: nextId++, title, completed: false };
    tasks.push(task);
    await save(tasks);
    res.status(201).json(task);
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    const index = findIndexOrThrow(parseId(req.params.id));
    const body = req.body ?? {};
    const update = {};

    if ("title" in body) update.title = validateTitle(body.title);
    if ("completed" in body) {
      if (typeof body.completed !== "boolean") throw new HttpError(400, "completed must be a boolean");
      update.completed = body.completed;
    }
    if (Object.keys(update).length === 0) {
      throw new HttpError(400, 'Provide "title" and/or "completed"');
    }

    tasks[index] = { ...tasks[index], ...update };
    await save(tasks);
    res.json(tasks[index]);
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const index = findIndexOrThrow(parseId(req.params.id));
    tasks.splice(index, 1);
    await save(tasks);
    res.status(204).end();
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Request body must be valid JSON" });
    }
    if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: "Invalid request" });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

export const app = createApp({ logging: false });
