---
name: kanban
description: Split a large task, epic, or story into small actionable subtasks and maintain a minimal local Markdown Kanban board. Use when asked to create, update, or resume a local Kanban board.
license: MIT
metadata:
  author: "yuriih380"
  version: "0.1.0"
---

# Kanban

Keep a compact `BOARD.md` per task, epic, or story, shared context in `EPIC.md`, and one Markdown file per subtask. Each task file owns its status; the board is a linked overview derived from those statuses.

## Location

Use the user's requested board location or the applicable project's artifact-storage convention. Otherwise, default to `.temp/kanban/`. Resolve relative paths from the project root, or the working directory when no project is established. When resuming, use the existing board directory.

Always name the board file exactly `BOARD.md`. Default layout:

```text
.temp/kanban/<task-slug>-<DD-MM-YYYY>/
  BOARD.md
  EPIC.md
  TSK-01.md
  TSK-02.md
```

Use a short lowercase kebab-case title and the user's local creation date. Create missing directories. Keep the original folder name when resuming on another day. If several existing boards could match, ask which one. For a different task with the same slug and date, add a numeric suffix to the slug. Keep the date last.

## Create a board

1. Extract the goal, scope, and acceptance criteria from the request and relevant context into `EPIC.md`, with shared notes and source links when available. Ask for the task if none is supplied or inferable. Record consequential unknowns rather than inventing requirements.
2. Split the work into the smallest useful set of independently verifiable outcomes. Each subtask should be narrow enough to finish in one focused work session. Preserve supplied stages and acceptance criteria; include verification in the affected subtasks.
3. Assign stable IDs (`TSK-01`, `TSK-02`, ...), action-oriented titles, concrete scope, and observable completion conditions. Record dependencies by ID only when needed. Order ready work first.
4. Write each subtask to `<ID>.md` using the task template below. Start new work in `TODO`. Reflect existing progress only when supported by evidence. Apply the scope rules below when selecting tasks for the board. Place each included task link in the column matching its task-file status. Keep task details, dependencies, blockers, and evidence in the task file.
5. Return a link to the board and identify the next ready item. Creating a board is a planning action; execute subtasks only when execution is part of the user's request.

## Maintain a board

- Read `EPIC.md` and `BOARD.md`, then the task files and dependencies relevant to selecting or updating work. Follow links to recorded scope decisions when needed. Apply those decisions when choosing the next item.
- Use exactly three statuses: `TODO`, `IN PROGRESS`, and `DONE`. Store one `Status:` field in each task file. If the board and task files disagree, correct the board from the task files. Change the task status before moving its board link to the matching column.
- Prefer one active item at a time. Start a task only after its dependencies are done. Keep blocked work in its current status and add `Blocked by: <reason and next action>` to its task file; blocking is a note, not a fourth status.
- Update progress when work starts, finishes, or encounters a blocker. Mark an item `DONE` only after its completion conditions are met, and append concise evidence such as a check result or artifact link. Never invent a successful check.
- Preserve IDs and user-written context when editing. Allocate new IDs when splitting or adding work. Repair dependencies when replacing an item.
- For permissions, Git operations, and stage boundaries, follow applicable project instructions and the user's current instructions.
- For routine progress updates, check the affected task files and their board entries for status agreement, unique board links, and valid links before returning.
- When creating, resuming, or converting a board, or changing task structure, scope, or dependencies, run a full consistency check: each task has exactly one file; each included task has exactly one board link in its matching status column; excluded tasks have context or backlog links instead of board entries; all task links resolve; every dependency exists; dependencies have no cycles; completed items include evidence.

Update `Updated` on changed files. Report the next ready item or blocker. When every included task is done, report completion of the current scope. Mention any remaining deferred or removed work separately.

## Scope changes

A task's status records execution progress. Scope decisions determine which tasks belong on the board. Keep these concepts separate to prevent excluded work from being selected again.

- Record an agreed deferral or removal in the task's `Notes`, including the decision date and reason. Preserve the task file, ID, and progress status. Scope removal alone cannot make unfinished work `DONE`.
- Remove excluded tasks from the board columns. Keep their links in `EPIC.md` or an existing backlog linked from `EPIC.md`. Exclude them from task selection and completion of the current scope. Restore them only when the user includes them in scope again.
- Preserve dependencies on excluded tasks while their required outcomes remain unmet. Keep dependent tasks blocked until those outcomes are verified or the dependency is explicitly revised. Scope exclusion does not satisfy a dependency.

## Convert an existing board

1. Preserve IDs and task content in the corresponding task files. Preserve shared context in `EPIC.md`.
2. Keep statuses that already use the permitted values. For unsupported statuses, use `TODO` when work has not started. Use `IN PROGRESS` when work has started but remains incomplete. Use `DONE` only when evidence verifies completion. Preserve the original status and any blocker or scope decision in task notes. Ask for clarification before converting a status when the available evidence leaves its meaning ambiguous.
3. Apply the scope rules above when rebuilding the board. Repair affected links when file names or locations change.

## Board template

```markdown
# <Task, epic, or story title>

Created: <DD-MM-YYYY> | Updated: <DD-MM-YYYY>

[Goal, acceptance criteria, and notes](EPIC.md)

| TODO | IN PROGRESS | DONE |
| --- | --- | --- |
| [TSK-01 — <Short title>](TSK-01.md) | | |
```

## Task template

```markdown
# TSK-01 — <Action and outcome>

Status: TODO
Created: <DD-MM-YYYY> | Updated: <DD-MM-YYYY>

[Board](BOARD.md) | [Epic context](EPIC.md)

- Scope: <Concrete change or deliverable.>
- Done when: <Observable result and relevant verification.>
- Depends on: <IDs; omit this line if independent.>

## Notes

<Task-specific questions, blockers, decisions, or completion evidence; omit if none.>
```
