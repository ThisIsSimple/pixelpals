/**
 * MoveTool — 선택 영역 또는 전체 레이어 내용 이동
 * - 선택 영역이 있으면 선택 영역 내 픽셀만 이동
 * - 선택 없으면 전체 레이어 픽셀 이동
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange } from '../../types/editor';

export class MoveTool extends BaseTool {
  readonly name = 'move';
  readonly cursor = 'grab';

  private isDragging = false;
  private dragStart: { x: number; y: number } | null = null;
  private originalPixels: (string | null)[][] = [];
  private movedPixels: { x: number; y: number; color: string | null }[] = [];
  private totalDx = 0;
  private totalDy = 0;

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    this.isDragging = true;
    this.dragStart = { x: e.pixelX, y: e.pixelY };
    this.totalDx = 0;
    this.totalDy = 0;

    // 현재 레이어 픽셀 스냅샷 저장
    const pixels = ctx.getPixels();
    this.originalPixels = pixels.map(row => [...row]);

    // 이동할 픽셀 수집
    this.movedPixels = [];
    const size = ctx.canvasSize;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const color = pixels[y]?.[x];
        if (color) {
          this.movedPixels.push({ x, y, color });
        }
      }
    }

    return null;
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.isDragging || !this.dragStart) return null;

    const dx = e.pixelX - this.dragStart.x;
    const dy = e.pixelY - this.dragStart.y;

    if (dx === this.totalDx && dy === this.totalDy) return null;
    this.totalDx = dx;
    this.totalDy = dy;

    // 현재 레이어를 클리어하고, 이동된 위치에 픽셀 재배치
    const size = ctx.canvasSize;
    const changes: PixelChange[] = [];

    // 먼저 원본 위치 클리어
    for (const p of this.movedPixels) {
      changes.push({ x: p.x, y: p.y, color: null });
    }

    // 새 위치에 배치
    for (const p of this.movedPixels) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        changes.push({ x: nx, y: ny, color: p.color });
      }
    }

    return { pixels: changes };
  }

  onPointerUp(_e: ToolPointerEvent, _ctx: ToolContext): ToolResult | null {
    this.isDragging = false;
    this.dragStart = null;
    this.movedPixels = [];
    this.originalPixels = [];
    return { undoable: true };
  }

  reset(): void {
    this.isDragging = false;
    this.dragStart = null;
    this.movedPixels = [];
    this.originalPixels = [];
    this.totalDx = 0;
    this.totalDy = 0;
  }
}
