---
name: kanban
description: Split tasks, epics, or stories into actionable subtasks and maintain local Markdown Kanban boards with separate scopes and board-specific ticket prefixes. Use when asked to create, update, or resume local Kanban boards.
license: MIT
metadata:
  author: "yuriih380"
  version: "0.2.1"
---

# Kanban

Keep a compact `BOARD.md` per epic or scope, shared context in its `EPIC.md`, and one Markdown file per task or story. Each task file owns its status; the board is a linked overview derived from those statuses. The project is the repository where the user works. Each board has its own name, ticket prefix, numbering, and scope; no separate project metadata file is needed.

## Location

Keep `kanban` as the master folder. Resolve relative paths from the project root, or the working directory when no project is established. Choose its location in this order:

1. Read the user's current instructions and applicable project instructions (for example, `AGENTS.md`) for board locations, artifact storage, and Git tracking. Follow those instructions before inferring a convention from the filesystem. If boards should be tracked in Git, choose the prescribed location or a suitable non-ignored location; do not prefer ignored storage over that requirement.
2. When instructions leave the location open, reuse the project's existing master folder. When resuming, keep the existing board directory, including legacy locations, unless relocation is requested or required by applicable instructions.
3. Otherwise inspect the project's structure, including hidden directories and Git ignore rules, for a suitable local-artifact folder such as `tmp/`, `.tmp/`, or `.temp/`. Prefer an existing or configured Git-ignored artifact folder when one is available. Verify that the intended board files are actually ignored with Git (for example, `git check-ignore -v -- <board-file>`); a folder's name alone is not evidence. Avoid dependency, build-output, or cache directories that tools overwrite or routinely clean.
4. If no suitable location is prescribed or found, use `kanban/` at the project root (or working directory outside a project). Do not create a temporary-folder convention or change ignore rules merely to hide the board. Change ignore rules only when requested or required by applicable instructions.

Use one master folder for new boards and report the chosen path and whether it is Git-ignored. For Git operations, follow the user's and project's instructions.

Each board has its own lowercase kebab-case epic folder, without a date suffix. Always name its board and context files exactly `BOARD.md` and `EPIC.md`. Derive ticket prefixes from board names, for example Refactor API Controller → `RAC` and Improve API Docs → `IAD`:

```text
<chosen-parent>/kanban/
  refactor-api-controller/
    BOARD.md
    EPIC.md
    RAC-1.md
    RAC-2.md
  improve-api-docs/
    BOARD.md
    EPIC.md
    IAD-1.md
```

Create missing directories. Reuse a folder only for the same scope; for a distinct epic with the same slug, choose a more descriptive slug or append a numeric suffix. Keep existing folder names when resuming. Identify `EPIC.md` and `BOARD.md` by their parent folder in headings and link labels (for example, `refactor-api-controller/EPIC.md`), including links returned to the user. If several boards could match the request, ask which one before changing or selecting work.

## Board identity and ticket IDs

Store the board name, active ticket prefix, previous prefixes, and next ticket number in that board's `EPIC.md` using the template below. Start each new board at `1`; distinct prefixes make full ticket IDs and filenames unique throughout the repository.

- Use the user's chosen board name, or infer a descriptive name from the epic or scope and state the choice. The user may choose or change the board name and ticket prefix at any time. Do not derive them from the repository name.
- Accept a user-chosen prefix matching `[A-Z][A-Z0-9]*`. Otherwise derive uppercase initials from the board's words, treating spaces and dashes as separators (Refactor API Controller → `RAC`), or the first three letters of a single word (Documentation → `DOC`). Use available letters for shorter names; ask for a prefix if no Latin letters can be derived.
- Before assigning or changing a prefix, inspect the repository's existing boards, including archived boards, their current and previous prefixes, and ticket files. Do not reuse a prefix reserved by another board. If a derived prefix collides, append the smallest available numeric suffix (`RAC2`, `RAC3`, ...); if the user's explicit prefix collides, explain the conflict and ask for an alternative. Keep a board's prefix history and counter in its `EPIC.md` when retiring it, even if its ticket files are removed.
- Allocate `<PREFIX>-<number>` IDs without zero padding, using the board's increasing sequence for both tasks and stories. Before allocation, read its `EPIC.md` and check existing IDs under its current and previous prefixes throughout the repository, including excluded, archived, or moved tickets. Use the greater of `Next ticket number` and one above their largest numeric suffix, then advance the board's counter past every allocated number. Never reuse numbers after deletion. If metadata is missing, initialize it from existing tickets and recorded history; ask for missing history if safe allocation cannot be established.
- Serialize prefix reservation across the repository and ticket allocation within each board. Re-read metadata immediately before reserving, update the relevant `EPIC.md` before writing tickets, and avoid concurrent reservations by separate agents or sessions. Gaps after interrupted writes are acceptable. A conflicting edit requires re-reading and choosing fresh IDs.
- A board rename updates its name in `EPIC.md` and the board and epic headings. Keep the current prefix unless the user also requests a prefix change. A changed prefix applies to future tickets using that board's continuing sequence; record the old prefix in `Previous prefixes`. For example, after `RAC-2`, a requested prefix change to `API` produces `API-3`. Preserve existing filenames, IDs, dependencies, and links. Keep the folder unless the user requests a folder rename too; then repair affected paths and folder labels.
- Every ID identifies exactly one ticket file across the repository. Moving a ticket between boards preserves its ID and moves its file instead of copying it; update board entries, scope context, and affected links. The source board retains its prefix reservation and counter. For dependencies across boards, include the ID and a relative link to the owning file. A completed board does not imply that other boards are complete.

## Create a board

1. Resolve the board name and epic folder, choose an available prefix, and initialize its identity fields in `EPIC.md`. Extract the goal, scope, and acceptance criteria into that file, with shared notes and source links when available. Ask for the task if none is supplied or inferable. Record consequential unknowns rather than inventing requirements. Keep each board's scope and backlog in its own epic context.
2. Split the work into the smallest useful set of independently verifiable outcomes. Each subtask should be narrow enough to finish in one focused work session. Preserve supplied stages and acceptance criteria; include verification in the affected subtasks.
3. Allocate stable IDs using the board's prefix and counter, action-oriented titles, concrete scope, and observable completion conditions. Record dependencies only when needed. Order ready work first.
4. Write each subtask to `<ID>.md` using the task template below. Start new work in `TODO`. Reflect existing progress only when supported by evidence. Apply the scope rules below when selecting tasks for the board. Place each included task link in the column matching its task-file status. Keep task details, dependencies, blockers, and evidence in the task file.
5. Return a link to the board and identify the next ready item. Creating a board is a planning action; execute subtasks only when execution is part of the user's request.

## Maintain a board

- Resolve the requested board, read its `EPIC.md` and `BOARD.md`, then the task files and dependencies relevant to selecting or updating work. Follow links to recorded scope decisions when needed. Apply those decisions when choosing the next item. Do not select work from another board unless requested; read cross-board dependencies to check readiness.
- Use exactly three statuses: `TODO`, `IN PROGRESS`, and `DONE`. Store one `Status:` field in each task file. If the board and task files disagree, correct the board from the task files. Change the task status before moving its board link to the matching column.
- Prefer one active item at a time per board. Start a task only after its dependencies are done. Keep blocked work in its current status and add `Blocked by: <reason and next action>` to its task file; blocking is a note, not a fourth status.
- Update progress when work starts, finishes, or encounters a blocker. Mark an item `DONE` only after its completion conditions are met, and append concise evidence such as a check result or artifact link. Never invent a successful check.
- Preserve IDs and user-written context when editing. Allocate new IDs when splitting or adding work. Repair dependencies when replacing an item.
- For permissions, Git operations, and stage boundaries, follow applicable project instructions and the user's current instructions.
- For routine progress updates, check the affected task files and their board entries for status agreement, unique board links, and valid links before returning.
- When creating, resuming, or converting a board, or changing task structure, scope, or dependencies, run a full consistency check: full IDs are unique across the repository's boards, the board's active prefix is not reserved by another board, and its counter exceeds all numbers allocated under its prefixes; each task has exactly one file; each included task has exactly one board link in its matching status column; excluded tasks have context or backlog links instead of board entries; all task links resolve; every dependency exists, including across boards; dependencies have no cycles; completed items include evidence. Check changed folder labels too.

Update `Updated` on changed files. Report the next ready item or blocker. When every included task is done, report completion of the current scope. Mention any remaining deferred or removed work separately.

## Scope changes

A task's status records execution progress. Scope decisions determine which tasks belong on the board. Keep these concepts separate to prevent excluded work from being selected again.

- Record an agreed deferral or removal in the task's `Notes`, including the decision date and reason. Preserve the task file, ID, and progress status. Scope removal alone cannot make unfinished work `DONE`.
- Remove excluded tasks from the board columns. Keep their links in `EPIC.md` or an existing backlog linked from `EPIC.md`. Exclude them from task selection and completion of the current scope. Restore them only when the user includes them in scope again.
- Preserve dependencies on excluded tasks while their required outcomes remain unmet. Keep dependent tasks blocked until those outcomes are verified or the dependency is explicitly revised. Scope exclusion does not satisfy a dependency.

## Convert an existing board

1. Inventory the repository's boards and assign each an available board-specific prefix. Preserve unique legacy IDs (including `TSK-01`) and task content; reserve legacy prefixes against new use and record them in the relevant epic's history. Multiple legacy boards may retain the same historical prefix only where their full IDs are distinct; none may allocate new tickets under that shared prefix. If full IDs collide, assign fresh IDs under each affected board's new prefix, recording each old board path and ID in the ticket notes. Repair filenames, headings, board links, dependencies, and other local references by old path, not a global text replacement. Ask which ticket an ambiguous bare-ID reference means. Never overwrite a file or leave duplicate IDs. Initialize each board's counter above existing numbers under its current and previous prefixes and advance it for migrated tickets. Preserve shared context in each `EPIC.md`.
2. Keep statuses that already use the permitted values. For unsupported statuses, use `TODO` when work has not started. Use `IN PROGRESS` when work has started but remains incomplete. Use `DONE` only when evidence verifies completion. Preserve the original status and any blocker or scope decision in task notes. Ask for clarification before converting a status when the available evidence leaves its meaning ambiguous.
3. Apply the scope rules above when rebuilding the board. Keep existing folders unless relocation is requested or required by applicable instructions; choose any new location using the location rules above. When moving a board, repair affected links and parent-folder labels.

## Epic template

Use the user's local dates throughout. Keep board identity and allocation metadata in `EPIC.md` only.

```markdown
# <epic-slug>/EPIC.md — <Epic title>

Board name: <User-chosen board name>
Ticket prefix: <PREFIX>
Previous prefixes: <None, or previously used prefixes>
Next ticket number: <Next unallocated positive integer>
Created: <DD-MM-YYYY> | Updated: <DD-MM-YYYY>

[<epic-slug>/BOARD.md](BOARD.md)

## Goal

<Desired outcome.>

## Scope

<Included work and boundaries specific to this board.>

## Acceptance criteria

- <Observable outcome.>

## Notes

<Shared decisions, source links, and links to deferred or removed tickets; omit if none.>
```

## Board template

```markdown
# <epic-slug>/BOARD.md — <Epic title>

Created: <DD-MM-YYYY> | Updated: <DD-MM-YYYY>

[<epic-slug>/EPIC.md — goal, scope, and notes](EPIC.md)

| TODO | IN PROGRESS | DONE |
| --- | --- | --- |
| [<PREFIX>-<number> — <Short title>](<PREFIX>-<number>.md) | | |
```

## Task template

```markdown
# <PREFIX>-<number> — <Action and outcome>

Status: TODO
Created: <DD-MM-YYYY> | Updated: <DD-MM-YYYY>

[<epic-slug>/BOARD.md](BOARD.md) | [<epic-slug>/EPIC.md](EPIC.md)

- Scope: <Concrete change or deliverable.>
- Done when: <Observable result and relevant verification.>
- Depends on: <IDs; omit this line if independent.>

## Notes

<Task-specific questions, blockers, decisions, or completion evidence; omit if none.>
```
