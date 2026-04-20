# Ignis Tavern Web

Web version of Ignis Tavern (Next.js app router).

This version keeps the same narrative core as the Skill version, but moves critical mechanics to deterministic front-end/state logic:

- interactive dice checks (state machine)
- structured state tags (`[CHAR:...]`) parsed into game state
- right-side character sheet synchronized from parsed state
- inline event cards for HP/items/skills/XP

## Local Development

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000

## Scripts

- `npm run sync`
	- syncs shared data from `../src` and `../assets`
	- runs local consistency checks (must pass)
- `npm run check:consistency`
	- validates local consistency only (no copy)
- `npm run dev`
	- `sync` then starts Next dev server
- `npm run build`
	- `sync` then builds production bundle

## Local Consistency Guard

The local guard is implemented in `scripts/check-consistency.js` and currently checks:

1. `src/prompts/web_dm_rules_{zh,en}.md` equals `web/src/data/prompts/web_dm_rules_{zh,en}.md`
2. NPC dialogue files are paired as `_zh.md` + `_en.md` in both:
	 - `src/npc/**/dialogue/`
	 - `web/src/data/npc/**/dialogue/`
3. legacy dialogue filenames without language suffix are rejected

If the guard fails, fix issues first, then rerun:

```bash
npm run check:consistency
```

## Data Source Rules

- Single source for Web DM rules: `src/prompts/web_dm_rules_zh.md` and `src/prompts/web_dm_rules_en.md`
- `web/src/data/` is generated/synced local runtime data
- shared scenes/rules/npc are synced from repository root `src/`

## Key Files

- `src/app/game/page.tsx` - main game loop UI + message handling
- `src/lib/gameState.ts` - reducer + state model
- `src/lib/diceMachine.ts` - dice parsing and result formatting
- `src/lib/storage.ts` - local save/load
- `src/lib/agents/gm.ts` - GM prompt composition
- `scripts/sync-skill.js` - source-to-web sync
- `scripts/check-consistency.js` - local gate checks

## Known Note

`next lint` may fail due to existing Next/ESLint compatibility in this repository setup. The local workflow for this project prioritizes `sync + check:consistency` as the gate.
