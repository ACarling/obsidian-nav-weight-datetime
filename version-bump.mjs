import { readFileSync, writeFileSync } from "fs";

// auto increase version when releasing
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const versionParts = packageJson.version.split('.');
versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
const newVersion = versionParts.join('.');
packageJson.version = newVersion;
writeFileSync('./package.json', JSON.stringify(packageJson, null, "\t"));

const targetVersion = newVersion;

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
