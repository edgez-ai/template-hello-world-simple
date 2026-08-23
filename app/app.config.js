const appName = process.env.APP_NAME || "hello-world-simple";
const domainSuffix = process.env.DOMAIN_SUFFIX || "edgez.biz";
const bundlePrefix = domainSuffix.split(".").reverse().join(".");
const androidName = appName.replace(/[^A-Za-z0-9_]/g, "_").replace(/^[^A-Za-z_]+/, "app");

module.exports = {
  expo: {
    name: appName,
    slug: appName,
    scheme: "edgez-devtools",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    android: { package: `${bundlePrefix}.${androidName}` },
  },
};
