export type DiceState = 'idle' | 'awaiting_roll' | 'roll_resolved';

export interface DiceCheck {
  attribute: string;  // 'str' | 'dex' | 'int' | 'cha'
  dc: number;
  label: string;      // e.g. '体魄' or 'STR'
}

export interface DiceRollResult {
  roll: number;       // d20 result
  modifier: number;   // attribute modifier
  total: number;      // roll + modifier
  dc: number;
  success: boolean;
}

/**
 * Dice state machine — front-end controls when dice checks happen.
 * 
 * State transitions:
 *   idle → awaiting_roll:   When DM output contains 🎲 check request AND we're in idle
 *   awaiting_roll → roll_resolved: Player clicks roll button
 *   roll_resolved → idle:  After DM processes the result (next user message)
 *   
 * DC regex should ONLY be checked when state is 'idle'.
 * When in 'awaiting_roll' or 'roll_resolved', DC patterns are ignored.
 */

// Attribute modifier calculation
export function getModifier(statValue: number): number {
  return Math.floor((statValue - 10) / 2);
}

// Parse dice check from DM output (only call when state is 'idle')
export function parseDiceCheck(text: string): DiceCheck | null {
  const patterns = [
    /🎲\s*检定[：:]\s*(\S+)\s*DC\s*(\d+)/i,
    /🎲\s*Check[：:]\s*(\S+)\s*DC\s*(\d+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const label = match[1];
      const dc = parseInt(match[2]);
      const attribute = mapLabelToAttribute(label);
      return { attribute, dc, label };
    }
  }
  return null;
}

// Map Chinese/English attribute names to keys
function mapLabelToAttribute(label: string): string {
  const map: Record<string, string> = {
    '体魄': 'str', 'STR': 'str', 'str': 'str',
    '敏捷': 'dex', 'DEX': 'dex', 'dex': 'dex',
    '心智': 'int', 'INT': 'int', 'int': 'int',
    '魅力': 'cha', 'CHA': 'cha', 'cha': 'cha',
  };
  return map[label] || 'str'; // default fallback
}

// Calculate roll result
export function calculateRollResult(
  roll: number,
  statValue: number,
  dc: number,
): DiceRollResult {
  const modifier = getModifier(statValue);
  const total = roll + modifier;
  return {
    roll,
    modifier,
    total,
    dc,
    success: total >= dc,
  };
}

// Format roll result as message to send to DM
export function formatRollMessage(result: DiceRollResult, language: 'zh' | 'en'): string {
  if (language === 'zh') {
    return `[骰子结果：d20=${result.roll}+${result.modifier}=${result.total} vs DC${result.dc} → ${result.success ? '成功' : '失败'}]`;
  }
  return `[Dice result: d20=${result.roll}+${result.modifier}=${result.total} vs DC${result.dc} → ${result.success ? 'Success' : 'Failure'}]`;
}
