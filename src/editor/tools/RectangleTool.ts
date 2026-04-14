/**
 * RectangleTool — 사각형 도구
 * 채움/외곽선 모드 지원, Shift → 정사각형
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange } from '../../types/editor';
import { rectangleOutline, filledRectangle } from '../core/algorithms';

export class RectangleTool extends BaseTool {
  readonly name = 'rectangle';
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

    const [endX, endY] = this.snapEnd(e);
    const points = this.filled
      ? filledRectangle(this.start.x, this.start.y, endX, endY)
      : rectangleOutline(this.start.x, this.start.y, endX, endY);

    this.previewPixels = points.map(([x, y]) => ({ x, y, color: this.currentColor }));
    if (ctx.symmetryMode) {
      this.previewPixels = this.applySymmetry(this.previewPixels, ctx.canvasSize, true);
    }
    return null;
  }

  onPointerUp(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.start) return null;

    const [endX, endY] = this.snapEnd(e);
    const points = this.filled
      ? filledRectangle(this.start.x, this.start.y, endX, endY)
      : rectangleOutline(this.start.x, this.start.y, endX, endY);

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

  private snapEnd(e: ToolPointerEvent): [number, number] {
    if (!this.start) return [e.pixelX, e.pixelY];
    if (e.shiftKey) {
      // 정사각형 강제
      const dx = e.pixelX - this.start.x;
      const dy = e.pixelY - this.start.y;
      const side = Math.max(Math.abs(dx), Math.abs(dy));
      return [
        this.start.x + side * Math.sign(dx),
        this.start.y + side * Math.sign(dy),
      ];
    }
    return [e.pixelX, e.pixelY];
  }
}
