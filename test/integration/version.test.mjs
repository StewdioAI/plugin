import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { syncPluginVersion } from "../../scripts/sync-plugin-version.mjs";
import { validateRelease } from "../../scripts/validate-release.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));

function fixture(t) {
  const directory = realpathSync(mkdtempSync(path.join(tmpdir(), "stewdio-plugin-version-")));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  cpSync(repository, directory, {
    recursive: true,
    filter: (source) => ![".git", "node_modules", "dist", ".context"].includes(path.basename(source)),
  });
  for (const file of readdirSync(path.join(directory, ".changeset"))) {
    if (file.endsWith(".md") && file !== "README.md") {
      rmSync(path.join(directory, ".changeset", file));
    }
  }
  // Run the installed CLI against a disposable repository, without reinstalling dependencies.
  symlinkSync(path.join(repository, "node_modules"), path.join(directory, "node_modules"));
  const git = (...args) => execFileSync("git", args, { cwd: directory, stdio: "pipe" });
  git("init", "--initial-branch=main");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.com");
  git("add", ".");
  git("commit", "-m", "Initial fixture");
  const npm = (...args) => execFileSync("npm", args, {
    cwd: directory,
    encoding: "utf8",
    env: { ...process.env, npm_config_offline: "true", npm_config_audit: "false" },
  });
  return { directory, npm };
}

test("automatic patch releases and explicit minor changesets keep manifests, changelog, and lockfile in sync", (t) => {
  const { directory, npm } = fixture(t);
  const read = (file) => readFileSync(path.join(directory, file), "utf8");
  const originalVersion = JSON.parse(read("package.json")).version;
  const [major, minor, patch] = originalVersion.split(".").map(Number);
  const manifests = [".codex-plugin/plugin.json", ".claude-plugin/plugin.json"];
  const originals = manifests.map(read);
  const oldChangelog = read("CHANGELOG.md");
  const verify = (version, summary) => {
    validateRelease(directory, `v${version}`);
    for (const [index, file] of manifests.entries()) {
      assert.equal(read(file), originals[index].replace(`"${originalVersion}"`, `"${version}"`));
    }
    const lockfile = JSON.parse(read("package-lock.json"));
    assert.equal(lockfile.version, version);
    assert.equal(lockfile.packages[""].version, version);
    assert.match(read("CHANGELOG.md"), new RegExp(summary));
    assert.ok(read("CHANGELOG.md").endsWith(oldChangelog.slice(oldChangelog.indexOf("\n"))));
    npm("run", "package");
    const archive = path.join(directory, "dist", `stewdio-plugin-${version}.zip`);
    assert.equal(
      JSON.parse(execFileSync("unzip", ["-p", archive, ".codex-plugin/plugin.json"], { encoding: "utf8" })).version,
      version,
    );
  };

  npm("run", "changeset", "--", "--patch", "plugin", "--message", "Release a merge without a changeset.");
  npm("run", "version:plugin");
  verify(`${major}.${minor}.${patch + 1}`, "Release a merge without a changeset");
  assert.deepEqual(readdirSync(path.join(directory, ".changeset")).sort(), ["README.md", "config.json"]);

  writeFileSync(path.join(directory, ".changeset/minor.md"), '---\n"plugin": minor\n---\n\nAdd a new plugin capability.\n');
  npm("run", "changeset", "--", "--patch", "plugin", "--message", "Release another merge.");
  npm("run", "version:plugin");
  verify(`${major}.${minor + 1}.0`, "Add a new plugin capability");
  assert.equal(existsSync(path.join(directory, ".changeset/minor.md")), false);
});

test("manifest synchronization validates every input before writing", (t) => {
  const { directory } = fixture(t);
  const file = path.join(directory, ".codex-plugin/plugin.json");
  const original = readFileSync(file, "utf8");
  writeFileSync(path.join(directory, ".claude-plugin/plugin.json"), '{"name":"stewdio"}\n');
  assert.throws(() => syncPluginVersion(directory), /Missing version/);
  assert.equal(readFileSync(file, "utf8"), original);
});
