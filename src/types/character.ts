/** 캐릭터 시스템 타입 정의 */

import { PERSONALITIES } from '../config/constants';

/** 성격 타입 */
export type Personality = (typeof PERSONALITIES)[number];

/** 캐릭터 스탯 */
export interface CharacterStats {
  str: number; // 힘: 던전 전투력
  dex: number; // 민첩: 채집/낚시 성공률
  int: number; // 지능: 퀘스트 보상
  cha: number; // 매력: 교류 효과
  luk: number; // 행운: 드롭률/크리티컬
}

/** 캐릭터 설계서 — 크리에이터가 만든 원본 */
export interface CharacterDesign {
  id: string;
  name: string;
  creatorId: string;
  rarity: string;               // 크리에이터 정의 등급명
  rarityTier: number;           // 등급 순위 (높을수록 희귀)
  description: string;
  spriteData: string;           // base64 PNG 또는 dataURL
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  canvasSize: 16 | 24 | 32;
  createdAt: number;
  colorVariantEnabled: boolean; // 색상 변이 허용 여부
}

/** 캐릭터 인스턴스 — 실제 소유하는 개체 */
export interface CharacterInstance {
  instanceId: string;
  designId: string;
  ownerId: string;
  personality: Personality;
  stats: CharacterStats;
  traits: string[];
  colorVariant?: PaletteSwap;
  obtainedAt: number;
  obtainedFrom: ObtainSource;
}

export type ObtainSource = 'gacha' | 'dungeon' | 'gathering' | 'quest' | 'trade';

/** 색상 변이 (팔레트 스왑) */
export interface PaletteSwap {
  originalColors: string[];
  swappedColors: string[];
}
