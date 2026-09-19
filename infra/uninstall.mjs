import { config, configureClient, projectId, removeIfPresent } from "./appwrite.mjs";

configureClient();
console.log(`Uninstalling declared resources from Appwrite project ${projectId}`);

for (const site of [...(config.sites || [])].reverse()) {
  removeIfPresent(
    `site ${site.$id}`,
    ["sites", "get", "--site-id", site.$id],
    ["sites", "delete", "--site-id", site.$id],
  );
}
for (const fn of [...(config.functions || [])].reverse()) {
  removeIfPresent(
    `function ${fn.$id}`,
    ["functions", "get", "--function-id", fn.$id],
    ["functions", "delete", "--function-id", fn.$id],
  );
}
for (const bucket of [...(config.buckets || [])].reverse()) {
  removeIfPresent(
    `bucket ${bucket.$id}`,
    ["storage", "get-bucket", "--bucket-id", bucket.$id],
    ["storage", "delete-bucket", "--bucket-id", bucket.$id],
  );
}
for (const table of [...(config.tables || [])].reverse()) {
  const ids = ["--database-id", table.databaseId, "--table-id", table.$id];
  removeIfPresent(
    `table ${table.databaseId}/${table.$id}`,
    ["tables-db", "get-table", ...ids],
    ["tables-db", "delete-table", ...ids],
  );
}
for (const database of [...(config.tablesDB || [])].reverse()) {
  removeIfPresent(
    `database ${database.$id}`,
    ["tables-db", "get", "--database-id", database.$id],
    ["tables-db", "delete", "--database-id", database.$id],
  );
}

console.log("Uninstall complete. Users and resources not declared by this solution were preserved.");

