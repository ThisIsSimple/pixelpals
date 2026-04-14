/** 공간 시스템 타입 정의 */

export type SpaceTheme = 'forest' | 'city' | 'beach' | 'space' | 'default';

/** 배치된 오브젝트 (가구/장식) */
export interface PlacedObject {
  id: string;
  objectType: string;
  gridX: number;
  gridY: number;
  spriteKey: string;
}

/** 배치된 캐릭터 */
export interface PlacedCharacter {
  instanceId: string;
  gridX: number;
  gridY: number;
}

/** 배치된 가챠 머신 */
export interface PlacedGachaMachine {
  machineId: string;
  gridX: number;
  gridY: number;
}

/** 개인 공간 설정 */
export interface SpaceConfig {
  ownerId: string;
  name: string;
  width: number;
  height: number;
  theme: SpaceTheme;
  tiles: number[][];            // 바닥 타일 인덱스
  walls: number[][];            // 벽 타일 인덱스
  furniture: PlacedObject[];
  characters: PlacedCharacter[];
  gachaMachines: PlacedGachaMachine[];
  createdAt: number;
  updatedAt: number;
}

/** 방문 기록 */
export interface VisitRecord {
  visitorId: string;
  spaceOwnerId: string;
  visitedAt: number;
  leftLike: boolean;
  guestbookMessage?: string;
}
