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

function writeSkill(root, contents) {
  write(root, "skills/kanban/SKILL.md", contents);
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
  [
    "uppercase name",
    (root) => writeSkill(root, skill.replace("name: kanban", "name: Kanban")),
    /name must be 1-64 lowercase letters/,
  ],
  [
    "name that differs from its folder",
    (root) => writeSkill(root, skill.replace("name: kanban", "name: board")),
    /name "board" must match its folder "kanban"/,
  ],
  [
    "reserved word in name",
    (root) =>
      write(
        root,
        "skills/claude-kanban/SKILL.md",
        skill
          .replace("name: kanban", "name: claude-kanban")
          .replace("[Reference](references/guide.md)\n", ""),
      ),
    /must not contain the reserved words/,
  ],
  [
    "missing description",
    (root) =>
      writeSkill(
        root,
        skill.replace("description: Track small tasks on a board.\n", ""),
      ),
    /description is required/,
  ],
  [
    "overlong description",
    (root) =>
      writeSkill(
        root,
        skill.replace("Track small tasks on a board.", "x".repeat(1025)),
      ),
    /description must be at most 1024 characters/,
  ],
  [
    "angle brackets in description",
    (root) => writeSkill(root, skill.replace("small tasks", "<b>tasks</b>")),
    /description must not contain angle brackets/,
  ],
  [
    "unknown frontmatter field",
    (root) =>
      writeSkill(
        root,
        skill.replace("license: MIT", "license: MIT\nwhen_to_use: Always."),
      ),
    /unknown frontmatter field "when_to_use"/,
  ],
  [
    "overlong compatibility",
    (root) =>
      writeSkill(
        root,
        skill.replace(
          "license: MIT",
          `license: MIT\ncompatibility: ${"x".repeat(501)}`,
        ),
      ),
    /compatibility must be a string of at most 500 characters/,
  ],
  [
    "non-string metadata value",
    (root) =>
      writeSkill(
        root,
        skill.replace('version: "1.2.3"', 'version: "1.2.3"\n  build: 7'),
      ),
    /metadata\.build must be a quoted string/,
  ],
  [
    "CRLF line endings",
    (root) => writeSkill(root, skill.replaceAll("\n", "\r\n")),
    /SKILL\.md: use LF line endings/,
  ],
  [
    "missing frontmatter",
    (root) => writeSkill(root, "# Kanban\n"),
    /missing YAML frontmatter/,
  ],
  [
    "invalid frontmatter YAML",
    (root) => writeSkill(root, skill.replace("name: kanban", "name: [kanban")),
    /invalid frontmatter YAML/,
  ],
  [
    "too many body lines",
    (root) => writeSkill(root, skill + "line\n".repeat(501)),
    /body has \d+ lines; keep it under 500/,
  ],
  [
    "oversized body",
    (root) => writeSkill(root, `${skill}${"x".repeat(20_001)}\n`),
    /body has \d+ characters; keep it under 20000/,
  ],
  [
    "invisible character",
    (root) => writeSkill(root, `${skill}Zero​width\n`),
    /SKILL\.md: remove the invisible character U\+200B/,
  ],
  [
    "missing reference-style link",
    (root) => writeSkill(root, `${skill}\n[missing]: references/missing.md\n`),
    /link "references\/missing\.md" does not resolve/,
  ],
  [
    "escaping link in a reference file",
    (root) =>
      write(
        root,
        "skills/kanban/references/guide.md",
        "# Guide\n\n[License](../../../LICENSE)\n",
      ),
    /references\/guide\.md: link .* points outside the skill folder/,
  ],
  [
    "CRLF in a reference file",
    (root) => write(root, "skills/kanban/references/guide.md", "# Guide\r\n"),
    /references\/guide\.md: use LF line endings/,
  ],
  [
    "invisible character in a reference file",
    (root) => write(root, "skills/kanban/references/guide.md", "# Gui‮de\n"),
    /references\/guide\.md: remove the invisible character U\+202E/,
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
