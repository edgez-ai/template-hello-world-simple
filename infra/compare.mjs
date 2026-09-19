import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  config,
  configPath,
  configureClient,
  run,
} from "./appwrite.mjs";

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !["projectId", "endpoint"].includes(key))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, normalize(child)]),
    );
  }
  return value;
}

configureClient();
const temp = mkdtempSync(path.join(os.tmpdir(), "edgez-appwrite-compare-"));
try {
  cpSync(configPath, path.join(temp, "appwrite.config.json"));
  run(["pull", "all", "--all", "--force"], { cwd: temp });
  const remote = JSON.parse(readFileSync(path.join(temp, "appwrite.config.json"), "utf8"));
  const localNormalized = JSON.stringify(normalize(config), null, 2);
  const remoteNormalized = JSON.stringify(normalize(remote), null, 2);
  if (localNormalized !== remoteNormalized) {
    console.error("Configuration drift detected.");
    console.error(JSON.stringify({ git: JSON.parse(localNormalized), appwrite: JSON.parse(remoteNormalized) }, null, 2));
    process.exitCode = 3;
  } else {
    console.log("No configuration drift.");
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
}
