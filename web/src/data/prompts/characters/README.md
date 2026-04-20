# Character Prompt Sync Warning

These character prompt files are copied from src/prompts/characters to web/src/data/prompts/characters.

Do not edit files only in web/src/data/prompts/characters. Sync will overwrite them.

Use this flow:
1. Edit src/prompts/characters/*_{zh,en}.md
2. Run: cd web && npm run sync
3. Commit both source and synced changes
