import { readFileSync, writeFileSync } from "fs";

// increase version when releasing
// reading from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const oldVersion = packageJson.version;
const versionParts = oldVersion.split('.');
versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
const newVersion = versionParts.join('.');
packageJson.version = newVersion;
writeFileSync('./package.json', JSON.stringify(packageJson, null, "\t"));
console.log(`Bumped version from ${oldVersion} to ${newVersion}`);

// update draft-release.ps1 with new version
const ps1Filename = "draft-release.ps1";
const ps1FileContent = `git tag -a ${newVersion} -m "${newVersion}"\r\ngit push origin ${newVersion}\r\nWrite-Host "Completed. The GitHub Action will automatically draft a release."`
writeFileSync(ps1Filename, ps1FileContent);
console.log(`Updated ${ps1Filename} with new version ${newVersion}`);
console.log(`!NOTE: make sure all changes are committed before running ${ps1Filename}`)

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
