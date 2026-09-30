try {
  process.loadEnvFile();
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

const port = Number(process.env.PORT || "3000");
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT: "${process.env.PORT}"`);
}

export const config = {
  port,
  tasksFile: process.env.TASKS_FILE || "./data/tasks.json",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
};
