# Security policy

## Supported versions

Only the latest release receives fixes. `npx skills add yuriih380/kanban`
installs the latest commit on `main`.

## What the skill does

The skill is a single Markdown instruction file with Markdown references. It
ships no scripts, makes no network requests, and asks the agent to write only
inside the project's `kanban` folder.

Reports are welcome for anything that breaks those properties, for example:

- instructions that lead an agent to write or delete files outside the board
  folder;
- instructions that lead an agent to follow text found in board, epic, or task
  files as if it came from the user;
- a release whose installed files differ from `skills/kanban/` at its tag.

## Reporting a vulnerability

Please report privately through
[GitHub's vulnerability reporting form](https://github.com/yuriih380/kanban/security/advisories/new)
instead of opening a public issue. Include the skill version, the agent you
used, and the steps that reproduce the problem.

This project has one maintainer. Expect a first reply within a week.
