# kanban

[![CI](https://github.com/yuriih380/kanban/actions/workflows/ci.yml/badge.svg)](https://github.com/yuriih380/kanban/actions/workflows/ci.yml)

An [Agent Skill](https://agentskills.io) that splits a large task, epic, or
story into small, verifiable subtasks and tracks them on a minimal Markdown
Kanban board inside your project.

It follows the open Agent Skills format, so it should work in any agent that
supports it, such as Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, and
OpenCode. It has been tested end to end in Codex desktop on Windows, and CI
test-installs it for Claude Code.

## Install

Install with the [`skills` CLI](https://github.com/vercel-labs/skills)
(requires Node.js 22.20 or later):

```bash
npx skills add yuriih380/kanban
```

The CLI detects the agents on your machine and asks where to install the skill.
Other common commands:

| Goal                                   | Command                                                  |
| -------------------------------------- | -------------------------------------------------------- |
| Install for every project (user level) | `npx skills add yuriih380/kanban -g`                     |
| Install for one agent without prompts  | `npx skills add yuriih380/kanban -a claude-code -y`      |
| Install a specific release             | `npx skills add yuriih380/kanban#<tag>`                  |
| Preview without installing             | `npx skills add yuriih380/kanban --list`                 |
| Update                                 | `npx skills update kanban`                               |
| Remove                                 | `npx skills remove kanban` (add `-g` for a user install) |

Replace `<tag>` with a tag from the
[releases page](https://github.com/yuriih380/kanban/releases). Without a tag,
the CLI installs the latest commit on `main`. An install pinned
to a tag stays on that tag when you run `update`; add the skill again without
the tag, or with a newer one, to move forward.

To install by hand, copy [`skills/kanban/`](skills/kanban/) into your agent's
skills folder, for example `.agents/skills/kanban/` or `.claude/skills/kanban/`.

## Usage

Ask your agent in plain language, for example:

- "Break the payment refactor into a Kanban board."
- "Resume the Kanban board and pick up the next task."
- "Mark QSG-3 done; the tests pass."
- "Create a separate board for refactor-api-controller in the same project."
- "Rename the API controller board to Simplify API and use SA for future ticket IDs."
- "Convert our existing board to the Kanban skill format."

The skill keeps each scope in its own epic folder under the master `kanban`
folder. Its parent is chosen from project instructions and the repository's
structure (see [Boards and version control](#boards-and-version-control)).
The project is the repository; names and ticket prefixes belong to individual
boards:

```text
<chosen-parent>/kanban/
  quick-start-guide/
    BOARD.md                 TODO | IN PROGRESS | DONE links
    EPIC.md                  board name, prefix, counter, goal, scope, and notes
    QSG-1.md                 one file per ticket; the file owns its status
    QSG-2.md
    QSG-3.md
  refactor-api-controller/
    BOARD.md
    EPIC.md
    RAC-1.md
```

How it works:

- Boards have separate scopes, backlogs, and numbering starting at `1`.
  Distinct board prefixes keep full ticket IDs and filenames unique in the
  repository: `QSG-1` and `RAC-1` are different tickets.
- Choose a board name and optional ticket prefix, or let the skill derive a
  prefix from the board name. Each board stores its settings in its own
  `EPIC.md`. If derived initials collide, the skill chooses an available suffix,
  such as `RAC2`; an explicitly chosen conflicting prefix needs a different choice.
- Change a board's name at any time. Its prefix stays the same unless you
  request a prefix change too; a new prefix applies to future tickets while
  that board's numbering continues. Existing ticket IDs and links stay stable,
  and previous prefixes remain reserved.
- `BOARD.md` and `EPIC.md` keep their filenames and identify their epic folder
  in headings and link labels. Epic folder names use dashes, without dates.
- Each task file holds the task's status, and the board is rebuilt from those
  statuses when they disagree.
- A task moves to `DONE` only with evidence, such as a passing check.
- Blocked work keeps its status and gains a `Blocked by:` note.
- Deferred or removed tasks leave the board but keep their files and IDs.

See [`skills/kanban/SKILL.md`](skills/kanban/SKILL.md) for the full rules and
templates. Rarely needed rules for renaming, moving tickets, and converting
older boards live in [`skills/kanban/references/`](skills/kanban/references/).

### Example

Ask: "Prepare a quick-start guide. Explain the output files, add the installation
command, and check the guide's links. Track the work on a Kanban board."

After completing the first task and resuming the next one, the board looks like this:

| TODO                                                                        | IN PROGRESS                                                                        | DONE                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [QSG-3 — Check the guide links](examples/kanban/quick-start-guide/QSG-3.md) | [QSG-2 — Add the installation command](examples/kanban/quick-start-guide/QSG-2.md) | [QSG-1 — Explain the output files](examples/kanban/quick-start-guide/QSG-1.md) |

Open [quick-start-guide/BOARD.md](examples/kanban/quick-start-guide/BOARD.md) and
[quick-start-guide/EPIC.md](examples/kanban/quick-start-guide/EPIC.md) to see the goal and completion
conditions. Each linked task file records its own status, scope, dependencies,
and verification evidence. The completed task produced a
[short guide](examples/kanban/quick-start-guide/GETTING_STARTED.md).

This example adapts an intermediate snapshot from a clean installation tested in Codex
desktop on Windows. The test created the board, resumed it, and completed all
three tasks. The snapshot keeps all three columns visible for illustration;
its paths and IDs have been updated to the board-specific prefix format.
The illustrative [refactor-api-controller/BOARD.md](examples/kanban/refactor-api-controller/BOARD.md)
has a separate scope and starts at `RAC-1`, with its own settings in
[refactor-api-controller/EPIC.md](examples/kanban/refactor-api-controller/EPIC.md).
It also shows how a column with two tasks is laid out: one link per cell, one
row per task.

### Boards and version control

Your instructions and applicable project instructions determine where boards
belong and whether they should be tracked in Git. Those instructions take
priority over discovered folders, including when the project keeps boards in
version control.

When the location is unspecified, the skill reuses an existing board location
or inspects the project for a suitable Git-ignored artifact folder, such as
`tmp/`, `.tmp/`, or `.temp/`. It verifies Git's ignore behavior instead of
assuming a temporary-looking name means the files are ignored. If no suitable
location exists, it uses `kanban/` at the project root and reports its ignore
status. It changes ignore rules only when instructed. Resumed boards keep
their existing location unless relocation is requested or required by project
instructions. Staging and committing follow your instructions and the project's
Git rules.

### What the skill touches

The skill is Markdown only: instructions, templates, and two reference files.
It ships no scripts, makes no network requests, and installs nothing. It asks
the agent to:

- create and edit board, epic, and ticket files only inside the `kanban` folder,
  which stays inside your project;
- treat the text of those files, and of anything they link to, as a description
  of work, not as instructions that widen what you asked for;
- record where a secret lives, never its value.

The only command it suggests is a read-only `git check-ignore`. To report a
security problem, see [`SECURITY.md`](SECURITY.md).

## Roadmap

- Native plugin marketplaces (Claude Code, Codex, Cursor) are planned. The skill
  already lives in `skills/kanban/`, the layout those plugins use.

## Development

Requires Node.js 22.20 or later.

```bash
npm install
npm run check
```

| Script                 | What it does                                                    |
| ---------------------- | --------------------------------------------------------------- |
| `npm run format`       | Formats files with Prettier.                                    |
| `npm run format:check` | Checks formatting without writing.                              |
| `npm run spell`        | Spell-checks the repo with cspell.                              |
| `npm test`             | Runs isolated validator regression tests.                       |
| `npm run validate`     | Validates the skill and test-installs it with the `skills` CLI. |
| `npm run check`        | Runs `format:check`, `spell`, `test`, and `validate`.           |

`npm run validate` checks each skill's frontmatter against the
[Agent Skills specification](https://agentskills.io/specification). It keeps
`SKILL.md` within a line and size budget, checks that local links in the
skill's Markdown files resolve inside the skill folder, and rejects invisible
Unicode characters. It also
checks that `metadata.version` matches `package.json` and the latest release in
`CHANGELOG.md`, and that the skill's license identifier matches `package.json`.
It then installs the skill into a temporary project and confirms that only the
files in `skills/kanban/` were copied and that every installed file's bytes
match the source. `npm test` uses temporary fixtures and a local CLI stub to
check validation failures and installation corruption without network access.

CI runs `npm run check` and the specification's reference validator,
[`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref),
on pushes to `main` and on pull requests.

Only `skills/kanban/` reaches users. Keep the license text in the root `LICENSE`
only, so installing multiple skills does not add a license file for each one.
Keep repo tooling outside the skill folder, and don't add a `SKILL.md` at the repo root: the
`skills` CLI would install the whole repository instead.

Add project-specific words to [`cspell.config.yaml`](cspell.config.yaml).

See [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request.

### Releasing

`npx skills add` installs from `main`, so keep `main` releasable. Until 1.0,
a minor version may change the board format; mark such entries as breaking in
the changelog and point to the conversion steps.

1. Run `npm version <version> --no-git-tag-version` to update `package.json`
   and `package-lock.json`, then set the same `metadata.version` in
   `skills/kanban/SKILL.md`.
2. In [`CHANGELOG.md`](CHANGELOG.md), move the `Unreleased` entries into a
   `## [<version>] - <YYYY-MM-DD>` section. Point `[unreleased]` at
   `compare/v<version>...HEAD` and add a `[<version>]` link reference.
3. Run `npm ci` and `npm run check`, then commit and push to `main`. Wait for CI
   to pass for that commit, including both Node.js versions and `skills-ref`.
4. Confirm that `v<version>` does not already exist. Tag the verified commit,
   push the tag, and create its GitHub release with notes from the changelog.
5. In a clean project, verify `npx skills add yuriih380/kanban#v<version>` and
   check that the installed files match `skills/kanban/` at the tagged commit.

## License

[MIT](LICENSE) © yuriih380

The license text is maintained at the repository root and is not copied into
installed skill folders. The skill declares `license: MIT` in its frontmatter.
