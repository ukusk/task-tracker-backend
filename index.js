import { sampleTasks } from "./src/data.js";

console.log(`Tere! Node.js versioon: ${process.version}`);
console.log("Ülesanded:");
for (const task of sampleTasks) {
  console.log(`  [${task.completed ? "x" : " "}] #${task.id} ${task.title}`);
}
