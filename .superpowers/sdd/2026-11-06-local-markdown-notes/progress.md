# SDD ledger — plan: docs/superpowers/plans/2026-11-06-local-markdown-notes.md

Task 0: in progress; gate blocked before implementation.
- Repository: `local-markdown-notes/`, dedicated Git repository created at user direction.
- Branch: `task0/runtime-gate` (non-main).
- Initial baseline commit: `61eb10ac47f9099902cd11290daae596525f2639` (`chore: establish Task 0 baseline`).
- Initial status after baseline cleanup: clean (`## task0/runtime-gate`).
- Read approved design spec and implementation plan.
- Host Inspect returned directoryPicker, fs, subprocess, storage, storageDomain signatures. Actual installed package READMEs read for fs-local, host-directory-picker-auto, subprocess-local, storage-json, storage-domain.
- Client Inspect (`Slots.listSubTree`, `Theme.listTokens`, `Service.listService`) each timed out after 10s with instruction to open/reconnect Harness page. Cannot establish the currently live slot contracts, locale API, or theme tokens. Per Gate 0 stop condition, no bundle install, executable logic, picker/filesystem/subprocess runtime test, or Task 1 work was performed.
- Task 0 is not complete; no business/editor functionality was created.
