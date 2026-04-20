# Prompt Sync Warning

WARNING: Files in this folder are the source of truth and are copied into web/src/data/prompts by web/scripts/sync-skill.js.

Do not edit prompt files directly under web/src/data/prompts. Those changes will be overwritten on the next sync/dev/build.

Editing rule:
- Edit source files in src/prompts/** first.
- Then run: cd web && npm run sync
- Commit both source changes and synced web/src/data/** changes together.

Quick check:
- If you changed only web/src/data/prompts/**, your changes are not durable.

Known preserved web-specific files:
- web/src/data/prompts/phases/character_creation_zh.md
- web/src/data/prompts/phases/character_creation_en.md

These are intentionally preserved during sync to keep Web UI-driven character creation prompts.
