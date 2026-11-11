# Contributing

Thanks for helping improve the skill. Bug reports and small, focused pull
requests are the most useful contributions.

## Before you open a pull request

1. Use Node.js 22.20 or later, then install and run the checks:

   ```bash
   npm ci
   npm run check
   ```

2. For a change to the skill's behavior, open an issue first and describe the
   request that goes wrong and the board you expected.
3. Add your change to the `Unreleased` section of [`CHANGELOG.md`](CHANGELOG.md).
   Leave version numbers alone; the maintainer sets them at release time.

## Rules for the skill folder

- Only `skills/kanban/` reaches users. Keep tooling, tests, and examples
  outside it.
- Keep the skill Markdown-only: no scripts, no network access, no instructions
  to install anything.
- Keep `SKILL.md` to the common paths. Rarely needed rules go in
  `skills/kanban/references/`, one level deep, behind a pointer that says when
  to read them.
- Use only the frontmatter fields from the
  [Agent Skills specification](https://agentskills.io/specification).

## Security issues

Report them privately as described in [`SECURITY.md`](SECURITY.md).
