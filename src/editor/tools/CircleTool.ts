/**
 * CircleTool — 원/타원 도구
 * Midpoint Circle 알고리즘 사용, Shift → 정원
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange } from '../../types/editor';
import { midpointCircle, filledCircle } from '../core/algorithms';

export class CircleTool extends BaseTool {
  readonly name = 'circle';
  readonly cursor = 'crosshair';

  /** true = 채움, false = 외곽선만 */
  filled = false;

  private start: { x: number; y: number } | null = null;
  private previewPixels: PixelChange[] = [];
  private currentColor: string | null = null;

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    this.start = { x: e.pixelX, y: e.pixelY };
    this.currentColor = e.button === 2 ? null : ctx.currentColor;
    this.previewPixels = [{ x: e.pixelX, y: e.pixelY, color: this.currentColor }];
    return null;
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.start) return null;
    this.previewPixels = this.computePixels(e, ctx);
    return null;
  }

  onPointerUp(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.start) return null;

    let changes = this.computePixels(e, ctx);
    this.start = null;
    this.previewPixels = [];
    return { pixels: changes, undoable: true };
  }

  getPreview(): PixelChange[] | null {
    return this.previewPixels.length > 0 ? this.previewPixels : null;
  }

  reset(): void {
    this.start = null;
    this.previewPixels = [];
  }

  private computePixels(e: ToolPointerEvent, ctx: ToolContext): PixelChange[] {
    if (!this.start) return [];

    // 바운딩 박스: start와 현재 포인터가 대각선 꼭짓점
    const x0 = Math.min(this.start.x, e.pixelX);
    const y0 = Math.min(this.start.y, e.pixelY);
    const x1 = Math.max(this.start.x, e.pixelX);
    const y1 = Math.max(this.start.y, e.pixelY);

    const w = x1 - x0;
    const h = y1 - y0;

    // Shift → 정원 (작은 쪽에 맞춤)
    let rw: number, rh: number;
    if (e.shiftKey) {
      const side = Math.min(w, h);
      rw = side;
      rh = side;
    } else {
      rw = w;
      rh = h;
    }

    // 반지름이 0이면 점 하나
    if (rw === 0 && rh === 0) {
      let changes: PixelChange[] = [{ x: x0, y: y0, color: this.currentColor }];
      changes = this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode, ctx.symmetryAxisPosition);
      return changes;
    }

    // 바운딩 박스 중심 (서브픽셀 정밀도)
    const cx = x0 + rw / 2;
    const cy = y0 + rh / 2;
    const rx = rw / 2;
    const ry = rh / 2;

    // 타원 래스터화 (Midpoint Ellipse)
    const points: [number, number][] = [];
    if (this.filled) {
      // 채움 타원: 각 y줄에서 경계 내부 채움
      for (let py = y0; py <= y0 + rh; py++) {
        for (let px = x0; px <= x0 + rw; px++) {
          const dx = (px - cx) / rx;
          const dy = (py - cy) / ry;
          if (dx * dx + dy * dy <= 1.0) {
            points.push([px, py]);
          }
        }
      }
    } else {
      // 외곽선 타원: 경계 근처 픽셀만
      // 샘플링 방식 — 각 행에서 가장 가까운 경계 픽셀 2개
      for (let py = y0; py <= y0 + rh; py++) {
        const dy = (py - cy) / ry;
        const dy2 = dy * dy;
        if (dy2 > 1) continue;
        const dxMax = Math.sqrt(1 - dy2) * rx;
        const leftX = Math.round(cx - dxMax);
        const rightX = Math.round(cx + dxMax);
        points.push([leftX, py]);
        if (rightX !== leftX) points.push([rightX, py]);
      }
      // 각 열에서도 (빈 틈 방지)
      for (let px = x0; px <= x0 + rw; px++) {
        const dx = (px - cx) / rx;
        const dx2 = dx * dx;
        if (dx2 > 1) continue;
        const dyMax = Math.sqrt(1 - dx2) * ry;
        const topY = Math.round(cy - dyMax);
        const bottomY = Math.round(cy + dyMax);
        points.push([px, topY]);
        if (bottomY !== topY) points.push([px, bottomY]);
      }
    }

    // 중복 제거
    const seen = new Set<string>();
    const unique = points.filter(([x, y]) => {
      const key = `${x},${y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let changes: PixelChange[] = unique.map(([x, y]) => ({ x, y, color: this.currentColor }));
    changes = this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode, ctx.symmetryAxisPosition);
    return changes;
  }
}
