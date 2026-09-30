import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadTasks, saveTasks } from "../src/storage.js";

let dir;

beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "tasks-test-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("storage", () => {
  it("saves two tasks and loads the same tasks back (Topic 15)", async () => {
    const file = path.join(dir, "tasks.json");
    const tasks = [
      { id: 1, title: "One", completed: false },
      { id: 2, title: "Two", completed: true },
    ];
    await saveTasks(file, tasks);
    expect(await loadTasks(file)).toEqual(tasks);
  });

  it("missing file returns [] and is not created", async () => {
    const file = path.join(dir, "missing.json");
    expect(await loadTasks(file)).toEqual([]);
    await expect(readFile(file)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("invalid JSON gives a clear error and file is untouched", async () => {
    const file = path.join(dir, "bad.json");
    await writeFile(file, "{ not json");
    await expect(loadTasks(file)).rejects.toThrow(/invalid JSON/);
    expect(await readFile(file, "utf8")).toBe("{ not json");
  });

  it("valid JSON that is not an array gives a clear error", async () => {
    const file = path.join(dir, "obj.json");
    await writeFile(file, '{"id":1}');
    await expect(loadTasks(file)).rejects.toThrow(/JSON array/);
  });

  it("other errors are propagated (reading a directory -> EISDIR)", async () => {
    await expect(loadTasks(dir)).rejects.toMatchObject({ code: "EISDIR" });
  });

  it("concurrent saves do not corrupt the file", async () => {
    const file = path.join(dir, "tasks.json");
    await Promise.all([1, 2, 3, 4, 5].map((n) => saveTasks(file, [{ id: n, title: `T${n}`, completed: false }])));
    expect(await loadTasks(file)).toEqual([{ id: 5, title: "T5", completed: false }]);
  });
});
