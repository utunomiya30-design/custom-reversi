import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const files = (await readdir("src"))
  .filter((name) => name.endsWith(".js"))
  .sort()
  .map((name) => join("src", name));

for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`syntax check passed (${files.length} files)`);
