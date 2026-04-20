import fs from 'fs';
import path from 'path';

type GamePhase = 'character_creation' | 'opening' | 'act1' | 'act2' | 'act3';

/**
 * Build the GM system prompt for the web version.
 *
 * Composition order (optimized for small models):
 *   1. system_{lang}.md         — DM persona + ABSOLUTE RULES (primacy effect)
 *   2. dm_behavior_{lang}.md    — behavioral constraints
 *   3. web_dm_rules_{lang}.md   — web-specific rules
 *   4. phases/{phase}_{lang}.md — current phase instructions
 *   5. world_{lang}.md          — world setting (skip for character_creation)
 *   6. characters/*_{lang}.md   — NPC details (skip for character_creation)
 *   7. RULES_{lang}.md          — game rules (skip for character_creation)
 *   8. scenes/act*_{lang}.md    — current scene script
 *   9. Phase-specific closing reminder (recency effect)
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

  // 5. World setting — skip for character_creation to prevent premature narration
  const worldSetting = phase !== 'character_creation'
    ? readDataFile('prompts', `world_${lang}.md`)
    : '';

  // 6. ALL character files — skip for character_creation
  let characterTexts = '';
  if (phase !== 'character_creation') {
    const charactersDir = path.join(dataDir, 'prompts', 'characters');
    try {
      const charFiles = fs.readdirSync(charactersDir).filter(f => f.endsWith(`_${lang}.md`));
      for (const file of charFiles) {
        characterTexts += '\n\n---\n\n' + fs.readFileSync(path.join(charactersDir, file), 'utf-8');
      }
    } catch {}
  }

  // 7. Full game rules — skip for character_creation
  const rules = phase !== 'character_creation'
    ? readDataFile('rules', `RULES_${lang}.md`)
    : '';

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

  const sceneInfo = sceneMap[phase] || { file: '', labelZh: '', labelEn: '' };
  if (sceneInfo.file) {
    sceneText = readDataFile('scenes', sceneInfo.file);
    sceneLabel = lang === 'zh' ? sceneInfo.labelZh : sceneInfo.labelEn;
  }

  // 9. Phase-specific closing reminder (recency effect for small models)
  const phaseClosingMap: Record<string, Record<string, string>> = {
    zh: {
      character_creation: '⚠️ 最后提醒：你现在是角色创建阶段！只帮玩家建角色，不要讲故事！展示完整角色卡后输出 [PHASE_TRANSITION:opening]',
      opening: '⚠️ 最后提醒：你现在开始开场叙事！场景文件必须逐字使用，给2-3个选项后输出 [PHASE_TRANSITION:act1]',
      act1: '⚠️ 最后提醒：你在第一幕酒馆经营阶段！追踪营收和NPC，准备进入第二幕时输出 [PHASE_TRANSITION:act2]',
      act2: '⚠️ 最后提醒：你在第二幕！逐步揭露真相，准备进入第三幕时输出 [PHASE_TRANSITION:act3]',
      act3: '⚠️ 最后提醒：你在第三幕！玩家面临最终抉择，故事结束时输出 [PHASE_TRANSITION:ending]',
    },
    en: {
      character_creation: '⚠️ REMINDER: You are in CHARACTER CREATION! Only build the character, DO NOT narrate! After showing complete character sheet, output [PHASE_TRANSITION:opening]',
      opening: '⚠️ REMINDER: Begin the opening narrative! Use scene file verbatim, give 2-3 options, then output [PHASE_TRANSITION:act1]',
      act1: '⚠️ REMINDER: You are in Act I tavern management! Track revenue and NPCs, when ready for Act II output [PHASE_TRANSITION:act2]',
      act2: '⚠️ REMINDER: You are in Act II! Reveal truth gradually, when ready for Act III output [PHASE_TRANSITION:act3]',
      act3: '⚠️ REMINDER: You are in Act III! Player faces final choice, when story ends output [PHASE_TRANSITION:ending]',
    },
  };

  const phaseSpecificClosing = phaseClosingMap[lang]?.[phase] || '';

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
  if (phaseSpecificClosing) parts.push('\n\n---\n\n' + phaseSpecificClosing);

  return parts.join('');
}
