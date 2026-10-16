import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { packagePlugin } from "../../scripts/package-plugin.mjs";

function fixture(t) {
  const directory = mkdtempSync(path.join(tmpdir(), "stewdio-plugin-package-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const plugin = path.join(directory, "plugin");
  cpSync(fileURLToPath(new URL("../../", import.meta.url)), plugin, {
    recursive: true,
    filter: (source) =>
      ![".git", "node_modules", "dist", ".context"].includes(path.basename(source)),
  });
  return { plugin, archive: path.join(directory, "submission.zip") };
}

test("submission ZIP includes the Codex package and excludes local and marketplace files", async (t) => {
  const { plugin, archive } = fixture(t);
  mkdirSync(path.join(plugin, ".claude"));
  writeFileSync(path.join(plugin, ".claude/settings.local.json"), "private local settings");
  writeFileSync(path.join(plugin, ".codex-plugin/private.json"), "private metadata");
  writeFileSync(path.join(plugin, ".env"), "PRIVATE_TOKEN=do-not-package");
  packagePlugin(plugin, archive);
  const files = execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((name) => !name.endsWith("/"));
  assert.deepEqual(files.toSorted(), [
    ".codex-plugin/plugin.json",
    ".mcp.json",
    "LICENSE",
    "README.md",
    "assets/logo.svg",
    "skills/stewdio/SKILL.md",
    "skills/stewdio/agents/openai.yaml",
    "skills/stewdio/references/canvas.md",
    "skills/stewdio/references/xml.md",
  ]);

  writeFileSync(path.join(plugin, "assets/temporary.png"), "temporary asset");
  packagePlugin(plugin, archive);
  assert.match(execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }), /temporary.png/);
  await rm(path.join(plugin, "assets/temporary.png"));
  packagePlugin(plugin, archive);
  assert.doesNotMatch(
    execFileSync("unzip", ["-Z1", archive], { encoding: "utf8" }),
    /temporary.png/,
  );
});

test("submission ZIP rejects symlinks inside packaged resources", (t) => {
  const { plugin, archive } = fixture(t);
  symlinkSync(path.join(plugin, ".env"), path.join(plugin, "assets/linked.png"));
  assert.throws(() => packagePlugin(plugin, archive), /require regular files/);
});

test("submission ZIP rejects hidden settings inside a skill", (t) => {
  const { plugin, archive } = fixture(t);
  writeFileSync(path.join(plugin, "skills/stewdio/.env"), "PRIVATE_TOKEN=do-not-package");
  assert.throws(() => packagePlugin(plugin, archive), /Unexpected private or generated/);
});
