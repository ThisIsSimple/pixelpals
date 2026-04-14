/**
 * EraserTool — 픽셀을 투명(null)으로 설정
 * PencilTool과 동일한 로직이나 항상 null 색상 사용
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange } from '../../types/editor';
import { bresenhamLine } from '../core/algorithms';

export class EraserTool extends BaseTool {
  readonly name = 'eraser';
  readonly cursor = 'crosshair';

  private lastPixel: { x: number; y: number } | null = null;
  private isDrawing = false;

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    this.isDrawing = true;
    this.lastPixel = { x: e.pixelX, y: e.pixelY };

    const changes: PixelChange[] = [{ x: e.pixelX, y: e.pixelY, color: null }];
    return { pixels: this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode, ctx.symmetryAxisPosition) };
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.isDrawing || !this.lastPixel) return null;

    const line = bresenhamLine(
      this.lastPixel.x, this.lastPixel.y,
      e.pixelX, e.pixelY,
    );
    const changes: PixelChange[] = line.slice(1).map(([x, y]) => ({ x, y, color: null }));
    this.lastPixel = { x: e.pixelX, y: e.pixelY };
    return { pixels: this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode, ctx.symmetryAxisPosition) };
  }

  onPointerUp(): ToolResult | null {
    this.isDrawing = false;
    this.lastPixel = null;
    return { undoable: true };
  }

  reset(): void {
    this.isDrawing = false;
    this.lastPixel = null;
  }
}
