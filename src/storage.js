import { readFile, writeFile, rename, mkdir } from "node:fs/promises";
import path from "node:path";

export async function loadTasks(filePath) {
  let text;
  try {
    text = await readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new Error(`Tasks file "${filePath}" contains invalid JSON: ${err.message}`);
  }

  if (!Array.isArray(data)) {
    throw new Error(`Tasks file "${filePath}" must contain a JSON array`);
  }
  return data;
}

let writeQueue = Promise.resolve();

export function saveTasks(filePath, tasks) {
  const job = writeQueue.then(async () => {
    await mkdir(path.dirname(filePath), { recursive: true });
    const tmp = `${filePath}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(tasks, null, 2) + "\n", "utf8");
    await rename(tmp, filePath);
  });
  writeQueue = job.catch(() => {});
  return job;
}
