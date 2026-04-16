# Ignis Tavern · Rule Document v0.2

> **Design Philosophy**: Simplified D&D 5e rules tailored for 1-2 hour short-form sessions. Fast-paced, narrative-driven, zero-death consequences, retaining tactical depth while allowing new players to get started in 5 minutes.

---

## 🎲 I. Core Mechanics

### 1.1 Rolling Dice

All checks use **d20 + attribute modifier + proficiency bonus (if any) vs Difficulty Class (DC)**

```
Roll: d20([die roll]) + attribute modifier(+N) + proficiency bonus(+N, if applicable)
      = [total] vs DC [target]
      → Success / Failure / Critical (roll of 20) / Critical Fail (roll of 1)
```

**Display Requirement**: Always show the raw d20 roll number. Never say only "success" or "failure" — the player must see the actual die result.

```
Correct example:
「You attempt to persuade the guard. d20(14) + Charisma modifier(+3) = 17 vs DC 15 → Success!」

Incorrect example:
「You successfully persuaded the guard.」（no d20 number shown）
```

### 1.2 Advantage & Disadvantage

- **Advantage**: Roll 2d20, take the **higher** result
- **Disadvantage**: Roll 2d20, take the **lower** result
- **Cannot stack** — pick one or the other
- Having both advantage and disadvantage → they cancel out, roll normally

### 1.3 Attributes (4 Attributes)

| Attribute | Abbr | Affects |
|-----------|------|---------|
| **Strength** | STR | Max HP, melee damage, strength checks |
| **Dexterity** | DEX | Ranged attacks, evasion, agility checks |
| **Intelligence** | INT | Knowledge checks, perception, cooking/alchemy |
| **Charisma** | CHA | Persuasion/deception/trade, social checks |

**Attribute Modifier** = (Attribute Value - 10) ÷ 2, floored

| Value | Modifier |
|-------|----------|
| 1-2 | -5 |
| 3-4 | -4 |
| 5-6 | -3 |
| 7-8 | -2 |
| 9-10 | -1 |
| 11-12 | +0 |
| 13-14 | +1 |
| 15-16 | +2 |
| 17-18 | +3 |
| 19-20 | +4（Heroic）|

### 1.4 Proficiency

Players choose **1 primary attribute** and **2 skills** as "proficient" — these get a **+2 bonus** on rolls.

Example: The protagonist chooses Intelligence as primary, proficient in Perception and Cooking → Intelligence checks and both skill checks get +2.

---

## 🧙 II. Characters (Quick Creation)

### 2.1 Preset Templates（Recommended）

Choose a template, ready in 30 seconds:

| Template | Primary Attr | Skills | Background |
|----------|-------------|--------|------------|
| **Mediator** | Intelligence | Perception, Cooking | Former sous-chef at a famous restaurant, left after an incident, came to Ignis to start fresh |
| **Action-Oriented** | Dexterity | Sleight of Hand, Stealth | Street orphan raised in the alleys, good with tricks, the tavern is your cover identity |
| **Persuader** | Charisma | Intimidation, Trade | Declining noble descendant, deep in debt, hoping the tavern will be their salvation |
| **Warrior** | Strength | Fighting, Perception | Retired mercenary, looking for a quiet place in Ignis to spend the rest of their days |

### 2.2 Quick Generator（3 Questions）

Don't want a template? Answer 3 questions:

```
1. What do you care about most?（Friendship / Money / Truth / Honor）
2. What is your flaw?（Impulsive / Indecisive / Gluttonous / Shy）
3. What kind of person do you want to become?（Respected / Loved / Remembered / At peace）
```

AI will generate a complete character with attributes and backstory based on your answers.

---

## 💚 III. Hit Points (HP)

- **Starting HP**: 5 + Strength modifier (minimum 5)
- **Injury**: HP decreases, recoverable through rest
- **Near-Death Protection**: When HP reaches 0, **no death** — trigger a **Consequence Event** and continue

### Near-Death Consequences（When HP=0）

When HP drops to 0, the player chooses one consequence (narratively limited by the current scene):

| Consequence Type | Effect |
|-----------------|--------|
| **Physical Cost** | HP drops to 1, but gain a temporary skill/info |
| **Material Cost** | Lose an important item to proceed |
| **Relationship Cost** | An NPC's opinion of you worsens |
| **Opportunity Cost** | Miss part of the current scene |

> **Core Principle**: *Never sideline a player.* In a 1-2 hour narrative, death equals game over — too heavy.

---

## ⚔️ IV. Encounter Resolution（Fast-Forward Combat）

### 4.1 Design Philosophy

No turn-by-turn combat. Instead, **1-2 checks resolve the entire encounter**.

**Traditional Design**（Too slow）:
```
Turn 1: Player A attacks → hits for 12 damage
Turn 2: Player B attacks → hits for 8 damage
...（repeat until someone's HP hits 0）
```

**Fast-Forward**（1-2 minutes to resolve）:
```
Player describes strategy → AI determines number of rolls → 1-2 rolls → narrative result
```

### 4.2 Encounter Flow

**Step 1: Player Describes Action**
> "I want to rush past the guard while he turns around"
> "I'm trying to convince him to let us in"
> "I want to distract the guard with my cooking"

**Step 2: AI Determines Number of Rolls**

| Situation | Rolls | Description |
|-----------|-------|------------|
| Simple bypass / no combat needed | 0 | Direct narrative success |
| Single check decides outcome | 1 | Persuasion/deception/technique |
| Risky confrontation | 1 | d20 + attribute vs DC |
| Intense confrontation, multiple stages | 2 | First determines attack/defense, second determines result |

**Step 3: DC Reference Table**

| Difficulty | DC | Example Scenario |
|------------|-----|-----------------|
| Easy | 10 | Persuading a regular NPC to give you a discount |
| Normal | 12 | Hearing whispers in a noisy environment |
| Hard | 15 | Convincing a guard to let you through the city gate |
| Extreme | 20 | Making a hostile NPC completely change their attitude |

**Step 4: Narrative Description**
> Success: "You seize the moment when the guard yawns and slip through the side door. He doesn't notice a thing."
> Failure: "Just as you step out, the guard's gaze sweeps over. You have to retreat into the shadows."

---

## 🏆 V. Experience & Progression

### 5.1 Short-Form Session Pacing

Entire scenario distributes approximately **10-12 XP points** across two phases:

| Phase | Available XP | Timing |
|-------|-------------|--------|
| **Act I** | 4-5 XP | Tavern management, retaining employees |
| **Act II/III** | 5-7 XP | Story choices, key confrontations |

### 5.2 XP Rewards

| Action Type | XP | Notes |
|-------------|-----|-------|
| **Main Story Progress** | +2 | Completing key story nodes |
| **Meaningful Choice** | +1 | Your choice genuinely affected something |
| **Character Moment** | +1 | Said something very in-character, or made a character-appropriate decision |
| **Team Contribution** | +1 | Helped another player/NPC solve a problem |
| **Creative Solution** | +1 | Found an unexpected way to get past an obstacle |

### 5.3 Leveling Up（Every 10 XP）

Accumulating **10 XP** triggers an upgrade:

**Upgrade Effects（Choose One）**:
- Max HP +3
- Primary Attribute +2（Reroll attributes）
- Gain **1 New Skill**（Choose from the skill list）
- Unlock **Awakening Ability**（Class-specific, one-time powerful effect）

> Recommended: Schedule the first upgrade at the end of Act I（when qualifying for the Gourmet Festival）, giving players a satisfying "I've grown stronger" moment.

---

## 📋 VI. Example Checks

### Scene 1: Persuading a Gate Guard to Let You Into the Slums

```
Background: You need to pass through the gate into the slums to investigate a lead. The guard blocks your path.

You choose: Charisma (Intimidation) check, trying to intimidate him.
Your Charisma is 14（modifier +2), and you have the "Persuader" class proficiency bonus +2.
GM sets DC = 14（Difficult）

You roll d20: Result is 11
11 + 2（Charisma modifier）+ 2（proficiency）= 15

15 ≥ 14 → Success!

GM Narrative: "Your eyes go cold. You lower your voice and say, 'I'm with the Grey Fang.
Our people are waiting.' The guard's face goes pale. He steps aside, trembling.
（You actually don't know anyone from the Grey Fang — but he's heard the name and immediately folded.）"
```

### Scene 2: Sneaking into a Warehouse for Evidence

```
Background: You discover the smugglers' warehouse nearby. You want to sneak in and investigate.

You choose: Dexterity (Stealth) check, climbing in through a window at night.
Your Dexterity is 12（modifier +1), no Stealth proficiency.
GM sets DC = 13（Normal, somewhat difficult due to guard patrols）

You roll d20: Result is 5
5 + 1 = 6

6 < 13 → Failure!

GM Narrative: "Just as you pull yourself onto the windowsill, the floorboard beneath you creaks.
A lantern flares inside the warehouse. A gruff voice shouts: 'Who's there?!'
You barely make it back into the alley, heart pounding."
```

### Scene 3: Yu's Cooking Impresses the Judge

```
Background: The Sacred Flame Gourmet Festival preliminary round — you need to make a lasting impression.

You choose: Intelligence (Cooking) check, with Yu's help (Advantage).
Your Intelligence is 13（modifier +1), and you have the "Mediator" class proficiency bonus +2.
GM grants Advantage（Yu's assistance is a beneficial condition）。

You roll d20×2, take the higher: Rolls 9 and 15, take 15
15 + 1（Intelligence modifier）+ 2（proficiency）= 18

GM sets DC = 16（The competition is tough）

18 ≥ 16 → Success!

GM Narrative: "The judge picks up a piece of meat and takes a bite.
His expression shifts from polite smile to surprise, then to rapture.
'What is this flavor...' He sets down his chopsticks, looks you in the eye for the first time.
'My name is Ivan. I think I should properly introduce myself to this young proprietor.'"
```

---

## 🔧 VII. GM Guide（Optimized for Short-Form Sessions）

### 7.1 Pacing Control

| Time | Content | Objective |
|------|---------|-----------|
| 0-10 min | Opening & Motivation Setup | Player understands "what am I doing" |
| 10-40 min | Act I: Tavern Management + Retention | Complete 2-3 NPC interactions |
| 40-70 min | Act II: Truth Revealed | 1-2 key choice points |
| 70-100 min | Act III: Climactic Confrontation | 1-2 encounter resolutions |
| 100-120 min | Epilogue | Player agency, leave them with something to ponder |

### 7.2 Quick DC Reference

| Difficulty | DC | When to Use |
|------------|-----|-------------|
| Easy | 10 | Everyday conversation, basic skill use |
| Normal | 12 | Has competition/obstacles |
| Hard | 15 | Requires effort or has favorable conditions |
| Extreme | 20 | Nearly impossible but with a slim chance |

### 7.3 Key Principles

- **Players Always Stay in the Game**: HP=0 doesn't mean death — give consequence options
- **Failure is Interesting**: Failure doesn't mean "you can't do it" — it can mean "you can, but at a cost"
- **Choices Carry Weight**: Ensure players know their choices will affect what comes next
- **Narrative Over Rules**: Rules are a tool, not a cage — adjust when it feels right

---

## 📌 Open Questions

- [ ] What are the Awakening Abilities?（One powerful skill per class）
- [ ] Are the scene DCs appropriate?
- [ ] Is the Act I upgrade timing well-placed？

---

*Last Updated: 2026-04-16 v0.2*
