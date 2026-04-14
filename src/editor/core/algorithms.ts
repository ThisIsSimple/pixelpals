/**
 * 픽셀 에디터 핵심 알고리즘
 * - Bresenham 라인
 * - Midpoint Circle
 * - FloodFill (BFS)
 * - 픽셀 퍼펙트 보정
 */

/** Bresenham 라인 알고리즘 — 두 점 사이 모든 픽셀 좌표 반환 */
export function bresenhamLine(
  x0: number, y0: number,
  x1: number, y1: number,
): [number, number][] {
  const points: [number, number][] = [];
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  let cx = x0, cy = y0;
  while (true) {
    points.push([cx, cy]);
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; cx += sx; }
    if (e2 <= dx) { err += dx; cy += sy; }
  }
  return points;
}

/** Midpoint Circle 알고리즘 — 원의 외곽 픽셀 좌표 반환 */
export function midpointCircle(
  cx: number, cy: number, radius: number,
): [number, number][] {
  if (radius <= 0) return [[cx, cy]];
  const points: [number, number][] = [];
  let x = radius, y = 0, d = 1 - radius;

  const addSymmetric = (px: number, py: number) => {
    points.push(
      [cx + px, cy + py], [cx - px, cy + py],
      [cx + px, cy - py], [cx - px, cy - py],
      [cx + py, cy + px], [cx - py, cy + px],
      [cx + py, cy - px], [cx - py, cy - px],
    );
  };

  while (x >= y) {
    addSymmetric(x, y);
    y++;
    if (d <= 0) {
      d += 2 * y + 1;
    } else {
      x--;
      d += 2 * (y - x) + 1;
    }
  }
  return points;
}

/** 채워진 원 — 원 내부의 모든 픽셀 좌표 반환 */
export function filledCircle(
  cx: number, cy: number, radius: number,
): [number, number][] {
  if (radius <= 0) return [[cx, cy]];
  const points: [number, number][] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        points.push([cx + dx, cy + dy]);
      }
    }
  }
  return points;
}

/** 사각형 외곽선 픽셀 좌표 반환 */
export function rectangleOutline(
  x0: number, y0: number, x1: number, y1: number,
): [number, number][] {
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
  const points: [number, number][] = [];

  for (let x = minX; x <= maxX; x++) {
    points.push([x, minY], [x, maxY]);
  }
  for (let y = minY + 1; y < maxY; y++) {
    points.push([minX, y], [maxX, y]);
  }
  return points;
}

/** 채워진 사각형 픽셀 좌표 반환 */
export function filledRectangle(
  x0: number, y0: number, x1: number, y1: number,
): [number, number][] {
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
  const points: [number, number][] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      points.push([x, y]);
    }
  }
  return points;
}

/**
 * FloodFill (BFS) — 같은 색상 영역을 채움
 * @returns 변경된 좌표 배열
 */
export function floodFill(
  pixels: (string | null)[][],
  startX: number, startY: number,
  fillColor: string | null,
  size: number,
): [number, number][] {
  const targetColor = pixels[startY]?.[startX] ?? null;
  // 이미 같은 색이면 변경 없음
  if (targetColor === fillColor) return [];

  const changed: [number, number][] = [];
  const visited = new Set<number>();
  const queue: [number, number][] = [[startX, startY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = y * size + x;
    if (visited.has(key)) continue;
    if (x < 0 || x >= size || y < 0 || y >= size) continue;

    const current = pixels[y][x] ?? null;
    if (current !== targetColor) continue;

    visited.add(key);
    changed.push([x, y]);

    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return changed;
}

/**
 * 픽셀 퍼펙트 보정 — 연속된 3점에서 불필요한 대각선 이중 픽셀 제거
 * Aseprite의 Pixel Perfect 알고리즘과 동일한 원리
 */
export function pixelPerfect(
  points: [number, number][],
): [number, number][] {
  if (points.length < 3) return points;
  const result: [number, number][] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const [cx, cy] = points[i + 1];

    // B가 A-C의 대각선 꺾이점인지 확인
    const isDiagonalBend =
      ax !== cx && ay !== cy && // A와 C가 같은 행/열이 아니고
      Math.abs(bx - ax) <= 1 && Math.abs(by - ay) <= 1 && // A-B 인접
      Math.abs(cx - bx) <= 1 && Math.abs(cy - by) <= 1 && // B-C 인접
      (bx === ax || bx === cx) && (by === ay || by === cy); // B가 L자 꺾임

    if (!isDiagonalBend) {
      result.push(points[i]);
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

/** Shift 키 스냅 — 수평/수직/45도 방향으로 스냅 */
export function snapToAngle(
  x0: number, y0: number, x1: number, y1: number,
): [number, number] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  // 45도 범위 판단
  if (ady < adx * 0.41) {
    // 수평
    return [x1, y0];
  } else if (adx < ady * 0.41) {
    // 수직
    return [x0, y1];
  } else {
    // 45도 대각선
    const dist = Math.max(adx, ady);
    return [
      x0 + dist * Math.sign(dx),
      y0 + dist * Math.sign(dy),
    ];
  }
}
