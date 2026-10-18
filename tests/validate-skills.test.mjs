import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMP_ROOT = join(ROOT, ".temp");
const validator = readFileSync(join(ROOT, "scripts/validate-skills.mjs"));
const skill = `---
name: kanban
description: Track small tasks on a board.
license: MIT
metadata:
  version: "1.2.3"
---
# Kanban

[Reference](references/guide.md)
`;

// Only fixture installs use this CLI; npm run validate still uses the real one.
const cli = `import { appendFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const root = process.argv[3];
const mode = readFileSync(join(root, "install-mode.txt"), "utf8");
if (mode === "failure") {
  console.error("Fixture CLI failed");
  process.exit(7);
}
const installRoot = join(process.cwd(), ".claude", "skills");
mkdirSync(installRoot, { recursive: true });
const target = join(installRoot, "kanban");
cpSync(join(root, "skills", "kanban"), target, { recursive: true });
if (mode === "corrupt-skill") appendFileSync(join(target, "SKILL.md"), "Changed installed content\\n");
if (mode === "corrupt-resource") writeFileSync(join(target, "references", "data.bin"), Buffer.from([0, 255, 2, 128]));
if (mode === "extra-file") writeFileSync(join(target, "extra.txt"), "Unexpected file\\n");
if (mode === "root-license") cpSync(join(root, "LICENSE"), join(target, "LICENSE"));
if (mode === "missing-file") rmSync(join(target, "references", "data.bin"));
if (mode === "extra-skill") mkdirSync(join(installRoot, "unexpected"));
if (mode === "missing-skill") rmSync(target, { recursive: true });
`;

function write(root, path, contents) {
  const file = join(root, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, contents);
}

function runFixture(change = () => {}) {
  mkdirSync(TEMP_ROOT, { recursive: true });
  // Keeping fixtures under the repo lets YAML resolve after a fresh npm ci.
  const root = mkdtempSync(join(TEMP_ROOT, "validate-skills-"));
  try {
    write(root, "scripts/validate-skills.mjs", validator);
    write(
      root,
      "package.json",
      JSON.stringify({ type: "module", version: "1.2.3", license: "MIT" }),
    );
    write(root, "LICENSE", "Fixture MIT license\n");
    write(
      root,
      "CHANGELOG.md",
      "## [Unreleased]\n\n## [1.2.3] - 2026-10-06\n\n" +
        "[unreleased]: https://example.com/compare/v1.2.3...HEAD\n" +
        "[1.2.3]: https://example.com/releases/tag/v1.2.3\n",
    );
    write(root, "skills/kanban/SKILL.md", skill);
    write(root, "skills/kanban/references/guide.md", "# Guide\n");
    write(
      root,
      "skills/kanban/references/data.bin",
      Buffer.from([0, 255, 1, 128]),
    );
    write(root, "node_modules/skills/package.json", '{"name":"skills"}\n');
    write(root, "node_modules/skills/bin/cli.mjs", cli);
    write(root, "install-mode.txt", "copy");
    change(root);
    const result = spawnSync(
      process.execPath,
      [join(root, "scripts/validate-skills.mjs")],
      { cwd: root, encoding: "utf8", timeout: 15_000 },
    );
    assert.ifError(result.error);
    assert.equal(result.signal, null);
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    const path = relative(TEMP_ROOT, root);
    assert.ok(path && !isAbsolute(path) && !path.startsWith(`..${sep}`));
    rmSync(root, { recursive: true, force: true });
  }
}

test("accepts a skill with only a root license and exact installed files", () => {
  const result = runFixture();
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /valid and installable/);
});

const invalidSources = [
  [
    "missing metadata",
    (root) =>
      write(
        root,
        "skills/kanban/SKILL.md",
        skill.replace('metadata:\n  version: "1.2.3"\n', ""),
      ),
    /metadata with a version is required/,
  ],
  [
    "skill version mismatch",
    (root) =>
      write(root, "skills/kanban/SKILL.md", skill.replace("1.2.3", "1.2.4")),
    /metadata\.version/,
  ],
  [
    "package version mismatch",
    (root) =>
      write(
        root,
        "package.json",
        JSON.stringify({ type: "module", version: "1.2.4", license: "MIT" }),
      ),
    /latest release is 1\.2\.3, package\.json is 1\.2\.4/,
  ],
  [
    "changelog version mismatch",
    (root) => write(root, "CHANGELOG.md", "## [1.2.4] - 2026-10-06\n"),
    /latest release is 1\.2\.4, package\.json is 1\.2\.3/,
  ],
  [
    "frontmatter license mismatch",
    (root) =>
      write(
        root,
        "skills/kanban/SKILL.md",
        skill.replace("license: MIT", "license: Apache-2.0"),
      ),
    /license must be "MIT"/,
  ],
  [
    "missing local link",
    (root) => rmSync(join(root, "skills/kanban/references/guide.md")),
    /link .* does not resolve/,
  ],
  [
    "escaping local link",
    (root) =>
      write(
        root,
        "skills/kanban/SKILL.md",
        skill.replace("references/guide.md", "../../LICENSE"),
      ),
    /link .* points outside the skill folder/,
  ],
  [
    "accidental root skill",
    (root) => write(root, "SKILL.md", skill),
    /root SKILL\.md hides skills\//,
  ],
];

for (const [name, change, diagnostic] of invalidSources) {
  test(`rejects ${name}`, () => {
    const result = runFixture(change);
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, diagnostic);
  });
}

const invalidInstalls = [
  ["corrupt-skill", /kanban\/SKILL\.md installed bytes differ/],
  ["corrupt-resource", /kanban\/references\/data\.bin installed bytes differ/],
  ["extra-file", /kanban installed \[.*extra\.txt/],
  ["root-license", /kanban installed \[.*LICENSE/],
  ["missing-file", /kanban installed \[.*\], expected \[.*data\.bin/],
  ["extra-skill", /installed \[kanban,unexpected\], expected \[kanban\]/],
  ["missing-skill", /installed \[\], expected \[kanban\]/],
  ["failure", /npx skills add: exited 7[\s\S]*Fixture CLI failed/],
];

for (const [mode, diagnostic] of invalidInstalls) {
  test(`rejects installation: ${mode}`, () => {
    const result = runFixture((root) => write(root, "install-mode.txt", mode));
    assert.equal(result.status, 1, result.output);
    assert.match(result.output, diagnostic);
    assert.doesNotMatch(result.output, /Error: ENOENT|at checkInstall/);
  });
}
