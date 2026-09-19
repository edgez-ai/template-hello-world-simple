import { configureClient, gitState, plan, rootDir, run, writeReceipt } from "./appwrite.mjs";

const state = gitState();
if (state.dirty && process.env.EDGEZ_ALLOW_DIRTY !== "true") {
  throw new Error("Refusing to install from a dirty worktree. Commit changes or set EDGEZ_ALLOW_DIRTY=true.");
}

configureClient();
console.log(JSON.stringify(plan(), null, 2));
run(["push", "all", "--all", "--force"], { cwd: rootDir });
console.log(`Deployment receipt: ${writeReceipt()}`);

