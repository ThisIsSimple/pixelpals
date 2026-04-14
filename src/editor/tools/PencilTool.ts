/**
 * PencilTool — 1픽셀 정확도 드로잉
 * - 드래그 시 Bresenham 보간으로 빈 틈 없음
 * - 대칭 모드 연동
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange } from '../../types/editor';
import { bresenhamLine } from '../core/algorithms';

export class PencilTool extends BaseTool {
  readonly name = 'pencil';
  readonly cursor = 'crosshair';

  private lastPixel: { x: number; y: number } | null = null;
  private isDrawing = false;
  private allChanges: PixelChange[] = [];

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    this.isDrawing = true;
    this.allChanges = [];
    this.lastPixel = { x: e.pixelX, y: e.pixelY };

    const color = e.button === 2 ? null : ctx.currentColor;
    const changes: PixelChange[] = [{ x: e.pixelX, y: e.pixelY, color }];
    const final = this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode);

    this.allChanges.push(...final);
    return { pixels: final };
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.isDrawing || !this.lastPixel) return null;

    const color = e.button === 2 ? null : ctx.currentColor;
    // Bresenham 보간: 빠른 드래그에서도 빈 틈 없이 연결
    const line = bresenhamLine(
      this.lastPixel.x, this.lastPixel.y,
      e.pixelX, e.pixelY,
    );

    // 첫 점은 이전 이벤트에서 이미 그렸으므로 제외
    const changes: PixelChange[] = line.slice(1).map(([x, y]) => ({ x, y, color }));
    const final = this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode);

    this.allChanges.push(...final);
    this.lastPixel = { x: e.pixelX, y: e.pixelY };
    return { pixels: final };
  }

  onPointerUp(_e: ToolPointerEvent, _ctx: ToolContext): ToolResult | null {
    this.isDrawing = false;
    this.lastPixel = null;
    // Undo는 전체 스트로크를 하나의 단위로 처리 (EditorLayout에서 관리)
    return { undoable: true };
  }

  reset(): void {
    this.isDrawing = false;
    this.lastPixel = null;
    this.allChanges = [];
  }
}
