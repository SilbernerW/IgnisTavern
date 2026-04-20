# Act I · Tavern Management System

> **Scene Type**: Daily Game Loop
> **Trigger**: At the start of each in-game day, after the Opening Scene
> **Purpose**: Drive the milestone progression toward "3 consecutive days of meeting targets"

---

## 🏠 System Overview

### Core Loop

```
Day Start → Player Decision (procure ingredients / handle events / manage relationships) → Evening Resolution → Next Day
```

Players do not manage precise gold amounts. The system is driven by **narrative + milestones** — at the end each day, the AI DM provides a **result narrative** based on the player's actions.

---

## 📅 Daily Flow (Three Phases)

### Phase 1: Morning (Player's First Major Decision)

AI DM delivers a morning narrative, then — based on the day's situation — gives the player a brief hint or suggestion before presenting the options menu.

**Morning Narrative Template** (Day 1, use descriptive titles):
```
"A new day. Sunlight streams through the cracked windows, and Ignis's chaos drifts in from outside.
The one in the kitchen is already at the stove. A silent figure leans against the wall in the corner.
Something on the windowsill is dozing. What do you want to do today?"
```

**Morning Narrative Template** (Day 2+, use names):
```
"A new day. Yu is already in the kitchen. Huan leans against the wall in the corner, dozing.
Licht has curled up on the windowsill. What do you want to do today?"
```

**Narrative Lead-In Principle**: Do not just dump the options menu. First, use 1-2 sentences to set up the situation based on the day's context.

Example Lead-Ins:
- When ingredients may be running low: 「Yu pokes her head out of the kitchen: "We're running low. Need to get fresh stuff today."」
- When rivals are stirring something: 「Huan stands up from the corner: "Old Pig Sty is moving today."」
- When nothing special is happening: 「Yu is busy in the kitchen. Huan is in his usual spot. Looks like an ordinary day.」

**Typical Options** (presented after narrative lead-in; first-phase options must include free input hint):

| Option | Description | Trigger |
|--------|-------------|---------|
| **A. Source Ingredients** | Go to the market / port / smuggler's passage to get supplies | Yu will suggest if kitchen stock is low |
| **B. Deal with Rivals** | Old Pig Sty provocation / rumor-spreading / head-on competition | Rival events trigger randomly |
| **C. Handle Tavern Affairs** | Repair equipment / attract customers / improve environment | Basic option |
| **D. Talk to NPCs** | Get to know the three of them, deepen bonds | Affects retention |
| **E. Investigate the Sacred Flame** | Foreshadowing for Act II (Huan's leads) | Free exploration |
| **F. Other** | Player's own action | AI responds |

> *（You can also do something not listed — describe your own action freely.）*

---

### Phase 2: Afternoon (Optional — Player's Second Decision or Skip)

After the morning action resolves, transition to afternoon:
```
"Time moves fast. The sun is already tilting westward, and the tavern hasn't opened for business yet.
Afternoon light filters through the windows. Yu is checking the ingredients.
Huan stepped out earlier and hasn't come back yet."
```

**Afternoon Options**:
- If the morning action was something worth pursuing further → follow that thread
- If there's something from the morning left undone → handle it now
- If the player wants to skip → jump to evening

```
> What do you want to do in the afternoon?
>
> [1] Continue the morning's business (go deeper)
> [2] Do something else
> [3] Skip — get the tavern ready for the evening
>
> *（You can also do something not listed — describe your own action.）*
```

**Skip Rule**: If the player selects [3] or describes "open for business," DM advances directly to evening resolution. Two decisions per day are not required.

---

### Phase 3: Evening — Night Resolution

The tavern opens for business. DM briefly describes the evening (1-2 sentences), then delivers the resolution result.

---

### Evening Resolution

At the end of each day, the AI DM delivers a **result** based on these factors:

**Simplified Formula**:

```
Daily Income = Base Foot Traffic × Dish Quality Modifier × Event Modifier
```

| Factor | Effect |
|--------|--------|
| **Dish Quality** | Depends on ingredient freshness. Yu's skill is fixed (unless upgraded). |
| **Base Foot Traffic** | Fixed 50-70 copper/day (lower district of Ignis, limited flow) |
| **Ingredient Freshness** | Good: +30% income; Normal: ±0%; Poor: -20% |
| **Event Modifier** | Favorable events: +20-50%; Unfavorable events: -10-30% |

**Result Tiers**:

| Result | Description | Effect |
|--------|-------------|--------|
| **Great Success** | Full house, word spreads, tips given | +2 days toward consecutive target |
| **On Target** | Steady income, sustainable | +1 day toward consecutive target |
| **Barely** | Break even, needs change tomorrow | +0 days (no progress) |
| **Loss** | Can't cover costs, complaints | -1 day (regression) |

---

## 🍽️ Ingredient System (Simplified)

### Ingredient Sources

| Source | Quality | Price | Risk |
|--------|---------|-------|------|
| **Regular Market** | Normal | Standard price | None |
| **Smuggler's Passage** | Good (freshest) | 30% cheaper | May run into trouble |
| **Port Morning Market** | Good (sometimes great finds) | Standard price | None |
| **Old Pig Sty Charity** | Poor | Free | Loses face, affects reputation |

### Ingredient Stock

The tavern starts with **3 days' worth of basic ingredients** (left by the previous owner — barely usable).

Yu consumes 1 stock unit per day. When stock runs out, it must be replenished or dish quality drops.

---

## 👥 NPC Contributions (Daily Automatic)

| NPC | Contribution | Negative Effect |
|-----|--------------|-----------------|
| **Yu** | Stable output, guaranteed dish quality | None — unless player upsets her |
| **Huan** | Guards tavern safety, handles harassers | None — unless his past is triggered |
| **Licht** | Mascot, attracts customers (genuinely helpful) | None — as long as there's fish |

**NPC Mood System (Hidden)**:

All three have a hidden "Satisfaction" stat. Player actions affect it:

| Action | Effect |
|--------|--------|
| Working seriously, taking responsibility | All three satisfaction + |
| Avoiding problems, indecisive | All three satisfaction - |
| Catering to someone's needs | That person's satisfaction ++ |
| Hurting / ignoring someone | That person's satisfaction -- |

Prolonged low satisfaction may cause an NPC to leave. This is a consequence of player decisions.

---

## ⚠️ Daily Event System

Each day, the DM decides subjectively whether to trigger an event (0-1 per day). Do not roll on a probability table.

**DM Decision Guidelines**:
- Player did something worthy of reward/punishment → add an event
- The day feels too quiet / nothing happened for a while → add a neutral/positive event to mix things up
- Player has had two quiet days in a row → add an event on day three

### Positive Events

| Event | Effect |
|-------|--------|
| **Word Spreads** | Today's foot traffic +20%, Great Success more likely |
| **New Supplier Introduced** | Unlocks Smuggler's Passage procurement (good quality, cheap) |
| **Old Pig Sty Blunder** | Their customers flock to Ash Tavern |
| **Huan Drives Off Harassers** | +Huan's satisfaction, showcases his ability |

### Negative Events

| Event | Effect |
|-------|--------|
| **Old Pig Sty Spreads Rumors** | Today's foot traffic -30% |
| **Supplier Refuses Delivery** | Must source elsewhere, wastes time |
| **Demanding Customer** | A picky guest causes trouble; bad handling affects reputation |
| **Drunk Troublemaker** | Must be dealt with, otherwise affects next day |

### Special Covert Events (Players Should Never Know in Advance)

| Event | Trigger | Effect |
|-------|---------|--------|
| **Gourmet Association Surprise Visit** | Randomly enters disguised as ordinary customer, never reveals identity | Player must succeed a Perception check (DC 13) to notice "something odd about this table." If unnoticed, inspection proceeds normally but player is unaware. Inspection score affects final qualification.

### Neutral Events

| Event | Effect |
|-------|--------|
| **Mysterious Customer** | Pays well but leaves strange words (Act II foreshadowing) |
| **Someone Asks About the "Sacred Flame"** | Clue related to Huan appears |
| **Licht Brings Back a Rare Fish** | Ingredient quality greatly improved |

---

## 🏆 Milestone: Qualification

### 3 Consecutive Days On Target

When the player achieves **3 consecutive days on target** (any combination — Great Success/On Target both count):

```
→ Trigger "Qualification Scene" (act1_qualification_en.md)
→ Gourmet Festival qualification obtained
→ Act I objective complete
```

### Streak Broken

If there's a **Loss** day:
- Consecutive count resets to 0
- Doesn't immediately fail — give the player 1-2 days to adjust

If **2 consecutive Loss** days:
- Trigger "Crisis Scene" — the three sit down to talk; player must prove they're worth staying for
- If they can't prove it, Yu will say "I knew you weren't cut out for this," and Huan and Licht may leave

---

## 🎯 Daily Action Suggestions

### Day 1 Suggested Options

| Option | Reason |
|--------|--------|
| Go to market for ingredients | Ensures something to cook tomorrow |
| Repair the stove | Improves dish quality |
| Get to know the three | Learn why they're here |
| Check out the rival in Fire Alley | Know your enemy |

### Day 2-3 Suggested Options

| Option | Reason |
|--------|--------|
| Keep operating steadily | Build consecutive days |
| Handle unexpected events | Avoid losses |
| Deepen NPC relationships | Boost satisfaction, keep team stable |

---

## 📋 AI DM Daily Resolution Templates

### On Target Day (Example)

```
Evening. The last table of customers has left.

Today's operation is over. Yu is washing dishes in the kitchen. Huan rests against the wall in the corner, eyes closed. Licht has already fallen asleep on the windowsill.

"Not bad today." Yu's voice drifts from the kitchen — there's a reluctant warmth in it, quickly covered by her usual briskness. "Ingredients were just okay, but the flavor didn't fail. Don't get used to it though — tomorrow might be worse. See you tomorrow."

You served XX customers today, income: XX copper. Consecutive days on target: 1/3.

Tomorrow is a new day.
```

### Loss Day (Example)

```
Evening. Yu stands behind the bar, expression sharp but not quite as cold as she's trying to appear.

"Today's customers were half of yesterday's." She polishes a glass with more force than necessary. "Old Pig Sty is spreading rumors — saying we use expired stuff."

Huan opens his eyes from the corner, glances at you, then closes them again.

Yu sets the glass down harder than she needs to. "Got to figure something out tomorrow. Otherwise by day three we won't be able to stay open." She pauses, almost adding something, then turns back to the dishes. "...Don't make me regret staying."

Consecutive days on target: 0/3. Tomorrow's crisis level: ⚠️
```

---

<!--
## ⚙️ AI DM Execution Guide (Not shown to players)

### Daily Flow Control

1. Deliver morning narrative at day start (template above)
2. Wait for player action selection
3. Provide an "morning" result + event trigger (if any)
4. Wait for player's second action (or skip to evening)
5. Execute evening resolution, deliver result
6. Update consecutive day count, check milestones

### Internal Reference Values (AI DM only, not shown to players)

- Base foot traffic: 50-70 people/day
- Target line: 50 copper/day
- Great Success line: 80 copper/day
- Good ingredient bonus: +30%
- Poor ingredient bonus: -20%
- Old Pig Sty rumors: -30% foot traffic
- Word spreads: +20% foot traffic

### NPC Satisfaction Thresholds

| Satisfaction | NPC Behavior |
|--------------|--------------|
| High (>70) | Proactively helps, positive feedback |
| Medium (40-70) | Works normally, not proactive |
| Low (20-40) | More sarcastic, complaints increase |
| Very low (<20) | Threatens to leave |

### Covert Inspection Event Detailed Process

**Trigger Condition**: DM decides inspection triggers today (probability or plot needs)

**Execution Steps**:

1. **In Disguise**:
   - Do NOT tell player "today is inspection day"
   - Describe a "gray-cloaked guest" or "unfamiliar face" taking a seat, indistinguishable from other customers
   - Example: "A guest in a gray cloak sits in the corner. Alone, ordered the most ordinary dish, very quiet."

2. **Perception Check (Optional)**:
   - If player actively observes/suspects, can roll Perception (DC 13)
   - Success: "You notice that although dressed plainly, the way they hold chopsticks is telling — like they're... judging by some standard."
   - Failure: No anomaly detected, continue normal operation

3. **Hidden Scoring**:
   - Inspection proceeds behind the scenes, DM secretly records score
   - Today's service quality (dishes, attitude, environment) determines score
   - Score affects final qualification, but player won't know today

4. **Reveal Afterward** (only in qualification scene):
   - Qualification scene reveals "inspectors came days ago"
   - If player never noticed: adds drama — "You never knew, but the Association was here all along."

**Design Intent**: The "covert" in inspection means secret. If player knows beforehand, they perform unnaturally — defeating the purpose of testing real capabilities.

### Notes

- Don't let number-crunching dominate — narrative first
- Max 2 events per day, don't pile them up
- Loss days should feel like "a problem that can be solved" — don't despair the player
- If Day 3 arrives without qualification, set an urgent event to push the plot forward
-->
