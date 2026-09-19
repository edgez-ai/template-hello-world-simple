import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const infraDir = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(infraDir, "..");
export const manifest = JSON.parse(readFileSync(path.join(rootDir, "edgez.json"), "utf8"));
export const configPath = path.resolve(rootDir, manifest.appwriteConfig);
if (!configPath.startsWith(`${rootDir}${path.sep}`) || !existsSync(configPath)) {
  throw new Error("edgez.json must reference an Appwrite config inside this repository");
}
export const config = JSON.parse(readFileSync(configPath, "utf8"));
export const projectId = process.env.APPWRITE_PROJECT_ID || config.projectId;
export const endpoint = process.env.APPWRITE_ENDPOINT || config.endpoint;
export const dryRun = process.env.INFRA_DRY_RUN === "1";

const cli = path.join(infraDir, "node_modules", ".bin", "appwrite");

function printable(args) {
  return ["appwrite", ...args]
    .map((value) => value === process.env.APPWRITE_API_KEY ? "<redacted>" : value)
    .join(" ");
}

export function run(args, options = {}) {
  if (!existsSync(cli)) throw new Error("Run npm install in infra/ first.");
  if (dryRun) {
    console.log(`[dry-run] ${printable(args)}`);
    return { status: options.probe ? 1 : 0, stdout: "" };
  }
  const result = spawnSync(cli, args, {
    cwd: options.cwd || infraDir,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: {
      ...process.env,
      APPWRITE_ENDPOINT: endpoint,
      APPWRITE_PROJECT_ID: projectId,
    },
  });
  if (!options.allowFailure && result.status !== 0) {
    if (options.capture) process.stderr.write(result.stderr || result.stdout || "");
    throw new Error(`Command failed: ${printable(args)}`);
  }
  return result;
}

export function configureClient() {
  if (!projectId || projectId === "<PROJECT_ID>") {
    throw new Error("Set APPWRITE_PROJECT_ID to the target project");
  }
  if (!process.env.APPWRITE_API_KEY && !dryRun) {
    throw new Error("Set APPWRITE_API_KEY to an API key with the required scopes");
  }
  run([
    "client",
    "--endpoint", endpoint,
    "--project-id", projectId,
    "--key", process.env.APPWRITE_API_KEY || "<api-key>",
  ]);
}

export function exists(args) {
  return run(args, { capture: true, allowFailure: true, probe: true }).status === 0;
}

export function removeIfPresent(label, probeArgs, deleteArgs) {
  if (dryRun) {
    run(deleteArgs);
    return;
  }
  if (!exists(probeArgs)) {
    console.log(`Skipped missing ${label}`);
    return;
  }
  run(deleteArgs);
  console.log(`Deleted ${label}`);
}

export function digest() {
  return createHash("sha256").update(readFileSync(configPath)).digest("hex");
}

function git(...args) {
  const result = spawnSync("git", ["-C", rootDir, ...args], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed`);
  return result.stdout.trim();
}

export function gitState() {
  const dirty = spawnSync("git", ["-C", rootDir, "status", "--porcelain"], {
    encoding: "utf8",
  }).stdout.trim() !== "";
  const branch = spawnSync(
    "git",
    ["-C", rootDir, "symbolic-ref", "--quiet", "--short", "HEAD"],
    { encoding: "utf8" },
  );
  return {
    ref: branch.status === 0 ? branch.stdout.trim() : "detached",
    commit: git("rev-parse", "HEAD"),
    dirty,
  };
}

export function plan() {
  const order = ["tablesDB", "tables", "buckets", "functions", "sites"];
  return {
    schemaVersion: manifest.deploymentEngine?.schemaVersion || 1,
    engine: "appwrite-cli",
    projectId,
    endpoint,
    config: manifest.appwriteConfig,
    configSha256: digest(),
    git: gitState(),
    operationOrder: order.map((resource) => ({
      resource,
      count: Array.isArray(config[resource]) ? config[resource].length : 0,
    })),
  };
}

export function writeReceipt() {
  const stateDir = path.join(rootDir, ".edgez", "deployments");
  mkdirSync(stateDir, { recursive: true });
  const version = run(["--version"], { capture: true }).stdout.trim();
  const receipt = {
    ...plan(),
    engineVersion: version,
    appliedAt: new Date().toISOString(),
  };
  writeFileSync(
    path.join(stateDir, `${projectId}.json`),
    `${JSON.stringify(receipt, null, 2)}\n`,
  );
  return path.relative(rootDir, path.join(stateDir, `${projectId}.json`));
}
