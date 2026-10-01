# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-28

### Added

- `kanban` skill: splits an epic or story into small subtasks and keeps a
  Markdown Kanban board (`BOARD.md`, `EPIC.md`, one file per task) under
  `.temp/kanban/`.
- Installation through the [`skills` CLI](https://github.com/vercel-labs/skills)
  with `npx skills add yuriih380/kanban-skill`.
- Agent Skills frontmatter metadata: `license`, `metadata.author`, and
  `metadata.version`.
- `LICENSE.txt` inside the skill folder, so installed copies keep the MIT
  notice.
- Prettier, cspell, and a skill validator that installs the skill with the
  `skills` CLI, all run by `npm run check` and in CI.

[unreleased]: https://github.com/yuriih380/kanban-skill/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yuriih380/kanban-skill/releases/tag/v0.1.0
