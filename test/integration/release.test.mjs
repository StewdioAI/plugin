import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { validateRelease } from "../../scripts/validate-release.mjs";

test("release tags must match every plugin manifest", (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), "stewdio-plugin-release-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const manifests = [".codex-plugin/plugin.json", ".claude-plugin/plugin.json", "package.json"];
  for (const file of manifests) {
    mkdirSync(path.dirname(path.join(directory, file)), { recursive: true });
    writeFileSync(path.join(directory, file), JSON.stringify({ version: "1.2.3" }));
  }

  assert.doesNotThrow(() => validateRelease(directory, "v1.2.3"));
  assert.throws(() => validateRelease(directory, "v1.2.4"), /does not match/);
  for (const tag of [undefined, "1.2.3", "v01.2.3", "v1.2.3-beta.1"]) {
    assert.throws(() => validateRelease(directory, tag), /Expected a release tag/);
  }
  for (const file of manifests) {
    writeFileSync(path.join(directory, file), JSON.stringify({ version: "1.2.4" }));
    assert.throws(() => validateRelease(directory, "v1.2.3"), /does not match/);
    writeFileSync(path.join(directory, file), JSON.stringify({ version: "1.2.3" }));
  }
});
