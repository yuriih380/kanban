# Renaming boards, changing prefixes, and moving tickets

Read this before renaming a board or its folder, changing a ticket prefix, or moving a ticket between boards. The allocation and prefix-reservation rules in `SKILL.md` still apply.

## Rename a board

- Update the board name in `EPIC.md` and in the board and epic headings.
- Keep the current prefix unless the user also requests a prefix change.
- Keep the folder unless the user requests a folder rename too; then repair affected paths and folder labels.

## Change a prefix

- Check that the new prefix is available, as for a new board.
- Apply the new prefix to future tickets only, continuing that board's sequence. For example, after `RAC-2`, a requested prefix change to `API` produces `API-3`.
- Record the old prefix in `Previous prefixes`; it stays reserved.
- Preserve existing filenames, IDs, dependencies, and links.

## Move a ticket between boards

- Preserve the ticket's ID and move its file instead of copying it.
- Update board entries, scope context, and affected links on both boards.
- The source board retains its prefix reservation and counter.

After any of these changes, run the full consistency check from `SKILL.md`.
