# refactor-api-controller/EPIC.md — Refactor API controller

Board name: Refactor API Controller
Ticket prefix: RAC
Previous prefixes: None
Next ticket number: 3
Created: 06-11-2026 | Updated: 11-11-2026

[refactor-api-controller/BOARD.md](BOARD.md)

## Goal

Separate request validation from the API controller's request handling.

## Scope

Extract validation and verify that request handling behavior is preserved.
Documentation work belongs to the separate quick-start-guide board.

## Acceptance criteria

- The controller delegates validation to a dedicated function.
- Tests cover valid and invalid requests with unchanged responses.

## Notes

This is an illustrative planning example, not an implemented API in this repository.
Its RAC prefix and numbering are independent of the quick-start-guide board, which uses QSG.
