import fs from 'fs';
import path from 'path';

type GamePhase = 'character_creation' | 'opening' | 'act1' | 'act2' | 'act3';

/**
 * Build the GM system prompt for the web version.
 *
 * Strategy: dump ALL relevant content into one system prompt, just like the skill
 * version does with SKILL.md. Small models need full context to avoid hallucination —
 * cherry-picking files per phase causes more problems than it solves.
 *
 * Prompt composition order:
 *   1. system_{lang}.md         — DM persona + core responsibilities
 *   2. dm_behavior_{lang}.md    — detailed behavior rules (NPC, choices, pacing, templates)
 *   3. web_dm_rules_{lang}.md   — web-specific rules (dice, identity, scene verbatim)
 *   4. phases/{phase}_{lang}.md — current phase instructions
 *   5. world_{lang}.md          — world setting
 *   6. characters/*_{lang}.md   — ALL NPC details (no spoiler gating — model needs context)
 *   7. RULES_{lang}.md          — full game rules
 *   8. scenes/act*_{lang}.md    — current scene script
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

  // 1. Base DM system prompt
  const systemPrompt = readDataFile('prompts', `system_${lang}.md`);

  // 2. Detailed DM behavior rules
  const dmBehavior = readDataFile('prompts', `dm_behavior_${lang}.md`);

  // 3. Web-specific DM rules
  const webRules = readDataFile('prompts', `web_dm_rules_${lang}.md`);

  // 4. Phase-specific instructions
  const phaseInstructions = readDataFile('prompts', 'phases', `${phase}_${lang}.md`);

  // 5. World setting
  const worldSetting = readDataFile('prompts', `world_${lang}.md`);

  // 6. ALL character files — include even during character creation
  // Small models need full NPC context to not hallucinate (e.g. Licht = seal)
  const charactersDir = path.join(dataDir, 'prompts', 'characters');
  let characterTexts = '';
  try {
    const charFiles = fs.readdirSync(charactersDir).filter(f => f.endsWith(`_${lang}.md`));
    for (const file of charFiles) {
      characterTexts += '\n\n---\n\n' + fs.readFileSync(path.join(charactersDir, file), 'utf-8');
    }
  } catch {
    // Characters directory might not exist
  }

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

  // Compose — dump everything, let the model figure it out
  const parts: string[] = [];

  if (systemPrompt) parts.push(systemPrompt);
  if (dmBehavior) parts.push('\n\n' + dmBehavior);
  if (webRules) parts.push('\n\n' + webRules);
  if (phaseInstructions) parts.push('\n\n' + phaseInstructions);
  if (worldSetting) parts.push('\n\n## 世界设定\n\n' + worldSetting);
  if (characterTexts) parts.push('\n\n## 角色设定\n\n' + characterTexts);
  if (rules) parts.push('\n\n## 游戏规则\n\n' + rules);
  if (sceneText) parts.push(`\n\n## 当前场景：${sceneLabel}\n\n【重要：以下内容必须逐字使用，不得改写】\n\n${sceneText}`);

  return parts.join('');
}
