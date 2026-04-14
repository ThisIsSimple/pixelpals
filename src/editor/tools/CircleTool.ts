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
    const dx = e.pixelX - this.start.x;
    const dy = e.pixelY - this.start.y;
    const radius = Math.round(Math.sqrt(dx * dx + dy * dy));

    const points = this.filled
      ? filledCircle(this.start.x, this.start.y, radius)
      : midpointCircle(this.start.x, this.start.y, radius);

    // 중복 제거
    const seen = new Set<string>();
    const unique = points.filter(([x, y]) => {
      const key = `${x},${y}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let changes: PixelChange[] = unique.map(([x, y]) => ({ x, y, color: this.currentColor }));
    changes = this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode);
    return changes;
  }
}
