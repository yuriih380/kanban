# Converting an existing board

Read this when converting a board that this skill did not create, or one that uses an older format such as `TSK-01` ticket IDs. The location, identity, and scope rules in `SKILL.md` still apply. Never overwrite a file or leave duplicate IDs.

## 1. Assign prefixes and IDs

- Inventory the repository's boards and assign each an available board-specific prefix.
- Preserve unique legacy IDs (including `TSK-01`) and task content. Reserve legacy prefixes against new use and record them in the relevant epic's history.
- Multiple legacy boards may retain the same historical prefix only where their full IDs are distinct; none may allocate new tickets under that shared prefix.
- If full IDs collide, assign fresh IDs under each affected board's new prefix, recording each old board path and ID in the ticket notes.
- Initialize each board's counter above existing numbers under its current and previous prefixes, and advance it for migrated tickets.

## 2. Repair references

- Repair filenames, headings, board links, dependencies, and other local references by old path, not by a global text replacement.
- Ask which ticket an ambiguous bare-ID reference means.
- Preserve shared context in each `EPIC.md`.

## 3. Map statuses

- Keep statuses that already use `TODO`, `IN PROGRESS`, or `DONE`.
- For other statuses, use `TODO` when work has not started, `IN PROGRESS` when work has started but remains incomplete, and `DONE` only when evidence verifies completion.
- Preserve the original status and any blocker or scope decision in task notes.
- Ask for clarification before converting a status when the available evidence leaves its meaning ambiguous.

## 4. Rebuild the board

- Apply the scope rules from `SKILL.md` when rebuilding the board.
- Keep existing folders unless relocation is requested or required by applicable instructions; choose any new location using the location rules in `SKILL.md`.
- When moving a board, repair affected links and parent-folder labels.
- Finish with the full consistency check from `SKILL.md`.
