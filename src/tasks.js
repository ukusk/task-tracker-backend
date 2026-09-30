export function getAllTasks(tasks) {
  return tasks.map((task) => ({ ...task }));
}

export function getTaskById(tasks, id) {
  const task = tasks.find((t) => t.id === id);
  return task ? { ...task } : undefined;
}

export function getCompletedTasks(tasks) {
  return tasks.filter((t) => t.completed === true).map((t) => ({ ...t }));
}
