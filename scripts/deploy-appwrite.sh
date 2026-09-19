#!/usr/bin/env bash
set -euo pipefail

mode="${1:-plan}"
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
manifest="$root/edgez.json"
config_rel="$(jq -er '.appwriteConfig' "$manifest")"
config="$root/$config_rel"
state_dir="$root/.edgez/deployments"

require() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 127
  }
}

require jq
require git
require shasum

if [[ ! -f "$config" ]]; then
  echo "Appwrite config not found: $config" >&2
  exit 1
fi

project_id="${APPWRITE_PROJECT_ID:-$(jq -er '.projectId' "$config")}"
endpoint="${APPWRITE_ENDPOINT:-$(jq -er '.endpoint' "$config")}"

export APPWRITE_PROJECT_ID="$project_id"
export APPWRITE_ENDPOINT="$endpoint"

configure_client() {
  require appwrite
  if [[ "$project_id" == "<PROJECT_ID>" ]]; then
    echo "Set APPWRITE_PROJECT_ID to the target project." >&2
    exit 2
  fi
  if [[ -z "${APPWRITE_API_KEY:-}" ]]; then
    echo "Set APPWRITE_API_KEY to an API key with the scopes required by this solution." >&2
    exit 2
  fi
  auth_dir="$(mktemp -d)"
  (
    cd "$auth_dir"
    appwrite client --key "$APPWRITE_API_KEY" >/dev/null
  )
  rm -rf "$auth_dir"
}

config_digest="$(shasum -a 256 "$config" | awk '{print $1}')"
git_commit="$(git -C "$root" rev-parse HEAD)"
git_ref="$(git -C "$root" symbolic-ref --quiet --short HEAD || printf 'detached')"
if git -C "$root" diff --quiet && git -C "$root" diff --cached --quiet; then
  git_dirty=false
else
  git_dirty=true
fi

plan() {
  jq -e '
    def count(name): {resource: name, count: ((.[name] // []) | length)};
    {
      schemaVersion: 1,
      engine: "appwrite-cli",
      operationOrder: [
        count("tablesDB"),
        count("tables"),
        count("buckets"),
        count("functions"),
        count("sites")
      ]
    }
  ' "$config"
  jq -n     --arg projectId "$project_id"     --arg endpoint "$endpoint"     --arg gitRef "$git_ref"     --arg gitCommit "$git_commit"     --arg config "$config_rel"     --arg configSha256 "$config_digest"     --argjson dirty "$git_dirty"     '{projectId:$projectId, endpoint:$endpoint, git:{ref:$gitRef,commit:$gitCommit,dirty:$dirty}, config:$config, configSha256:$configSha256}'
}

compare() {
  configure_client
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT
  cp "$config" "$tmp/appwrite.config.json"
  (
    cd "$tmp"
    appwrite pull all --all --force >/dev/null
  )
  jq --sort-keys 'del(.projectId, .endpoint)' "$config" >"$tmp/local.json"
  jq --sort-keys 'del(.projectId, .endpoint)' "$tmp/appwrite.config.json" >"$tmp/remote.json"
  if diff -u --label git/appwrite.config.json --label "appwrite/$project_id" "$tmp/local.json" "$tmp/remote.json"; then
    echo "No configuration drift."
  else
    echo "Configuration drift detected." >&2
    return 3
  fi
}

apply() {
  if [[ "$git_dirty" == true && "${EDGEZ_ALLOW_DIRTY:-false}" != true ]]; then
    echo "Refusing to deploy a dirty worktree. Commit the config or set EDGEZ_ALLOW_DIRTY=true." >&2
    exit 4
  fi
  configure_client
  (
    cd "$root"
    appwrite push all --all --force
  )
  mkdir -p "$state_dir"
  appwrite_version="$(appwrite --version | head -n 1)"
  jq -n     --arg schemaVersion "1"     --arg engine "appwrite-cli"     --arg engineVersion "$appwrite_version"     --arg projectId "$project_id"     --arg endpoint "$endpoint"     --arg gitRef "$git_ref"     --arg gitCommit "$git_commit"     --arg config "$config_rel"     --arg configSha256 "$config_digest"     --arg appliedAt "$(date -u +%Y-%m-%dT%H:%M:%SZ)"     '{schemaVersion:($schemaVersion|tonumber),engine:$engine,engineVersion:$engineVersion,projectId:$projectId,endpoint:$endpoint,git:{ref:$gitRef,commit:$gitCommit},config:$config,configSha256:$configSha256,appliedAt:$appliedAt}'     >"$state_dir/$project_id.json"
  echo "Deployment receipt: .edgez/deployments/$project_id.json"
}

case "$mode" in
  plan) plan ;;
  compare) compare ;;
  apply) apply ;;
  *)
    echo "Usage: scripts/deploy-appwrite.sh {plan|compare|apply}" >&2
    exit 64
    ;;
esac
