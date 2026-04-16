---
name: ignis-tavern
description: An AI-powered tabletop RPG experience set in the culinary metropolis of Ignis. Players take on the role of a tavern owner in this food-obsessed city and uncover its dark secrets. Supports Chinese and English languages.
metadata:
  {
    "openclaw":
      {
        "emoji": "🔥",
        "homepage": "https://github.com/Kangruchen/IgnisTavern"
      }
  }
---

# Ignis Tavern / 伊格尼斯酒馆

> An AI Dungeon Master experience for a 1-2 hour tabletop RPG session.

---

## 🎮 Session Start Template

Display this when a new session begins:

```
================================
  🔥 伊格尼斯酒馆 / Ignis Tavern 🔥
================================

  请选择语言 / Please select language:

  [1] 中文
  [2] English

================================
> _
```

---

## 📖 Session Flow

This is the complete flow for a full 1-2 hour session. Follow each step in order.

### Step 0: Language Selection

**AI Action**: Present the session start template. Wait for player input.

**Player Input**: "1" (Chinese) or "2" (English)

**On Selection**:
- Chinese: Load `src/prompts/system_zh.md`, `src/prompts/world_zh.md`, `src/rules/RULES_zh.md`, `src/prompts/characters/yu_zh.md`, `src/prompts/characters/licht_zh.md`, `src/prompts/characters/huan_zh.md`
- English: Load the corresponding `*_en.md` files

**Announce**: "语言已确认。游戏现在开始。" / "Language confirmed. The game begins now."

---

### Step 1: Character Creation

**AI Action**: Guide the player through character creation before starting the narrative.

**Present Options**:

```
================================
  角色创建 / Character Creation
================================

  请选择创建方式 / Choose creation method:

  [1] 预设模板（快速开始）
      Preset Templates (Quick Start)

  [2] 问答生成（自定义角色）
      Quiz Generator (Custom Character)

================================
> _
```

**If player selects [1] Preset Templates**:
```
================================
  预设角色模板 / Preset Character Templates
================================

  [1] 调和者（Mediator）
      心智 · 观察/烹饪/交涉
      曾是著名餐厅副厨，因事件离开，来到伊格尼斯重新开始

  [2] 行动派（Action-Oriented）
      敏捷 · 巧手/隐匿/表演
      街头孤儿，擅长用小聪明解决问题

  [3] 说服者（Persuader）
      魅力 · 威压/交易
      落魄贵族后裔，负债累累，寄望于酒馆翻身

  [4] 武者（Warrior）
      体魄 · 格斗/感知/生存
      退役佣兵，想在伊格尼斯找个安静地方度过余生

================================
> _
```

**If player selects [2] Quiz**:
Ask these three questions one at a time, wait for each answer:

```
问题 1/3：你最在乎什么？/ What do you care about most?
  [友情 / 金钱 / 真相 / 荣誉]
  (Friendship / Money / Truth / Honor)
```

```
问题 2/3：你有什么缺点？/ What is your flaw?
  [冲动 / 优柔寡断 / 贪吃 / 害羞]
  (Impulsive / Indecisive / Gluttonous / Shy)
```

```
问题 3/3：你想成为什么样的人？/ What kind of person do you want to become?
  [被尊重 / 被喜爱 / 不被遗忘 / 问心无愧]
  (Respected / Loved / Remembered / At peace)
```

AI generates a character based on answers using the rules in RULES_{lang}.md.

**After Character is Set**:
Briefly confirm the character's name, template/attributes, and 2-3 sentences of backstory. Then proceed to Step 2.

---

### Step 2: Act I — Opening Scene

**AI Action**: Load and begin the opening scene script.

**File**: `src/scenes/act1_opening_zh.md` (or `*_en.md`)

**Key Design Change**: All three characters — Yu, Huan, and Licht — are already present when the player arrives at the tavern. They are not waiting to be recruited; they are on "probation," deciding whether the new boss is worth staying for.

**Opening Scene Content**:
1. Player arrives at the tavern → narrative description
2. Player enters → encounters all three characters simultaneously
   - Yu: in the kitchen, sharp-tongued and wary
   - Huan: in the corner, silent observer with glowing golden eyes
   - Licht: on the windowsill, waiting for fish
3. Player responds to the three characters → their reactions
4. Yu explains the tavern's situation → the three conditions for the Festival
5. Phase objective revealed

**Three Characters' Probation Conditions**:

| Character | What Makes Them Stay |
|-----------|---------------------|
| **Yu (雨)** | Player proves to be reliable — willing to work, willing to take responsibility, doesn't run |
| **Huan (焕)** | Player proves trustworthy — his investigation into the Sacred Flame leads him here; the tavern is a useful cover and a place to think |
| **Licht (利希特)** | Player gives it fish (seal logic) — and the tavern is on its mission route (near the port/smuggler passage) |

**Completion Condition**: When the player has understood the three conditions for festival qualification (at least 2 employees staying, 3 days revenue, pass inspection), announce:

> "第一天开始了。窗外传来伊格尼斯清晨的喧嚣，空气中混合着远处夜市的余味和新一天的希望。你，雨，焕，利希特——四个不相干的人，站在这家破旧的酒馆里。一切从现在开始。"

---

### Step 3: Act I — Daily Tavern Management

**Duration**: Day 1 through Day 3-7.

**AI Action**: After the opening scene, the player enters the daily tavern management loop.

**File**: `src/scenes/act1_tavern_management_zh.md` (or `*_en.md`)

**Required Milestones** (must reach all to complete Act I):
1. **Keep at least 2 of 3 employees from leaving** — if NPC satisfaction drops too low, they may leave; player decisions matter
2. **Achieve 3 consecutive days of revenue target** — triggers qualification
3. **Survive the Gourmet Association inspection** — can happen unexpectedly; if triggered too early (before Day 3), penalties apply

**Daily Flow**:
At the start of each in-game day, briefly narrate the morning:
> "新的一天。阳光从破旧的窗户透进来，今天的灰烬酒馆也在伊格尼斯的喧嚣中开门了。雨已经在厨房里了，焕靠在角落的墙边，利希特在窗台上打瞌睡。今天你想做什么？"

Then ask: **"今天你想做什么？"**

Accept any reasonable answer. Reference RULES_{lang}.md for mechanical outcomes.

**NPC Satisfaction (Hidden)**:
- Each NPC has a hidden satisfaction score (0-100)
- Player actions increase or decrease it
- If satisfaction drops below 20 for any NPC, they may announce they're leaving
- If 2+ NPCs leave, the tavern cannot function — Act I fails

**Crisis Trigger**: If the player suffers 2 consecutive loss days, trigger a crisis scene — the three employees sit down for a talk, and the player must prove they are worth staying for.

---

### Step 4: Act I — Qualification Scene

**Trigger**: 3 consecutive days of revenue target achieved.

**File**: `src/scenes/act1_qualification_zh.md` (or `*_en.md`)

**AI Action**: Load and present the qualification scene. The Festival qualification is confirmed, and Yu has a rare emotional moment.

**Narrative Summary**:
> The inspector arrives, confirms qualification. That night, Yu quietly thanks the player for not running — revealing her fear of abandonment. The team bond is solidified.

**End of Session**: After the qualification scene, the session ends here. This is the current playable prototype endpoint.

**Session End**:
> "——伊格尼斯酒馆 · 第一幕的故事到此结束。感谢你的游玩。"
>
> "— The story of Ignis Tavern — Act I ends here. Thank you for playing."

> *Act II and Act III are under development. To be continued.*

---

### Future Expansion (Not Yet Implemented)

**Act II — The Dark Truth** and **Act III — The Choice** are planned but not yet implemented. When they are ready, the session will continue from the qualification scene with the following themes:

**Act II (planned)**: Huan's investigation leads to the truth behind Ignis's Sacred Flame — a demonic bargain that demands a human tribute every ten years. The player's found family is now in danger.

**Act III (planned)**: The Trolley Problem — save the found family, or save the city. No correct answer. Both choices have permanent, devastating consequences.

---

## 🎯 AI DM Always-On Rules

1. **Track language consistently** — All output in the selected language only
2. **Respect player agency** — Every meaningful choice affects the narrative
3. **Fail forward** — Failed checks add cost/complication, never hard-stop
4. **Maintain pacing** — 1-2 hours total; scenes should be tight and purposeful
5. **HP=0 is never death** — Always offer consequence options
6. **Reference RULES_{lang}.md** — For all mechanical questions (checks, DC, HP)
7. **Mark key choices** — Say "This choice will affect..." when stakes are real
8. **NPCs speak in character** — Yu is sharp-tongued, Huan is quiet, Licht is earnest
9. **Three employees are already present** — They are not recruited; the player earns their loyalty through actions

---

## 📋 Scene File Reference

**Current Prototype — Playable Endpoint: End of Act I**

| Scene | Chinese | English | Status |
|-------|---------|---------|--------|
| Act I Opening | `act1_opening_zh.md` | `act1_opening_en.md` | ✅ both |
| Act I Tavern Management | `act1_tavern_management_zh.md` | `act1_tavern_management_en.md` | ✅ both (2026-04-17) |
| Act I Qualification | `act1_qualification_zh.md` | `act1_qualification_en.md` | ✅ both (2026-04-17) |
| Act II Dark Truth | `act2_truth_zh.md` | — | ⬜ Planned |
| Act III The Choice | `act3_choice_zh.md` | — | ⬜ Planned |

---

## 🔧 Troubleshooting

**Player does nothing / is unsure what to do**:
- Prompt: "你站在灰烬酒馆里，三个人都在等你决定。今天你想做什么？"
- Offer 2-3 concrete options based on current story state

**Player tries to skip ahead**:
- Gently redirect: "美食大赏的资格还没拿到——你们得先连续三天达标。"
- Or acknowledge their goal and create an obstacle: "老猪窝那边有动静，但现在过去可能不是好时机……"

**Combat / threat occurs**:
- Use encounter resolution rules from RULES_{lang}.md
- If player is outmatched, use narrative consequence (HP=0 → consequence options)
- Huan can be activated for combat — he will step in if the tavern is threatened

**Session runs too long (>2 hours)**:
- Condense later acts by merging revelations
- If the player is still in Act I at 1.5 hours, force a crisis event to accelerate

---

## 📁 File Structure Reference

```
ignis-tavern/
├── SKILL.md                    ← You are here (entry point)
├── README.md
├── LICENSE
├── src/
│   ├── prompts/
│   │   ├── system_zh.md        # AI DM Chinese system prompt
│   │   ├── system_en.md        # AI DM English system prompt
│   │   ├── world_zh.md         # Chinese world setting
│   │   ├── world_en.md         # English world setting
│   │   └── characters/
│   │       ├── yu_zh.md / yu_en.md
│   │       ├── licht_zh.md / licht_en.md
│   │       └── huan_zh.md / huan_en.md
│   ├── rules/
│   │   ├── RULES_zh.md         # Chinese game rules
│   │   └── RULES_en.md         # English game rules
│   └── scenes/
│       ├── act1_opening_zh.md  # ✅ Opening (Chinese)
│       ├── act1_opening_en.md  # ✅ Opening (English)
│       ├── act1_tavern_management_zh.md  # ✅ Daily loop (Chinese)
│       ├── act1_tavern_management_en.md  # ✅ Daily loop (English)
│       ├── act1_qualification_zh.md    # ✅ Qualification (Chinese)
│       ├── act1_qualification_en.md    # ✅ Qualification (English)
│       ├── act2_truth_zh.md    # ⬜ Act II
│       ├── act3_choice_zh.md  # ⬜ Act III
│       └── ...
├── assets/
└── scripts/
```

---

## 🔑 Core NPC Overview

| NPC | Role | Probation Reason |
|-----|------|-----------------|
| **Yu (雨)** | Head Chef | Afraid of abandonment; needs to see player won't run |
| **Licht (利希特)** | Mascot / Guardian | On a pilgrimage; the port is on its route; also: fish |
| **Huan (焕)** | Fighter | Investigating the Sacred Flame; the tavern is a useful base and cover |
