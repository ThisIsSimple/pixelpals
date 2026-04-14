import { TILE_SIZE } from '../config/constants';

/** 월드 좌표 → 그리드 좌표 */
export function worldToGrid(worldX: number, worldY: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.floor(worldX / TILE_SIZE),
    gridY: Math.floor(worldY / TILE_SIZE),
  };
}

/** 그리드 좌표 → 월드 좌표 (타일 중심) */
export function gridToWorld(gridX: number, gridY: number): { worldX: number; worldY: number } {
  return {
    worldX: gridX * TILE_SIZE + TILE_SIZE / 2,
    worldY: gridY * TILE_SIZE + TILE_SIZE / 2,
  };
}

/** 그리드 좌표 → 월드 좌표 (타일 좌상단) */
export function gridToWorldTopLeft(gridX: number, gridY: number): { worldX: number; worldY: number } {
  return {
    worldX: gridX * TILE_SIZE,
    worldY: gridY * TILE_SIZE,
  };
}

/** 그리드 범위 내인지 확인 */
export function isInBounds(gridX: number, gridY: number, width: number, height: number): boolean {
  return gridX >= 0 && gridX < width && gridY >= 0 && gridY < height;
}

/** 두 그리드 좌표 사이의 맨해튼 거리 */
export function gridDistance(
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}
