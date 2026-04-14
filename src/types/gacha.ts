/** 가챠 시스템 타입 정의 */

/** 가챠 머신 설정 — 크리에이터가 구성 */
export interface GachaMachineConfig {
  machineId: string;
  creatorId: string;
  name: string;
  entries: GachaEntry[];
  costPerPull: number;
  ceilingEnabled: boolean;
  ceilingCount: number;        // 천장 카운트 (0이면 무제한)
  animation: GachaAnimation;
}

/** 가챠 테이블 항목 */
export interface GachaEntry {
  characterDesignId: string;
  rarityLabel: string;          // 크리에이터 지정 등급명
  probability: number;          // 0.0 ~ 1.0 (전체 합 = 1.0)
  rarityTier: number;           // 정렬/천장용 등급 순위
}

/** 가챠 연출 설정 */
export interface GachaAnimation {
  backgroundColor: string;
  effectType: 'sparkle' | 'fire' | 'rainbow' | 'simple';
  soundEffect: string;
}

/** 가챠 결과 */
export interface GachaResult {
  characterDesignId: string;
  rarityLabel: string;
  rarityTier: number;
  stats: import('./character').CharacterStats;
  personality: import('./character').Personality;
  traits: string[];
  instanceId: string;
}

/** 가챠 풀 기록 (천장 카운트용) */
export interface GachaPullRecord {
  machineId: string;
  userId: string;
  pullCount: number;            // 현재까지 뽑은 횟수
  lastHighestTierPull: number;  // 마지막으로 최고 등급 뽑은 시점
}
