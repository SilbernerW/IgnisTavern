export type Language = 'zh' | 'en';

export interface Character {
  name: string;
  nameEn: string;
  portrait?: string;
  stats: {
    str: number;
    dex: number;
    int: number;
    cha: number;
    hp: number;
    maxHp: number;
  };
  skills: string[];
  inventory: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface NPCRelation {
  name: string;       // 'yu' | 'huan' | 'licht'
  satisfaction: number; // 0-100, hidden from player
  status: 'active' | 'left'; // whether NPC is still at tavern
}

export interface GameMechanics {
  dayNumber: number;           // Current in-game day
  consecutiveRevenueDays: number; // Days hitting revenue target
  revenueTarget: number;       // Daily revenue target
  todayRevenue: number;        // Today's revenue so far
  xp: number;                  // Experience points
  inspectionPassed: boolean;   // Whether inspection was passed
}

export type DiceState = 'idle' | 'awaiting_roll' | 'roll_resolved';

export interface GameState {
  language: Language;
  currentAct: number;
  currentScene: string;
  messages: ChatMessage[];         // Full conversation history for LLM context
  displayedText: string;           // Currently displayed assistant text (for typewriter)
  character: Character;
  isTyping: boolean;
  isStreaming: boolean;
  lastDiceRoll?: {
    result: number;
    success: boolean;
    difficulty: number;
  };
  userApiKey?: string;
  provider?: string;
  model?: string;
  customApiUrl?: string;
  apiMode?: 'default' | 'custom';
  npcRelations: NPCRelation[];
  mechanics: GameMechanics;
  diceState: DiceState;
  currentCheck?: {
    attribute: string;  // 'str' | 'dex' | 'int' | 'cha'
    dc: number;
    label: string;      // e.g. '体魄' or 'STR'
  };
}

const defaultCharacter: Character = {
  name: '',
  nameEn: '',
  stats: {
    str: 0,
    dex: 0,
    int: 0,
    cha: 0,
    hp: 0,
    maxHp: 0,
  },
  skills: [],
  inventory: [],
};

const defaultNPCRelations: NPCRelation[] = [
  { name: 'yu', satisfaction: 50, status: 'active' },
  { name: 'huan', satisfaction: 50, status: 'active' },
  { name: 'licht', satisfaction: 50, status: 'active' },
];

const defaultGameMechanics: GameMechanics = {
  dayNumber: 1,
  consecutiveRevenueDays: 0,
  revenueTarget: 100,
  todayRevenue: 0,
  xp: 0,
  inspectionPassed: false,
};

export const createInitialGameState = (): GameState => ({
  language: 'zh',
  currentAct: 1,
  currentScene: 'language_select',
  messages: [],
  displayedText: '',
  character: { ...defaultCharacter },
  isTyping: false,
  isStreaming: false,
  npcRelations: [...defaultNPCRelations],
  mechanics: { ...defaultGameMechanics },
  diceState: 'idle',
  currentCheck: undefined,
});

export const gameStateReducer = (
  state: GameState,
  action:
    | { type: 'SET_LANGUAGE'; payload: Language }
    | { type: 'ADD_USER_MESSAGE'; payload: string }
    | { type: 'ADD_ASSISTANT_MESSAGE'; payload: string }
    | { type: 'APPEND_STREAMING_TEXT'; payload: string }
    | { type: 'FINISH_STREAMING'; payload: string }
    | { type: 'SET_TYPING'; payload: boolean }
    | { type: 'SET_STREAMING'; payload: boolean }
    | { type: 'SET_DICE_ROLL'; payload: GameState['lastDiceRoll'] }
    | { type: 'UPDATE_CHARACTER'; payload: Partial<Character> }
    | { type: 'SET_ACT'; payload: number }
    | { type: 'SET_SCENE'; payload: string }
    | { type: 'SET_API_KEY'; payload: string }
    | { type: 'SET_PROVIDER'; payload: string }
    | { type: 'SET_MODEL'; payload: string }
    | { type: 'SET_CUSTOM_API_URL'; payload: string }
    | { type: 'SET_API_MODE'; payload: 'default' | 'custom' }
    | { type: 'UPDATE_CHARACTER_STATS'; payload: Partial<Character['stats']> }
    | { type: 'UPDATE_CHARACTER_SKILLS'; payload: string[] }
    | { type: 'ADD_CHARACTER_SKILL'; payload: string }
    | { type: 'UPDATE_CHARACTER_INVENTORY'; payload: string[] }
    | { type: 'ADD_INVENTORY_ITEM'; payload: string }
    | { type: 'REMOVE_INVENTORY_ITEM'; payload: string }
    | { type: 'SET_CHARACTER_NAME'; payload: { name: string; nameEn: string } }
    | { type: 'SET_NPC_SATISFACTION'; payload: { npcName: string; satisfaction: number } }
    | { type: 'SET_NPC_STATUS'; payload: { npcName: string; status: 'active' | 'left' } }
    | { type: 'SET_DICE_STATE'; payload: DiceState }
    | { type: 'SET_CURRENT_CHECK'; payload: { attribute: string; dc: number; label: string } | null }
    | { type: 'ADVANCE_DAY' }
    | { type: 'ADD_REVENUE'; payload: number }
    | { type: 'ADD_XP'; payload: number }
    | { type: 'SET_INSPECTION_PASSED'; payload: boolean }
    | { type: 'HEAL_CHARACTER'; payload: number }
    | { type: 'DAMAGE_CHARACTER'; payload: number }
    | { type: 'RESET_STATE' }
): GameState => {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'ADD_USER_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, { role: 'user', content: action.payload }],
      };
    case 'ADD_ASSISTANT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, { role: 'assistant', content: action.payload }],
      };
    case 'APPEND_STREAMING_TEXT':
      return {
        ...state,
        displayedText: state.displayedText + action.payload,
      };
    case 'FINISH_STREAMING':
      return {
        ...state,
        isStreaming: false,
        displayedText: '',
        messages: [...state.messages, { role: 'assistant', content: action.payload }],
      };
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    case 'SET_STREAMING':
      return { ...state, isStreaming: action.payload };
    case 'SET_DICE_ROLL':
      return { ...state, lastDiceRoll: action.payload };
    case 'UPDATE_CHARACTER':
      return { ...state, character: { ...state.character, ...action.payload } };
    case 'SET_ACT':
      return { ...state, currentAct: action.payload };
    case 'SET_SCENE':
      return { ...state, currentScene: action.payload };
    case 'SET_API_KEY':
      return { ...state, userApiKey: action.payload };
    case 'SET_PROVIDER':
      return { ...state, provider: action.payload };
    case 'SET_MODEL':
      return { ...state, model: action.payload };
    case 'SET_CUSTOM_API_URL':
      return { ...state, customApiUrl: action.payload };
    case 'SET_API_MODE':
      return { ...state, apiMode: action.payload };
    case 'UPDATE_CHARACTER_STATS':
      return { ...state, character: { ...state.character, stats: { ...state.character.stats, ...action.payload } } };
    case 'UPDATE_CHARACTER_SKILLS':
      return { ...state, character: { ...state.character, skills: action.payload } };
    case 'ADD_CHARACTER_SKILL':
      if (state.character.skills.includes(action.payload)) return state;
      return { ...state, character: { ...state.character, skills: [...state.character.skills, action.payload] } };
    case 'UPDATE_CHARACTER_INVENTORY':
      return { ...state, character: { ...state.character, inventory: action.payload } };
    case 'ADD_INVENTORY_ITEM':
      if (state.character.inventory.includes(action.payload)) return state;
      return { ...state, character: { ...state.character, inventory: [...state.character.inventory, action.payload] } };
    case 'REMOVE_INVENTORY_ITEM':
      return { ...state, character: { ...state.character, inventory: state.character.inventory.filter(i => i !== action.payload) } };
    case 'SET_CHARACTER_NAME':
      return { ...state, character: { ...state.character, name: action.payload.name, nameEn: action.payload.nameEn } };
    case 'SET_NPC_SATISFACTION':
      return {
        ...state,
        npcRelations: state.npcRelations.map(npc =>
          npc.name === action.payload.npcName
            ? { ...npc, satisfaction: Math.max(0, Math.min(100, action.payload.satisfaction)) }
            : npc
        ),
      };
    case 'SET_NPC_STATUS':
      return {
        ...state,
        npcRelations: state.npcRelations.map(npc =>
          npc.name === action.payload.npcName
            ? { ...npc, status: action.payload.status }
            : npc
        ),
      };
    case 'SET_DICE_STATE':
      return { ...state, diceState: action.payload };
    case 'SET_CURRENT_CHECK':
      return { ...state, currentCheck: action.payload ?? undefined };
    case 'ADVANCE_DAY':
      return {
        ...state,
        mechanics: {
          ...state.mechanics,
          dayNumber: state.mechanics.dayNumber + 1,
          todayRevenue: 0,
        },
      };
    case 'ADD_REVENUE': {
      const newRevenue = state.mechanics.todayRevenue + action.payload;
      const targetMet = newRevenue >= state.mechanics.revenueTarget;
      const wasTargetMetToday = state.mechanics.todayRevenue >= state.mechanics.revenueTarget;
      return {
        ...state,
        mechanics: {
          ...state.mechanics,
          todayRevenue: newRevenue,
          consecutiveRevenueDays: targetMet
            ? wasTargetMetToday
              ? state.mechanics.consecutiveRevenueDays
              : state.mechanics.consecutiveRevenueDays + 1
            : 0,
        },
      };
    }
    case 'ADD_XP':
      return {
        ...state,
        mechanics: { ...state.mechanics, xp: state.mechanics.xp + action.payload },
      };
    case 'SET_INSPECTION_PASSED':
      return {
        ...state,
        mechanics: { ...state.mechanics, inspectionPassed: action.payload },
      };
    case 'HEAL_CHARACTER':
      return {
        ...state,
        character: {
          ...state.character,
          stats: {
            ...state.character.stats,
            hp: Math.min(state.character.stats.maxHp, state.character.stats.hp + action.payload),
          },
        },
      };
    case 'DAMAGE_CHARACTER':
      return {
        ...state,
        character: {
          ...state.character,
          stats: {
            ...state.character.stats,
            hp: Math.max(0, state.character.stats.hp - action.payload),
          },
        },
      };
    case 'RESET_STATE':
      return createInitialGameState();
    default:
      return state;
  }
};
