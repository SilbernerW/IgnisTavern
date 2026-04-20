import fs from 'fs';
import path from 'path';

type GamePhase = 'character_creation' | 'opening' | 'act1' | 'act2' | 'act3';

/**
 * Build the GM system prompt for the web version.
 *
 * Composition order (optimized for small models):
 *   1. system_{lang}.md         — DM persona + ABSOLUTE RULES (primacy effect)
 *   2. dm_behavior_{lang}.md    — behavioral constraints (no settings/rules/numbers)
 *   3. web_dm_rules_{lang}.md   — web-specific rules
 *   4. phases/{phase}_{lang}.md — current phase instructions
 *   5. world_{lang}.md          — world setting (spoilers gated)
 *   6. characters/*_{lang}.md   — NPC details
 *   7. RULES_{lang}.md          — game rules (DC, HP, skills, etc.)
 *   8. scenes/act*_{lang}.md    — current scene script
 *   9. ABSOLUTE RULES repeat    — restate top 5 rules at the end (recency effect)
 */
export function buildGMPrompt(language: string, phase: GamePhase = 'character_creation'): string {
  const lang = language === 'zh' ? 'zh' : 'en';
  const dataDir = path.join(process.cwd(), 'src', 'data');

  function readDataFile(...segments: string[]): string {
    const filePath = path.join(dataDir, ...segments);
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return '';
    }
  }

  // 1. Base DM system prompt (contains ABSOLUTE RULES at top)
  const systemPrompt = readDataFile('prompts', `system_${lang}.md`);

  // 2. Behavioral constraints
  const dmBehavior = readDataFile('prompts', `dm_behavior_${lang}.md`);

  // 3. Web-specific rules
  const webRules = readDataFile('prompts', `web_dm_rules_${lang}.md`);

  // 4. Phase-specific instructions
  const phaseInstructions = readDataFile('prompts', 'phases', `${phase}_${lang}.md`);

  // 5. World setting (spoilers gated in "DM Internal Reference" section)
  const worldSetting = readDataFile('prompts', `world_${lang}.md`);

  // 6. ALL character files
  const charactersDir = path.join(dataDir, 'prompts', 'characters');
  let characterTexts = '';
  try {
    const charFiles = fs.readdirSync(charactersDir).filter(f => f.endsWith(`_${lang}.md`));
    for (const file of charFiles) {
      characterTexts += '\n\n---\n\n' + fs.readFileSync(path.join(charactersDir, file), 'utf-8');
    }
  } catch {}

  // 7. Full game rules
  const rules = readDataFile('rules', `RULES_${lang}.md`);

  // 8. Current scene script
  let sceneText = '';
  let sceneLabel = '';
  const sceneMap: Record<GamePhase, { file: string; labelZh: string; labelEn: string }> = {
    character_creation: { file: '', labelZh: '', labelEn: '' },
    opening: { file: `act1_opening_${lang}.md`, labelZh: '第一幕开场', labelEn: 'Act I Opening' },
    act1: { file: `act1_tavern_management_${lang}.md`, labelZh: '第一幕酒馆经营', labelEn: 'Act I Tavern Management' },
    act2: { file: `act2_revelation_${lang}.md`, labelZh: '第二幕', labelEn: 'Act II' },
    act3: { file: `act3_opening_${lang}.md`, labelZh: '第三幕', labelEn: 'Act III' },
  };

  const sceneInfo = sceneMap[phase];
  if (sceneInfo.file) {
    sceneText = readDataFile('scenes', sceneInfo.file);
    sceneLabel = lang === 'zh' ? sceneInfo.labelZh : sceneInfo.labelEn;
  }

  // 9. Repeated absolute rules at the end (recency effect for small models)
  const closingReminder = lang === 'zh'
    ? `\n\n---\n\n## ⚠️ 再次提醒（必须遵守）\n\n1. Licht 是海豹，不是人。用"它"，描述鳍足和圆滚滚的身体\n2. 不剧透——当前阶段未揭示的内容绝口不提\n3. 不自己投骰——宣布检定后停下来等玩家\n4. 场景文件是真相源——逐字使用，不得改写\n5. 你是DM，不是AI`
    : `\n\n---\n\n## ⚠️ REMINDER (Must Follow)\n\n1. Licht is a SEAL, not a human. Use "it", describe flippers and round body\n2. No spoilers — never mention content not yet revealed in the current act\n3. Never roll dice yourself — announce check then STOP and wait\n4. Scene files are source of truth — use verbatim, do not paraphrase\n5. You are the DM, not an AI`;

  // Compose
  const parts: string[] = [];

  if (systemPrompt) parts.push(systemPrompt);
  if (dmBehavior) parts.push('\n\n' + dmBehavior);
  if (webRules) parts.push('\n\n' + webRules);
  if (phaseInstructions) parts.push('\n\n' + phaseInstructions);
  if (worldSetting) parts.push('\n\n## 世界设定\n\n' + worldSetting);
  if (characterTexts) parts.push('\n\n## 角色设定\n\n' + characterTexts);
  if (rules) parts.push('\n\n## 游戏规则\n\n' + rules);
  if (sceneText) parts.push(`\n\n## 当前场景：${sceneLabel}\n\n【重要：以下内容必须逐字使用，不得改写】\n\n${sceneText}`);
  parts.push(closingReminder);

  return parts.join('');
}
