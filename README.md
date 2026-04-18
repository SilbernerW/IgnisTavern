# Ignis Tavern / 伊格尼斯酒馆

> **An AI-powered tabletop RPG experience set in the culinary metropolis of Ignis.**
> 一款以美食之城伊格尼斯为背景的 AI 驱动桌面角色扮演游戏。

---

## English

### What is Ignis Tavern?

**Ignis Tavern** is an OpenClaw skill that brings AI-driven tabletop roleplaying to life. Players take on the role of a new tavern owner in the bustling city of **Ignis** — a massive neutral city-state famous for its endless culinary delights, thriving night markets, and the eternal "Sacred Flame" that never goes out.

### The Story

Your tavern is failing. Three eccentric employees are already here — on probation, deciding whether you're worth staying for. You must earn their trust, revive the business, discover the dark truth behind the city's prosperity, and ultimately face an impossible moral dilemma that will test the bonds of friendship itself.

### Features

- **AI Dungeon Master** — Dynamic storytelling powered by large language models
- **Character Customization** — Create and develop your own tavern owner
- **Dice Mechanics** — Traditional tabletop checks adapted for AI narration
- **Procedural Art** — AI-generated character expressions and scene backgrounds delivered in-game
- **Branching Narrative** — Choices matter; your decisions shape the story

### The Three-Act Structure

| Act | Theme | Synopsis |
|-----|-------|----------|
| **Act I** | Comedy / Slice-of-Life | Earn your team's loyalty, revive your tavern, qualify for the Sacred Flame Gourmet Festival |
| **Act II** | Dark Revelation | Uncover that the city's prosperity is built on a demonic bargain |
| **Act III** | Moral Climax | Face the Trolley Problem — save your family or save the city |

### Team

This is a 3-person project running over 1–2 weeks. The goal is a **playable prototype** that demonstrates the core concept, not a polished product.

---

## 中文

### 什么是伊格尼斯酒馆？

**伊格尼斯酒馆** 是一个基于 OpenClaw 的 AI 跑团 skill。玩家扮演"炉火之都"伊格尼斯城中一家濒临倒闭的酒馆的新老板，在这个以无尽美食、繁华夜市和永不熄灭的"圣焰"闻名的巨大中立城邦中展开冒险。

### 故事简介

酒馆生意惨淡。三位古怪的"员工"已经在酒馆里等着——他们在试用期，正在评估你这个新老板靠不靠谱。你必须赢得他们的信任，振兴酒馆，挖掘城市繁荣背后的黑暗真相，并最终面对一个考验友情羁绊的艰难抉择。

### 核心功能

- **AI 主持人（DM）** — 大语言模型驱动的动态叙事
- **角色创建** — 自定义你的酒馆老板角色
- **检定系统** — 传统桌游掷骰机制，适配 AI 叙事
- **程序化美术** — AI 根据情境生成角色表情差分和场景背景图
- **分支剧情** — 选择会影响剧情走向

### 三幕结构

| 幕 | 主题 | 简介 |
|----|------|------|
| **第一幕** | 喜剧 / 日常 | 赢得员工信任、振兴酒馆、获得圣焰美食大赏参赛资格 |
| **第二幕** | 黑暗真相 | 发现城市繁荣建立在恶魔交易之上 |
| **第三幕** | 道德高潮 | 面对电车难题——救家人还是救城市 |

---

## Quick Start / 快速开始

### 安装 Installation (手动 / Manual)

**前提条件 / Prerequisites**

- 已安装 OpenClaw（[安装指南](https://docs.openclaw.ai/install)）
- OpenClaw is already installed ([install guide](https://docs.openclaw.ai/install))

**步骤 / Steps**

1. **下载仓库** — 下载 `ignis-tavern` 文件夹，或 clone 整个仓库
   Download the repository:
   ```bash
   git clone https://github.com/Kangruchen/IgnisTavern.git
   ```

2. **复制到 skills 目录** — 把仓库内容放到 OpenClaw 的 skills 文件夹
   Copy the repository contents to OpenClaw's skills directory:
   ```bash
   # Windows
   xcopy /E /I IgnisTavern %USERPROFILE%\.openclaw\skills\ignis-tavern

   # macOS / Linux
   cp -r IgnisTavern ~/.openclaw/skills/ignis-tavern
   ```

   目录结构应该像这样：
   The directory structure should look like this:
   ```
   ~/.openclaw/skills/ignis-tavern/
   ├── SKILL.md
   ├── README.md
   └── src/
       ├── prompts/
       ├── rules/
       └── scenes/
   ```

3. **重启 OpenClaw** — 如果 OpenClaw 正在运行，重启 gateway 让新 skill 生效
   Restart OpenClaw gateway if it's running to load the new skill

4. **开始游戏** — 在 OpenClaw 对话中输入：
   Start the game by saying in your OpenClaw chat:
   ```
   玩伊格尼斯酒馆
   ```
   或 / or: `play Ignis Tavern`

   AI 会加载 SKILL.md 并开始游戏。
   The AI will load SKILL.md and begin the session.

---

### 开始游戏 Starting the Game

游戏开始后，AI 会依次引导你：
Once started, the AI will guide you through:

1. **选择语言** — 中文 / English
2. **创建角色** — 预设模板或问答生成
3. **第一幕** — 经营酒馆，赢得三位员工的信任
4. **资格确认** — 达成连续3天达标，解锁第一幕结局

Language → Character Creation → Act I Management → Qualification

**预计游戏时长：** 1-2小时
**Estimated play time:** 1-2 hours

---

### 项目结构 Project Structure

| 文件夹 Folder | 内容 Content |
|-------------|-------------|
| `src/prompts/` | AI DM 系统提示、世界设定、NPC 角色描述 |
| `src/rules/` | 游戏规则（d20 检定、属性、职业等） |
| `src/scenes/` | 各场景脚本（开场、经营、资格确认等） |
| `src/scenes/shared/` | Act II/III 共享场景文件 |
| `src/npc/` | NPC 深度对话和背景文件（Act II 对话已完成） |
| `assets/` | 预留：图像生成模板 |
| `scripts/` | 预留：辅助脚本 |

**支持语言 Supported Languages：** 中文（Chinese）、English

---

## 项目状态 / Project Status

### 第一幕（Playable）✅
- 开场（中文/English）
- 日经营系统（中文/English）
- 资格确认场景（中文/English）

### 第二幕（Partially Implemented）⚠️
- 主线框架已完成（中文）
- 英文版待补全
- NPC Act II 对话已完成（中文）

### 第三幕（Fully Implemented）✅
- 开场场景（中文/English）
- 对峙场景（中文/English）
- 7 个结局完整剧本（中文/English）

---

## 核心机制 / Core Mechanics

| 机制 | 说明 |
|------|------|
| **暗骰（Hidden Rolls）** | NPC 态度/声誉变化 DM 暗投，只通过行为表现传达 |
| **角色亮点 XP** | 精彩 RP 行为奖励 XP，DM 主动宣布 |
| **每日检定情境** | 讨价还价、立威、处理投诉等场景触发 d20 明骰 |
| **NPC 满意度（隐性）** | 玩家行为影响满意度，低了 NPC 可能离开 |

---

## 安装路径 / Installation Path

> ⚠️ 本项目使用 **workspace skill** 加载方式。
> 安装路径：`~/.openclaw/workspace/skills/ignis-tavern/`
> 而不是：`~/.openclaw/skills/ignis-tavern/`

---

## Repository Structure / 仓库结构

```
ignis-tavern/
├── SKILL.md               # OpenClaw skill entry point
├── README.md              # This file
├── LICENSE                # MIT License
├── src/
│   ├── prompts/           # AI prompts & world-building
│   │   ├── system_zh.md   # DM system prompt (Chinese)
│   │   ├── system_en.md   # DM system prompt (English)
│   │   ├── world_zh.md    # World setting (Chinese)
│   │   ├── world_en.md    # World setting (English)
│   │   └── characters/    # NPC profiles (per-character, per-language)
│   ├── scenes/            # Scene modules (per-act, per-language)
│   ├── scenes/shared/     # Act II/III shared scenes
│   ├── schemas/           # Data format definitions
│   └── rules/             # Game rules (RULES_zh.md, RULES_en.md)
├── assets/
│   ├── prompts/           # Image generation prompt templates
│   └── examples/          # Example outputs
├── scripts/               # Helper scripts
└── tests/                 # Test files
```

---

## License / 许可证

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

本项目采用 **MIT 许可证**。详情请参阅 [LICENSE](LICENSE)。
