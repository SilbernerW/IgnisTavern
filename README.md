# Ignis Tavern / 伊格尼斯酒馆

> **An AI-powered tabletop RPG experience set in the culinary metropolis of Ignis.**
> 一款以美食之城伊格尼斯为背景的 AI 驱动桌面角色扮演游戏。

---

## English

### What is Ignis Tavern?

**Ignis Tavern** is an AI-driven tabletop roleplaying game available in two formats:
- **OpenClaw Skill** — Play directly in your OpenClaw chat (skill version)
- **Web App** — Browser-based experience with front-end driven game mechanics (web version)

Players take on the role of a new tavern owner in the bustling city of **Ignis** — a massive neutral city-state famous for its endless culinary delights, thriving night markets, and the eternal "Sacred Flame" that never goes out.

### The Story

Your tavern is failing. Three eccentric employees are already here — on probation, deciding whether you're worth staying for. You must earn their trust, revive the business, discover the dark truth behind the city's prosperity, and ultimately face an impossible moral dilemma that will test the bonds of friendship itself.

### Features

- **AI Dungeon Master** — Dynamic storytelling powered by large language models
- **Front-End Driven Mechanics** — Character creation, dice checks, and inventory managed by UI (web version)
- **Dice State Machine** — Idle → Awaiting Roll → Resolved, with animation and formula display
- **Inline Cards** — Game events (dice checks, item changes, HP) appear as embedded cards in the chat flow
- **Character Customization** — Template selection or quiz-based generation
- **Branching Narrative** — Choices matter; your decisions shape the story
- **Bilingual** — Full Chinese (中文) and English support

### The Three-Act Structure

| Act | Theme | Synopsis |
|-----|-------|----------|
| **Act I** | Comedy / Slice-of-Life | Earn your team's loyalty, revive your tavern, qualify for the Sacred Flame Gourmet Festival |
| **Act II** | Dark Revelation | Uncover that the city's prosperity is built on a demonic bargain |
| **Act III** | Moral Climax | Face the Trolley Problem — save your family or save the city |

---

## 中文

### 什么是伊格尼斯酒馆？

**伊格尼斯酒馆** 是一款 AI 驱动的桌面角色扮演游戏，提供两种游玩方式：
- **OpenClaw Skill** — 在 OpenClaw 对话中直接游玩
- **Web 版** — 基于浏览器的独立体验，前端驱动的游戏机制

玩家扮演"炉火之都"伊格尼斯城中一家濒临倒闭的酒馆的新老板，在这个以无尽美食、繁华夜市和永不熄灭的"圣焰"闻名的巨大中立城邦中展开冒险。

### 故事简介

酒馆生意惨淡。三位古怪的"员工"已经在酒馆里等着——他们在试用期，正在评估你这个新老板靠不靠谱。你必须赢得他们的信任，振兴酒馆，挖掘城市繁荣背后的黑暗真相，并最终面对一个考验友情羁绊的艰难抉择。

### 核心功能

- **AI 主持人（DM）** — 大语言模型驱动的动态叙事
- **前端驱动机制** — 角色创建、骰子检定、背包管理由 UI 控制（Web 版）
- **骰子状态机** — 空闲→等待投骰→已解决，带动画和公式展示
- **内嵌卡片** — 游戏事件（检定、物品变化、HP）以卡片形式嵌入聊天流
- **角色创建** — 预设模板选择或问答生成
- **分支剧情** — 选择会影响剧情走向
- **双语支持** — 中文 / English

### 三幕结构

| 幕 | 主题 | 简介 |
|----|------|------|
| **第一幕** | 喜剧 / 日常 | 赢得员工信任、振兴酒馆、获得圣焰美食大赏参赛资格 |
| **第二幕** | 黑暗真相 | 发现城市繁荣建立在恶魔交易之上 |
| **第三幕** | 道德高潮 | 面对电车难题——救家人还是救城市 |

---

## Quick Start / 快速开始

### Web 版 / Web Version

1. **安装依赖** Install dependencies:
   ```bash
   cd web && npm install
   ```

2. **配置环境变量** Set up environment (optional, for free fallback model):
   ```bash
   # If web/.env.example exists:
   cp web/.env.example web/.env.local

   # If not, create web/.env.local manually and set fallback API keys.
   ```

3. **启动开发服务器** Start dev server:
   ```bash
   cd web && npm run dev
   ```

4. **打开浏览器** Open http://localhost:3000

5. **配置 API Key**（可选）— 点击右上角 🔑 配置自己的 API Key，或使用免费额度（10次/天）

### Skill 版 / Skill Version

1. **下载仓库** Clone the repository:
   ```bash
   git clone https://github.com/Kangruchen/IgnisTavern.git
   ```

2. **复制到 skills 目录** Copy to OpenClaw's workspace skills directory:
   ```bash
   # Windows
   xcopy /E /I IgnisTavern %USERPROFILE%\.openclaw\workspace\skills\ignis-tavern

   # macOS / Linux
   cp -r IgnisTavern ~/.openclaw/workspace/skills/ignis-tavern
   ```

3. **开始游戏** Start the game by saying:
   ```
   玩伊格尼斯酒馆
   ```
   or: `play Ignis Tavern`

---

## 游戏流程 / Game Flow

### Web 版流程

1. **欢迎词** — DM 输出伊格尼斯城介绍
2. **角色创建** — 前端内嵌卡片，选择模板或问答生成
3. **开场叙事** — DM 按场景文件描述第一幕
4. **游戏循环** — 玩家行动 → DM 叙事 → 检定/物品/HP 内嵌卡片 → 继续
5. **阶段推进** — 按实现进度切换场景与阶段（当前以第一幕流程为稳定基线）

### Skill 版流程

1. **选择语言** — 中文 / English
2. **创建角色** — DM 引导选择模板或问答
3. **第一幕** — 经营酒馆，赢得三位员工的信任
4. **资格确认** — 达成连续3天达标
5. **第二/三幕** — 开发中（当前 Skill 原型默认到第一幕结束）

---

## 项目结构 / Project Structure

```
ignis-tavern/
├── SKILL.md                    # OpenClaw skill entry point
├── README.md                   # This file
├── src/                        # Skill version data
│   ├── prompts/                # AI prompts & world-building
│   │   ├── system_zh/en.md     # DM system prompt
│   │   ├── dm_behavior_zh/en.md
│   │   ├── web_dm_rules_zh/en.md  # Web DM rules (structured [CHAR:...] tag protocol)
│   │   ├── world_zh/en.md      # World setting
│   │   ├── characters/         # NPC profiles (huan, licht, yu)
│   │   └── phases/             # Phase-specific instructions
│   ├── scenes/                 # Scene scripts (per-act, per-language)
│   ├── scenes/shared/          # Act II/III shared scenes
│   ├── rules/                  # Game rules
│   ├── npc/                    # NPC dialogue and backstory
│   └── schemas/                # Data format definitions
├── web/                        # Web app (Next.js)
│   ├── src/
│   │   ├── app/                # Next.js app router
│   │   │   ├── api/chat/       # Server-side chat API with provider fallback
│   │   │   └── game/           # Game page
│   │   ├── components/
│   │   │   ├── InlineCharacterCreation.tsx  # UI-driven character creation card
│   │   │   ├── InlineDiceCheck.tsx          # Inline dice roll card
│   │   │   ├── InlineNotification.tsx       # Item/HP/XP notification cards
│   │   │   ├── CharacterSheet.tsx           # Side panel character sheet
│   │   │   ├── ChatInput.tsx
│   │   │   ├── StreamingText.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── agents/gm.ts   # Progressive prompt loading
│   │   │   ├── gameState.ts    # Reducer-based game state
│   │   │   ├── diceMachine.ts  # Dice state machine + DC parsing
│   │   │   └── api.ts          # Streaming chat API client
│   │   └── data/               # Web version data (synced with src/)
│   │       ├── prompts/        # Same structure as src/prompts/ + [CHAR:...] tags
│   │       ├── scenes/         # Identical to src/scenes/
│   │       ├── rules/          # Identical to src/rules/
│   │       └── npc/            # Identical to src/npc/
│   └── package.json
└── LICENSE                     # MIT License
```

### 两版差异 / Version Differences

| 特性 | Skill 版 | Web 版 |
|------|---------|--------|
| 角色创建 | LLM 引导（多轮对话） | 前端 UI 驱动（内嵌卡片） |
| 骰子检定 | 纯文本描述结果 | 状态机 + 动画 + 公式展示 |
| 状态追踪 | DM 纯文本标注（`HP: 4/5`） | `[CHAR:...]` 标签自动解析 |
| 物品/技能 | DM 叙事描述 | 内嵌通知卡片 |
| API 限制 | 无（用用户的 key） | 免费 10 次/天 + 自带 key |
| 多模型 | 用户的模型 | 自动 fallback（MiniMax → DeepSeek） |

---

## 项目状态 / Project Status

Status labels used in this section:
- **Verified** — Implemented and confirmed in the current repository
- **In Progress** — Partially implemented or under active iteration
- **Planned** — Design target, not in default playable flow yet

### Story Content

| Scope | Status | Notes |
|------|--------|-------|
| **Act I** | **Verified** | Opening + tavern management + qualification are playable in current flow (中文/English) |
| **Act II** | **In Progress** | Investigation/revelation content exists, but not yet part of the default Skill playable endpoint |
| **Act III** | **Planned** | Ending design exists; full production integration is not in the default playable flow |
| **NPC Dialogue (Act II)** | **In Progress** | Dialogue files exist but are not fully finalized across all NPC branches |

### Web App

| Scope | Status | Notes |
|------|--------|-------|
| Progressive prompt loading | **Verified** | Opening phase payload reduced via phase-based loading |
| Front-end character creation | **Verified** | Template + quiz creation handled by UI cards |
| Dice state machine | **Verified** | `idle -> awaiting_roll -> roll_resolved` flow implemented |
| Inline cards and side sheet | **Verified** | Dice/item/HP cards + right-side character sheet in use |
| Provider fallback + free quota limit | **Verified** | Server-side fallback and daily free-tier limit are implemented |
| Dice flow/startup/model fixes | **In Progress** | Ongoing stabilization and edge-case fixes |
| Visual polish & animations | **In Progress** | UX polish still under iteration |
| Save/load robustness | **In Progress** | Save/load behavior is available and being improved |

### Data Sync

| Scope | Status | Notes |
|------|--------|-------|
| `scenes/` + `rules/` shared content | **Verified** | Synced from `src/` into `web/src/data/` via sync script |
| `npc/` shared content | **In Progress** | Intended to be synced from `src/`; parity is being normalized |
| `prompts/phases/act2` | **In Progress** | Kept aligned during content iteration |
| `prompts/web_dm_rules` | **Verified** | Single source in `src/prompts/`; sync copies it directly into web data |
| `prompts/phases/character_creation` | **In Progress** | Version-specific behavior currently exists and is being normalized |

For local development, run `cd web && npm run sync` before verifying data parity.

---

## 核心机制 / Core Mechanics

| 机制 | 说明 |
|------|------|
| **d20 检定** | 属性修正 + d20 vs DC，前端骰子组件（Web）/ 纯文本（Skill） |
| **暗骰** | NPC 态度/声誉变化 DM 暗投，只通过行为表现传达 |
| **角色亮点 XP** | 精彩 RP 行为奖励 XP，DM 主动宣布 |
| **NPC 满意度** | 玩家行为影响满意度（0-100），低了 NPC 可能离开 |
| **营收目标** | 每日营收目标，连续达标解锁资格 |
| **HP 系统** | 基础 5 + 体魄修正，受伤/恢复 |

---

## License / 许可证

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

本项目采用 **MIT 许可证**。详情请参阅 [LICENSE](LICENSE)。
