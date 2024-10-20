import { readFileSync, writeFileSync } from "fs";

// If preversion, version, or postversion are in the scripts property of the package.json
// they will be executed as part of running npm version.

const newVersion = process.env.npm_package_version;

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = newVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
console.log(`Updated manifest.json with new version ${newVersion}`);

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[newVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
console.log(`Updated versions.json with new version ${newVersion}`);
