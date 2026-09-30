import { createApp } from "./app.js";
import { config } from "./config.js";
import { loadTasks, saveTasks } from "./storage.js";

let tasks;
try {
  tasks = await loadTasks(config.tasksFile);
} catch (err) {
  console.error(`Could not load tasks: ${err.message}`);
  process.exit(1);
}

const app = createApp({
  tasks,
  save: (current) => saveTasks(config.tasksFile, current),
  frontendOrigin: config.frontendOrigin,
});

app.listen(config.port, () => {
  console.log(`Server: http://localhost:${config.port}`);
  console.log(`Tasks file: ${config.tasksFile}`);
});
