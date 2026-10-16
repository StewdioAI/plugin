import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function validateRelease(directory, tag) {
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error(`Expected a release tag in v<major>.<minor>.<patch> format, got ${tag}`);
  }
  for (const file of [".codex-plugin/plugin.json", ".claude-plugin/plugin.json", "package.json"]) {
    const { version } = JSON.parse(readFileSync(path.join(directory, file), "utf8"));
    if (tag !== `v${version}`) {
      throw new Error(`Release tag ${tag} does not match ${file} version ${version}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  validateRelease(fileURLToPath(new URL("../", import.meta.url)), process.argv[2]);
}
