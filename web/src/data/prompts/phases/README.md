# Phase Prompt Sync Warning

These phase prompt files are copied from src/prompts/phases to web/src/data/prompts/phases.

Do not edit files only in web/src/data/prompts/phases. Sync will overwrite them.

Use this flow:
1. Edit src/prompts/phases/*_{zh,en}.md
2. Run: cd web && npm run sync
3. Commit both source and synced changes
