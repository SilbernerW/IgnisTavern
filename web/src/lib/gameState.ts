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
}

const defaultCharacter: Character = {
  name: '酒馆老板',
  nameEn: 'Tavern Keeper',
  stats: {
    str: 10,
    dex: 10,
    int: 10,
    cha: 10,
    hp: 6,
    maxHp: 6,
  },
  skills: [],
  inventory: ['一本破旧的账本', '神秘的钥匙'],
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
    case 'RESET_STATE':
      return createInitialGameState();
    default:
      return state;
  }
};
