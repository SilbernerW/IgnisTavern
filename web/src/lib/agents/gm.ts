import fs from 'fs';
import path from 'path';

type GamePhase = 'character_creation' | 'opening' | 'act1' | 'act2' | 'act3' | 'ending';

/**
 * Build the GM system prompt for the web version.
 *
 * Progressive loading strategy (mimics skill version's step-by-step reads):
 *
 * The key insight: the skill version loads files on-demand per phase,
 * so the model always sees a focused, lightweight context. The old web
 * version dumped ~12k tokens into a single system message, drowning the
 * scene file in noise.
 *
 * New approach — only load what the current phase actually needs:
 *
 *   character_creation:
 *     system + dm_behavior + web_dm_rules + phase/character_creation
 *     (no world, no characters, no rules, no scene)
 *
 *   opening:
 *     system + dm_behavior + web_dm_rules + phase/opening + scene
 *     (world/characters/rules loaded via scene file's own content;
 *      opening scene already contains all character intros)
 *
 *   act1 (tavern management):
 *     system + dm_behavior + web_dm_rules + phase/act1
 *     + world + characters + rules + scene + closing
 *     (full context needed for mechanics-heavy phase)
 *
 *   act2/act3:
 *     system + dm_behavior + web_dm_rules + phase
 *     + world + characters + rules + scene + closing
 *     (full context, same as act1)
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

  // ── Always loaded: core DM identity ──
  const systemPrompt = readDataFile('prompts', `system_${lang}.md`);
  const dmBehavior = readDataFile('prompts', `dm_behavior_${lang}.md`);
  const webRules = readDataFile('prompts', `web_dm_rules_${lang}.md`);

  // ── Phase instructions (always loaded) ──
  const phaseInstructions = readDataFile('prompts', 'phases', `${phase}_${lang}.md`);

  // ── Conditional: world setting ──
  // Skip for character_creation and opening — opening scene is self-contained
  const needWorld = phase !== 'character_creation' && phase !== 'opening';
  const worldSetting = needWorld ? readDataFile('prompts', `world_${lang}.md`) : '';

  // ── Conditional: character files ──
  // Skip for character_creation and opening — opening scene has all intros
  let characterTexts = '';
  if (phase !== 'character_creation' && phase !== 'opening') {
    const charactersDir = path.join(dataDir, 'prompts', 'characters');
    try {
      const charFiles = fs.readdirSync(charactersDir).filter(f => f.endsWith(`_${lang}.md`));
      for (const file of charFiles) {
        characterTexts += '\n\n---\n\n' + fs.readFileSync(path.join(charactersDir, file), 'utf-8');
      }
    } catch {}
  }

  // ── Conditional: game rules ──
  // Skip for character_creation and opening — no mechanics needed yet
  const needRules = phase !== 'character_creation' && phase !== 'opening';
  const rules = needRules ? readDataFile('rules', `RULES_${lang}.md`) : '';

  // ── Scene files (supports multiple scenes per phase) ──
  let sceneText = '';
  let sceneLabel = '';
  
  // Define scenes for each phase - can be single file or array of files for sequential loading
  const sceneMap: Record<GamePhase, { files: string | string[]; labelZh: string; labelEn: string }> = {
    character_creation: { files: '', labelZh: '', labelEn: '' },
    opening: { files: `act1_opening_${lang}.md`, labelZh: '第一幕开场', labelEn: 'Act I Opening' },
    act1: { files: `act1_tavern_management_${lang}.md`, labelZh: '第一幕酒馆经营', labelEn: 'Act I Tavern Management' },
    act2: { 
      files: [`act2_investigation_${lang}.md`, `act2_revelation_${lang}.md`], 
      labelZh: '第二幕', 
      labelEn: 'Act II' 
    },
    act3: { files: `act3_opening_${lang}.md`, labelZh: '第三幕', labelEn: 'Act III' },
    ending: { files: `act3_endings_${lang}.md`, labelZh: '结局', labelEn: 'Endings' },
  };

  const sceneInfo = sceneMap[phase] || { files: '', labelZh: '', labelEn: '' };
  
  // Load scene(s) - single file or multiple files
  if (sceneInfo.files) {
    const files = Array.isArray(sceneInfo.files) ? sceneInfo.files : [sceneInfo.files];
    const sceneParts: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = readDataFile('scenes', file);
      if (content) {
        // Add separator between multiple scenes
        if (i > 0) {
          sceneParts.push(`\n\n---\n\n## 场景 ${i + 1}\n\n`);
        }
        sceneParts.push(content);
      }
    }
    
    sceneText = sceneParts.join('');
    sceneLabel = lang === 'zh' ? sceneInfo.labelZh : sceneInfo.labelEn;
  }

  // ── Phase-specific closing reminder ──
  const phaseClosingMap: Record<string, Record<string, string>> = {
    zh: {
      character_creation: '⚠️ 最后提醒：输出简短欢迎词后立刻结束，不要引导创建流程。角色创建由前端 UI 处理。',
      opening: '⚠️ 最后提醒：1) 场景文件必须逐字使用 2) 输出🎲检定后立刻停笔，绝不接着写「如果成功…如果失败…」3) 给2-3个选项后等待玩家选择',
      act1: '⚠️ 最后提醒：1) 输出🎲检定后立刻停笔等玩家投骰 2) 追踪营收和NPC 3) 准备进入第二幕时输出 [PHASE_TRANSITION:act2]',
      act2: '⚠️ 最后提醒：1) 输出🎲检定后立刻停笔等玩家投骰 2) 逐步揭露真相 3) 准备进入第三幕时输出 [PHASE_TRANSITION:act3]',
      act3: '⚠️ 最后提醒：1) 输出🎲检定后立刻停笔等玩家投骰 2) 玩家面临最终抉择 3) 故事结束时输出 [PHASE_TRANSITION:ending]',
      ending: '⚠️ 最后提醒：1) 根据玩家的选择走向对应结局 2) 结局必须完整收束 3) 不要再输出 [PHASE_TRANSITION]',
    },
    en: {
      character_creation: '⚠️ REMINDER: Output a brief welcome message then STOP. Do not guide character creation — the front-end UI handles it.',
      opening: '⚠️ REMINDER: 1) Use scene file verbatim 2) After announcing 🎲 Check, STOP immediately — NEVER write "if you succeed/fail" 3) Give 2-3 options, then wait for player',
      act1: '⚠️ REMINDER: 1) After announcing 🎲 Check, STOP immediately and wait for player roll 2) Track revenue and NPCs 3) When ready for Act II output [PHASE_TRANSITION:act2]',
      act2: '⚠️ REMINDER: 1) After announcing 🎲 Check, STOP immediately and wait for player roll 2) Reveal truth gradually 3) When ready for Act III output [PHASE_TRANSITION:act3]',
      act3: '⚠️ REMINDER: 1) After announcing 🎲 Check, STOP immediately and wait for player roll 2) Player faces final choice 3) When story ends output [PHASE_TRANSITION:ending]',
      ending: '⚠️ REMINDER: 1) Lead to the ending matching the player\'s choice 2) The ending must fully resolve the story 3) Do NOT output [PHASE_TRANSITION] anymore',
    },
  };

  const phaseSpecificClosing = phaseClosingMap[lang]?.[phase] || '';

  // ── Compose ──
  const parts: string[] = [];

  if (systemPrompt) parts.push(systemPrompt);
  if (dmBehavior) parts.push('\n\n' + dmBehavior);
  if (webRules) parts.push('\n\n' + webRules);
  if (phaseInstructions) parts.push('\n\n' + phaseInstructions);
  if (worldSetting) parts.push('\n\n## 世界设定\n\n' + worldSetting);
  if (characterTexts) parts.push('\n\n## 角色设定\n\n' + characterTexts);
  if (rules) parts.push('\n\n## 游戏规则\n\n' + rules);
  if (sceneText) {
    // Opening scene gets extra emphasis on verbatim copy
    const emphasis = phase === 'opening'
      ? `【⚠️ 极重要：以下场景内容是你必须逐字照搬的唯一来源。场景文件没写的物品/事件/对话，你绝不能编造。不要自行添加任何场景文件中不存在的内容！开场场景中的每一句描写、每一个NPC台词都必须与场景文件原文一致！】`
      : `【⚠️ 极重要：以下场景内容是你必须逐字照搬的唯一来源。场景文件没写的物品/事件/对话，你绝不能编造。不要自行添加任何场景文件中不存在的内容！】`;
    parts.push(`\n\n## 当前场景：${sceneLabel}\n\n${emphasis}\n\n${sceneText}`);
  }
  if (phaseSpecificClosing) parts.push('\n\n---\n\n' + phaseSpecificClosing);

  return parts.join('');
}
