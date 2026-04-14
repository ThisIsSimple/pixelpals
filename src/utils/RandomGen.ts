import { STAT_MIN, STAT_MAX, PERSONALITIES } from '../config/constants';
import type { CharacterStats, Personality } from '../types/character';

/** min~max 사이 정수 랜덤 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 배열에서 랜덤 요소 선택 */
export function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 가중치 기반 랜덤 선택 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** 캐릭터 스탯 랜덤 생성 */
export function generateStats(): CharacterStats {
  return {
    str: randomInt(STAT_MIN, STAT_MAX),
    dex: randomInt(STAT_MIN, STAT_MAX),
    int: randomInt(STAT_MIN, STAT_MAX),
    cha: randomInt(STAT_MIN, STAT_MAX),
    luk: randomInt(STAT_MIN, STAT_MAX),
  };
}

/** 성격 랜덤 선택 */
export function generatePersonality(): Personality {
  return randomPick(PERSONALITIES);
}

/** 특성 목록에서 1~2개 랜덤 선택 */
const TRAIT_POOL = [
  '아침형 인간', '미식가', '겁쟁이', '수집광', '낚시 천재',
  '독서광', '운동광', '잠꾸러기', '모험가', '수다쟁이',
  '예술가', '요리사', '탐험가', '평화주의자', '전략가',
];

export function generateTraits(): string[] {
  const count = randomInt(1, 2);
  const shuffled = [...TRAIT_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** 고유 ID 생성 */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
