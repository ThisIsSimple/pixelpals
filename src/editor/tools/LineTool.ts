/**
 * LineTool — Bresenham 직선 도구
 * 클릭(시작) → 드래그(프리뷰) → 릴리즈(커밋)
 * Shift 누르면 수평/수직/45도 스냅
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange } from '../../types/editor';
import { bresenhamLine, snapToAngle } from '../core/algorithms';

export class LineTool extends BaseTool {
  readonly name = 'line';
  readonly cursor = 'crosshair';

  private start: { x: number; y: number } | null = null;
  private previewPixels: PixelChange[] = [];
  private currentColor: string | null = null;

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    this.start = { x: e.pixelX, y: e.pixelY };
    this.currentColor = e.button === 2 ? null : ctx.currentColor;
    this.previewPixels = [{ x: e.pixelX, y: e.pixelY, color: this.currentColor }];
    return null; // 아직 커밋하지 않음, 프리뷰만
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.start) return null;

    let endX = e.pixelX, endY = e.pixelY;
    if (e.shiftKey) {
      [endX, endY] = snapToAngle(this.start.x, this.start.y, endX, endY);
    }

    const points = bresenhamLine(this.start.x, this.start.y, endX, endY);
    this.previewPixels = points.map(([x, y]) => ({ x, y, color: this.currentColor }));

    if (ctx.symmetryMode) {
      this.previewPixels = this.applySymmetry(this.previewPixels, ctx.canvasSize, true);
    }
    return null;
  }

  onPointerUp(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.start) return null;

    let endX = e.pixelX, endY = e.pixelY;
    if (e.shiftKey) {
      [endX, endY] = snapToAngle(this.start.x, this.start.y, endX, endY);
    }

    const points = bresenhamLine(this.start.x, this.start.y, endX, endY);
    let changes: PixelChange[] = points.map(([x, y]) => ({ x, y, color: this.currentColor }));
    changes = this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode);

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
}
