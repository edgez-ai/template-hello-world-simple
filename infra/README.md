# Appwrite infrastructure

This directory is the deterministic deployment engine for the solution.
Node.js invokes the pinned Appwrite CLI directly; AI never translates the
manifest into API calls.

```sh
cd infra
npm install
npm run plan
npm run compare
npm run install:solution
```

Set `APPWRITE_PROJECT_ID` and `APPWRITE_API_KEY` before commands that read or
change remote state. `APPWRITE_ENDPOINT` may override the checked-in endpoint.

- `plan` is offline and prints resource counts, fixed operation order, Git
  commit/dirty state, and the SHA-256 of `appwrite.config.json`.
- `compare` pulls the selected project into a temporary directory and exits 3
  when the normalized remote configuration differs from Git.
- `install:solution` refuses a dirty worktree, then uses `appwrite push all` as the
  single interpreter. It writes an ignored receipt under
  `.edgez/deployments/`.
- `uninstall` deletes only IDs declared by this solution, in reverse dependency
  order. It preserves users and unrelated project resources. Preview it with
  `INFRA_DRY_RUN=1 npm run uninstall:solution`.

Both install and uninstall change remote state. Do not run them without explicit
authorization.
