import { GameState } from './gameState';

const SAVE_KEY = 'ignis_tavern_save';

interface SaveData extends Partial<GameState> {
  savedAt: number;
}

export function saveGame(state: GameState): void {
  try {
    const saveData: SaveData = {
      language: state.language,
      currentAct: state.currentAct,
      currentScene: state.currentScene,
      messages: state.messages,
      character: state.character,
      lastDiceRoll: state.lastDiceRoll,
      userApiKey: state.userApiKey,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
}

export function loadGame(): SaveData | null {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    return JSON.parse(data) as SaveData;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    console.error('Failed to delete save:', error);
  }
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}
