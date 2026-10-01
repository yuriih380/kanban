// Checks every skill under skills/ against the Agent Skills specification
// (https://agentskills.io/specification) and verifies that `npx skills`
// installs exactly the skill folder, with nothing else from the repo.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");
const ALLOWED_FIELDS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
]);
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_BODY_LINES = 500;

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const license = readFileSync(join(ROOT, "LICENSE"), "utf8");
checkChangelog(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8"));

if (existsSync(join(ROOT, "SKILL.md"))) {
  fail(
    "SKILL.md",
    "a root SKILL.md hides skills/ from `npx skills` and installs the whole repo",
  );
}

const skillNames = existsSync(SKILLS_DIR)
  ? readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort()
  : [];
if (skillNames.length === 0) fail("skills/", "no skill folders found");
for (const name of skillNames) validateSkill(name);
if (errors.length === 0) checkInstall(skillNames);

if (errors.length > 0) {
  for (const error of errors) console.error(`✗ ${error}`);
  process.exitCode = 1;
} else {
  console.log(`✓ ${skillNames.join(", ")} valid and installable`);
}

function validateSkill(dirName) {
  const where = `skills/${dirName}/SKILL.md`;
  const file = join(SKILLS_DIR, dirName, "SKILL.md");
  if (!existsSync(file)) return fail(where, "missing");

  const text = readFileSync(file, "utf8");
  if (text.includes("\r")) fail(where, "use LF line endings");

  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return fail(where, "missing YAML frontmatter");

  let frontmatter;
  try {
    frontmatter = parse(match[1]);
  } catch (error) {
    return fail(where, `invalid frontmatter YAML: ${error.message}`);
  }
  if (!isPlainObject(frontmatter)) {
    return fail(where, "frontmatter must be a mapping");
  }

  for (const key of Object.keys(frontmatter)) {
    if (!ALLOWED_FIELDS.has(key)) {
      fail(where, `unknown frontmatter field "${key}" (use metadata)`);
    }
  }

  const { name, description, compatibility, metadata } = frontmatter;
  if (
    typeof name !== "string" ||
    !NAME_PATTERN.test(name) ||
    name.length > 64
  ) {
    fail(
      where,
      "name must be 1-64 lowercase letters, digits, and single hyphens",
    );
  } else if (name !== dirName) {
    fail(where, `name "${name}" must match its folder "${dirName}"`);
  } else if (/anthropic|claude/.test(name)) {
    fail(where, "name must not contain the reserved words anthropic or claude");
  }

  if (typeof description !== "string" || !description.trim()) {
    fail(where, "description is required");
  } else if (description.length > 1024) {
    fail(where, "description must be at most 1024 characters");
  } else if (/[<>]/.test(description)) {
    fail(where, "description must not contain angle brackets");
  }

  if (
    compatibility !== undefined &&
    (typeof compatibility !== "string" || compatibility.length > 500)
  ) {
    fail(where, "compatibility must be a string of at most 500 characters");
  }

  // The root LICENSE is not installed, so each skill carries its own copy.
  if (frontmatter.license !== pkg.license) {
    fail(where, `license must be "${pkg.license}" to match package.json`);
  }
  const licenseFile = join(SKILLS_DIR, dirName, "LICENSE.txt");
  if (
    !existsSync(licenseFile) ||
    readFileSync(licenseFile, "utf8") !== license
  ) {
    fail(`skills/${dirName}/LICENSE.txt`, "must be a copy of the root LICENSE");
  }

  if (!isPlainObject(metadata)) {
    fail(where, "metadata with a version is required");
  } else {
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value !== "string") {
        fail(where, `metadata.${key} must be a quoted string`);
      }
    }
    if (metadata.version !== pkg.version) {
      fail(where, `metadata.version must be "${pkg.version}" (package.json)`);
    }
  }

  const body = text.slice(match[0].length);
  const bodyLines = body.split("\n").length;
  if (bodyLines > MAX_BODY_LINES) {
    fail(where, `body has ${bodyLines} lines; keep it under ${MAX_BODY_LINES}`);
  }

  checkLinks(where, join(SKILLS_DIR, dirName), body);
}

// Relative links must resolve inside the skill folder, because nothing
// outside it is installed. Links inside code (templates) are ignored.
function checkLinks(where, skillDir, body) {
  const prose = body
    .replace(/^ {0,3}(`{3,}|~{3,})[\s\S]*?^ {0,3}\1/gm, "")
    .replace(/`[^`\n]*`/g, "");
  for (const [, target] of prose.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(?:[a-z]+:|#)/i.test(target)) continue;
    let path;
    try {
      path = resolve(skillDir, decodeURI(target.split("#")[0]));
    } catch {
      fail(where, `link "${target}" is not a valid URI`);
      continue;
    }
    if (!path.startsWith(skillDir + sep)) {
      fail(where, `link "${target}" points outside the skill folder`);
    } else if (!existsSync(path)) {
      fail(where, `link "${target}" does not resolve`);
    }
  }
}

// Installs from this checkout into a scratch project with the pinned
// `skills` CLI, then compares the installed files with the source folders.
function checkInstall(names) {
  const require = createRequire(import.meta.url);
  const cli = join(
    dirname(require.resolve("skills/package.json")),
    "bin",
    "cli.mjs",
  );
  const project = mkdtempSync(join(tmpdir(), "skills-install-"));
  try {
    const result = spawnSync(
      process.execPath,
      [
        cli,
        "add",
        ROOT,
        "--skill",
        ...names,
        "--agent",
        "claude-code",
        "--yes",
        "--copy",
      ],
      {
        cwd: project,
        encoding: "utf8",
        env: { ...process.env, DISABLE_TELEMETRY: "1", NO_COLOR: "1" },
      },
    );
    if (result.status !== 0) {
      return fail(
        "npx skills add",
        result.error?.message ??
          `exited ${result.status}\n${result.stdout}${result.stderr}`,
      );
    }

    const installRoot = join(project, ".claude", "skills");
    const installed = existsSync(installRoot)
      ? readdirSync(installRoot).sort()
      : [];
    if (installed.join() !== names.join()) {
      fail("npx skills add", `installed [${installed}], expected [${names}]`);
    }
    for (const name of names) {
      const source = listFiles(join(SKILLS_DIR, name));
      const copied = listFiles(join(installRoot, name));
      if (source.join() !== copied.join()) {
        fail(
          "npx skills add",
          `${name} installed [${copied}], expected [${source}]`,
        );
      }
    }
  } finally {
    rmSync(project, { recursive: true, force: true });
  }
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(dir, join(entry.parentPath, entry.name)).split(sep).join("/"),
    )
    .sort();
}

// The latest release must match package.json and have its link references.
function checkChangelog(changelog) {
  const version = /^## \[(\d+\.\d+\.\d+[^\]]*)\]/m.exec(changelog)?.[1];
  if (version !== pkg.version) {
    return fail(
      "CHANGELOG.md",
      `latest release is ${version ?? "missing"}, package.json is ${pkg.version}`,
    );
  }
  const escaped = version.replace(/[.+]/g, "\\$&");
  if (!new RegExp(`^\\[${escaped}\\]: \\S+`, "m").test(changelog)) {
    fail("CHANGELOG.md", `add a [${version}] link reference`);
  }
  if (
    !new RegExp(
      `^\\[unreleased\\]: \\S+/compare/v${escaped}\\.\\.\\.HEAD$`,
      "im",
    ).test(changelog)
  ) {
    fail("CHANGELOG.md", `[unreleased] must compare v${version}...HEAD`);
  }
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
