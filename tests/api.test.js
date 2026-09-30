import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

let app;

beforeEach(() => {
  app = createApp({
    tasks: [
      { id: 1, title: "Learn Node.js basics", completed: true },
      { id: 2, title: "Practise React state", completed: false },
    ],
    logging: false,
  });
});

describe("Task API", () => {
  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("GET /api/tasks returns tasks", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it("GET /api/tasks/:id returns one task", async () => {
    const res = await request(app).get("/api/tasks/2");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 2, title: "Practise React state", completed: false });
  });

  it("filters by completed and rejects invalid value", async () => {
    expect((await request(app).get("/api/tasks?completed=true")).body.map((t) => t.id)).toEqual([1]);
    expect((await request(app).get("/api/tasks?completed=false")).body.map((t) => t.id)).toEqual([2]);
    expect((await request(app).get("/api/tasks?completed=yes")).status).toBe(400);
  });

  it("POST creates a valid task", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "  Learn Express  " });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 3, title: "Learn Express", completed: false });
    expect((await request(app).get("/api/tasks")).body).toHaveLength(3);
  });

  it("POST rejects an empty title", async () => {
    for (const body of [{}, { title: "" }, { title: "   " }, { title: 42 }]) {
      const res = await request(app).post("/api/tasks").send(body);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
    }
  });

  it("unknown task returns 404", async () => {
    const res = await request(app).get("/api/tasks/999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Task not found" });
  });

  it("PATCH updates and validates", async () => {
    const ok = await request(app).patch("/api/tasks/2").send({ completed: true });
    expect(ok.status).toBe(200);
    expect(ok.body.completed).toBe(true);
    expect((await request(app).patch("/api/tasks/2").send({ completed: "true" })).status).toBe(400);
    expect((await request(app).patch("/api/tasks/2").send({})).status).toBe(400);
    expect((await request(app).patch("/api/tasks/999").send({ title: "x" })).status).toBe(404);
  });

  it("DELETE removes a task", async () => {
    const res = await request(app).delete("/api/tasks/1");
    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect((await request(app).get("/api/tasks/1")).status).toBe(404);
    expect((await request(app).get("/api/tasks")).body.map((t) => t.id)).toEqual([2]);
  });

  it("unknown route returns JSON 404", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Route not found" });
  });

  it("unexpected error returns generic 500 without stack trace", async () => {
    const broken = createApp({
      logging: false,
      save: async () => { throw new Error("disk exploded"); },
    });
    const orig = console.error; console.error = () => {};
    const res = await request(broken).post("/api/tasks").send({ title: "x" });
    console.error = orig;
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(res.text).not.toContain("disk exploded");
  });
});
