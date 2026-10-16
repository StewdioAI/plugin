import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const entries = [
  ".codex-plugin/plugin.json",
  ".mcp.json",
  "skills",
  "assets",
  "LICENSE",
  "README.md",
];

function copyEntry(source, destination) {
  const entry = lstatSync(source);
  if (entry.isDirectory()) {
    mkdirSync(destination, { recursive: true });
    for (const name of readdirSync(source).toSorted()) {
      if (name.startsWith(".") || name.endsWith(".local") || name === "node_modules")
        throw new Error(`Unexpected private or generated plugin file: ${path.join(source, name)}`);
      copyEntry(path.join(source, name), path.join(destination, name));
    }
  } else if (entry.isFile()) {
    mkdirSync(path.dirname(destination), { recursive: true });
    copyFileSync(source, destination);
  } else {
    throw new Error(`Plugin archives require regular files and directories: ${source}`);
  }
}

export function packagePlugin(directory, output) {
  const archive = path.resolve(output);
  mkdirSync(path.dirname(archive), { recursive: true });
  const temporary = mkdtempSync(path.join(path.dirname(archive), ".plugin-package-"));
  const contents = path.join(temporary, "contents");
  try {
    for (const entry of entries) copyEntry(path.join(directory, entry), path.join(contents, entry));
    const packaged = path.join(temporary, "plugin.zip");
    execFileSync("zip", ["-q", "-X", "-r", packaged, ...entries], { cwd: contents });
    renameSync(packaged, archive);
    return archive;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = fileURLToPath(new URL("../", import.meta.url));
  const manifest = JSON.parse(
    readFileSync(path.join(directory, ".codex-plugin/plugin.json"), "utf8"),
  );
  const output =
    process.argv[2] ??
    path.join(directory, "dist", `${manifest.name}-chatgpt-plugin-${manifest.version}.zip`);
  console.log(packagePlugin(directory, output));
}
