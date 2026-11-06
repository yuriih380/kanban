# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/2.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-06

### Changed

- Support separately scoped boards under `kanban/<epic-slug>/`, without date
  suffixes on new folders. Identify the parent folder in board and epic headings
  and link labels.
- Store each board's name, configurable ticket prefix, and independent ticket
  counter in its `EPIC.md`. Reserve distinct prefixes across the repository,
  allow board renaming, and preserve existing IDs when prefixes change.
- Document migration of duplicate legacy IDs and update the examples to
  demonstrate two boards with independent naming and unique ticket filenames.

## [0.1.1] - 2026-10-18

### Added

- Validator regression tests run by `npm test` and `npm run check`.

### Fixed

- Installation validation now checks every copied file's bytes as well as
  file names, rejecting changed content and missing or extra files.

### Changed

- Keep license text only in the root `LICENSE`; remove the bundled
  `skills/kanban/LICENSE.txt` to avoid duplicate license files across installed
  skills. Update validation, regression tests, and installation documentation.

## [0.1.0] - 2026-10-05

### Added

- `kanban` skill: splits an epic or story into small subtasks and keeps a
  Markdown Kanban board (`BOARD.md`, `EPIC.md`, one file per task) under
  `.temp/kanban/`.
- Installation through the [`skills` CLI](https://github.com/vercel-labs/skills)
  with `npx skills add yuriih380/kanban`.
- Agent Skills frontmatter metadata: `license`, `metadata.author`, and
  `metadata.version`.
- `LICENSE.txt` inside the skill folder, so installed copies keep the MIT
  notice.
- Prettier, cspell, and a skill validator that installs the skill with the
  `skills` CLI, all run by `npm run check` and in CI.
- A README example with linked board, epic, task files, and a short guide from
  a clean-install workflow test in Codex desktop on Windows.

[unreleased]: https://github.com/yuriih380/kanban/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/yuriih380/kanban/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/yuriih380/kanban/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/yuriih380/kanban/releases/tag/v0.1.0
