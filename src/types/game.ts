/** 게임 공통 타입 정의 */

/** 유저 프로필 */
export interface UserProfile {
  id: string;
  nickname: string;
  isCreator: boolean;
  currency: number;
  creatorLevel: CreatorLevel;
  joinedAt: number;
}

export type CreatorLevel = 'newbie' | 'popular' | 'star' | 'legend';

/** 퀘스트 */
export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  target: number;
  progress: number;
  reward: QuestReward;
  completed: boolean;
  expiresAt: number;
}

export interface QuestReward {
  currency?: number;
  gachaTickets?: number;
  characterDesignId?: string;
}

/** 던전 정의 */
export interface DungeonDef {
  id: string;
  name: string;
  description: string;
  difficulty: number;           // 1~10
  waves: DungeonWave[];
  rewards: DungeonReward;
  requiredPartySize: number;
  minStatTotal: number;         // 권장 파티 스탯 합계
}

export interface DungeonWave {
  enemies: DungeonEnemy[];
}

export interface DungeonEnemy {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  spriteKey: string;
}

export interface DungeonReward {
  currency: { min: number; max: number };
  characterFragments: { designId: string; count: number; probability: number }[];
}

/** 씬 키 열거 — Phaser 게임 월드 씬만 남김 (나머지는 React 페이지로 이동) */
export type SceneKey =
  | 'BootScene'
  | 'SpaceScene'
  | 'DungeonScene'
  | 'GatheringScene';

/** React 페이지 경로 */
export type PagePath =
  | '/'
  | '/editor'
  | '/gacha'
  | '/collection'
  | '/space'
  | '/dungeon';
