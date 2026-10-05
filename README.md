# kanban

An [Agent Skill](https://agentskills.io) that splits a large task, epic, or
story into small, verifiable subtasks and tracks them on a minimal Markdown
Kanban board inside your project.

It works with any agent that supports Agent Skills, including Claude Code,
Codex, Cursor, GitHub Copilot, Gemini CLI, and OpenCode.

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
| Install a specific release             | `npx skills add yuriih380/kanban#v0.1.0`                 |
| Preview without installing             | `npx skills add yuriih380/kanban --list`                 |
| Update                                 | `npx skills update kanban`                               |
| Remove                                 | `npx skills remove kanban` (add `-g` for a user install) |

Without a tag, the CLI installs the latest commit on `main`. An install pinned
to a tag stays on that tag when you run `update`; add the skill again without
the tag, or with a newer one, to move forward.

To install by hand, copy [`skills/kanban/`](skills/kanban/) into your agent's
skills folder, for example `.agents/skills/kanban/` or `.claude/skills/kanban/`.

## Usage

Ask your agent in plain language, for example:

- "Break the payment refactor into a Kanban board."
- "Resume the Kanban board and pick up the next task."
- "Mark TSK-03 done; the tests pass."
- "Convert our existing board to the Kanban skill format."

The skill keeps each board in its own folder:

```text
.temp/kanban/<task-slug>-<DD-MM-YYYY>/
  BOARD.md    TODO | IN PROGRESS | DONE table linking each in-scope task
  EPIC.md     goal, scope, acceptance criteria, and shared notes
  TSK-01.md   one file per subtask; the file owns its status
  TSK-02.md
```

How it works:

- Each task file holds the task's status, and the board is rebuilt from those
  statuses when they disagree.
- A task moves to `DONE` only with evidence, such as a passing check.
- Blocked work keeps its status and gains a `Blocked by:` note.
- Deferred or removed tasks leave the board but keep their files and IDs.

See [`skills/kanban/SKILL.md`](skills/kanban/SKILL.md) for the full rules and
templates.

### Example

Ask: "Prepare a quick-start guide. Explain the output files, add the installation
command, and check the guide's links. Track the work on a Kanban board."

After completing the first task and resuming the next one, the board looks like this:

| TODO                                                                   | IN PROGRESS                                                                   | DONE                                                                      |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [TSK-03 — Check the guide links](examples/quick-start-guide/TSK-03.md) | [TSK-02 — Add the installation command](examples/quick-start-guide/TSK-02.md) | [TSK-01 — Explain the output files](examples/quick-start-guide/TSK-01.md) |

Open the [example board](examples/quick-start-guide/BOARD.md) and its
[EPIC.md](examples/quick-start-guide/EPIC.md) to see the goal and completion
conditions. Each linked task file records its own status, scope, dependencies,
and verification evidence. The completed task produced a
[short guide](examples/quick-start-guide/GETTING_STARTED.md).

This is an intermediate snapshot from a clean installation tested in Codex
desktop on Windows. The test created the board, resumed it, and completed all
three tasks. The snapshot keeps all three columns visible for illustration.

### Boards and version control

Boards live under `.temp/` in your project. Add `.temp/` to your `.gitignore` to
keep them local, or commit them to share progress with your team. For Git
operations the skill follows your project's instructions.

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
| `npm run validate`     | Validates the skill and test-installs it with the `skills` CLI. |
| `npm run check`        | Runs `format:check`, `spell`, and `validate`.                   |

`npm run validate` checks each skill's frontmatter against the
[Agent Skills specification](https://agentskills.io/specification). It also
checks that `metadata.version` matches `package.json` and the latest release in
`CHANGELOG.md`, and that the skill's `LICENSE.txt` matches the root `LICENSE`.
It then installs the skill into a temporary project and confirms that only the
files in `skills/kanban/` were copied.

CI runs `npm run check` and the specification's reference validator,
[`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref),
on pushes to `main` and on pull requests.

Only `skills/kanban/` reaches users, so it carries its own copy of the license.
Keep repo tooling outside it, and don't add a `SKILL.md` at the repo root: the
`skills` CLI would install the whole repository instead.

Add project-specific words to [`cspell.config.yaml`](cspell.config.yaml).

### Releasing

`npx skills add` installs from `main`, so keep `main` releasable.

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
