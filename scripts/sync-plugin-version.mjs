import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { validateRelease } from "./validate-release.mjs";

export function syncPluginVersion(directory) {
  const { version } = JSON.parse(readFileSync(path.join(directory, "package.json"), "utf8"));
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
    throw new Error(`Expected a stable release version in package.json, got ${version}`);
  }
  const manifests = [".codex-plugin/plugin.json", ".claude-plugin/plugin.json"].map((file) => {
    const filename = path.join(directory, file);
    const content = readFileSync(filename, "utf8");
    if (typeof JSON.parse(content).version !== "string") {
      throw new Error(`Missing version in ${file}`);
    }
    return { filename, content };
  });
  for (const { filename, content } of manifests) {
    writeFileSync(
      filename,
      content.replace(
        /("version"\s*:\s*")[^"]*(")/,
        (_, prefix, suffix) => `${prefix}${version}${suffix}`,
      ),
    );
  }
  validateRelease(directory, `v${version}`);
  return version;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = fileURLToPath(new URL("../", import.meta.url));
  console.log(`Synced plugin manifests to ${syncPluginVersion(directory)}`);
}
