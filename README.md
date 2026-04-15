# Ignis Tavern / 伊格尼斯酒馆

> **An AI-powered tabletop RPG experience set in the culinary metropolis of Ignis.**
> 一款以美食之城伊格尼斯为背景的 AI 驱动桌面角色扮演游戏。

---

## English

### What is Ignis Tavern?

**Ignis Tavern** is an OpenClaw skill that brings AI-driven tabletop roleplaying to life. Players take on the role of a new tavern owner in the bustling city of **Ignis** — a massive neutral city-state famous for its endless culinary delights, thriving night markets, and the eternal "Sacred Flame" that never goes out.

### The Story

Your tavern is failing. To save it, you must recruit three eccentric employees, discover the dark truth behind the city's prosperity, and ultimately face an impossible moral dilemma that will test the bonds of friendship itself.

### Features

- **AI Dungeon Master** — Dynamic storytelling powered by large language models
- **Character Customization** — Create and develop your own tavern owner
- **Dice Mechanics** — Traditional tabletop checks adapted for AI narration
- **Procedural Art** — AI-generated character expressions and scene backgrounds delivered in-game
- **Branching Narrative** — Choices matter; your decisions shape the story

### The Three-Act Structure

| Act | Theme | Synopsis |
|-----|-------|----------|
| **Act I** | Comedy / Slice-of-Life | Build your team, revive your tavern, qualify for the Sacred Flame Gourmet Festival |
| **Act II** | Dark Revelation | Uncover that the city's prosperity is built on a demonic bargain |
| **Act III** | Moral Climax | Face the Trolley Problem — save your family or save the city |

### Team

This is a 3-person project running over 1–2 weeks. The goal is a **playable prototype** that demonstrates the core concept, not a polished product.

---

## 中文

### 什么是伊格尼斯酒馆？

**伊格尼斯酒馆** 是一个基于 OpenClaw 的 AI 跑团 skill。玩家扮演"炉火之都"伊格尼斯城中一家濒临倒闭的酒馆的新老板，在这个以无尽美食、繁华夜市和永不熄灭的"圣焰"闻名的巨大中立城邦中展开冒险。

### 故事简介

酒馆生意惨淡，为了拯救它，你必须招募三位古怪的"员工"，挖掘城市繁荣背后的黑暗真相，并最终面对一个考验友情羁绊的艰难抉择。

### 核心功能

- **AI 主持人（DM）** — 大语言模型驱动的动态叙事
- **角色创建** — 自定义你的酒馆老板角色
- **检定系统** — 传统桌游掷骰机制，适配 AI 叙事
- **程序化美术** — AI 根据情境生成角色表情差分和场景背景图
- **分支剧情** — 选择会影响剧情走向

### 三幕结构

| 幕 | 主题 | 简介 |
|----|------|------|
| **第一幕** | 喜剧 / 日常 | 招募员工、振兴酒馆、获得圣焰美食大赏参赛资格 |
| **第二幕** | 黑暗真相 | 发现城市繁荣建立在恶魔交易之上 |
| **第三幕** | 道德高潮 | 面对电车难题——救家人还是救城市 |

---

## Quick Start / 快速开始

> *Coming soon — this section will be updated once the prototype is ready.*

---

## Repository Structure / 仓库结构

```
ignis-tavern/
├── SKILL.md               # OpenClaw skill entry point
├── README.md              # This file
├── LICENSE                # MIT License
├── src/
│   ├── prompts/           # AI prompts & world-building
│   │   ├── system.md      # DM system prompt
│   │   ├── world.md       # World setting
│   │   └── characters/    # NPC profiles
│   ├── scenes/            # Pre-written scene modules
│   ├── schemas/           # Data format definitions
│   └── rules/             # Game rules & dice system
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
