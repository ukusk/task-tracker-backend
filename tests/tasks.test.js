import { describe, it, expect } from "vitest";
import { getAllTasks, getTaskById, getCompletedTasks } from "../src/tasks.js";

const tasks = [
  { id: 1, title: "A", completed: true },
  { id: 2, title: "B", completed: false },
];

describe("task functions", () => {
  it("work with different arrays and empty arrays", () => {
    expect(getAllTasks(tasks)).toEqual(tasks);
    expect(getAllTasks([])).toEqual([]);
    expect(getCompletedTasks([])).toEqual([]);
    expect(getCompletedTasks(tasks)).toEqual([tasks[0]]);
  });

  it("return undefined for unknown id", () => {
    expect(getTaskById(tasks, 2)).toEqual(tasks[1]);
    expect(getTaskById(tasks, 99)).toBeUndefined();
    expect(getTaskById([], 1)).toBeUndefined();
  });

  it("do not mutate input", () => {
    const copy = structuredClone(tasks);
    getAllTasks(tasks)[0].title = "changed";
    getCompletedTasks(tasks);
    getTaskById(tasks, 1).completed = false;
    expect(tasks).toEqual(copy);
  });
});
