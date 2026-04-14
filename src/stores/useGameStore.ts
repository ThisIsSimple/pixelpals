import { create } from 'zustand';
import type { SceneKey } from '../types/game';
import type { CharacterInstance } from '../types/character';
import { STARTING_CURRENCY } from '../config/constants';

interface GameState {
  // 유저
  userId: string;
  nickname: string;
  currency: number;
  isCreator: boolean;

  // 게임 상태
  currentScene: SceneKey | null;
  isGameReady: boolean;

  // 컬렉션
  ownedCharacters: CharacterInstance[];

  // 액션
  setCurrency: (amount: number) => void;
  spendCurrency: (amount: number) => boolean;
  earnCurrency: (amount: number) => void;
  setCurrentScene: (scene: SceneKey) => void;
  setGameReady: (ready: boolean) => void;
  addCharacter: (character: CharacterInstance) => void;
  removeCharacter: (instanceId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  userId: 'local-player',
  nickname: '플레이어',
  currency: STARTING_CURRENCY,
  isCreator: true,
  currentScene: null,
  isGameReady: false,
  ownedCharacters: [],

  setCurrency: (amount) => set({ currency: amount }),

  spendCurrency: (amount) => {
    const { currency } = get();
    if (currency < amount) return false;
    set({ currency: currency - amount });
    return true;
  },

  earnCurrency: (amount) => {
    set((state) => ({ currency: state.currency + amount }));
  },

  setCurrentScene: (scene) => set({ currentScene: scene }),
  setGameReady: (ready) => set({ isGameReady: ready }),

  addCharacter: (character) => {
    set((state) => ({
      ownedCharacters: [...state.ownedCharacters, character],
    }));
  },

  removeCharacter: (instanceId) => {
    set((state) => ({
      ownedCharacters: state.ownedCharacters.filter((c) => c.instanceId !== instanceId),
    }));
  },
}));
