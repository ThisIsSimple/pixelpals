/**
 * SelectTool — 사각형 선택 + 이동
 * - 드래그로 선택 영역 생성
 * - 선택 영역 내부 드래그로 이동
 * - 선택 영역 외부 클릭으로 해제
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange, SelectionRect } from '../../types/editor';

export class SelectTool extends BaseTool {
  readonly name = 'select';
  readonly cursor = 'default';

  private selection: SelectionRect | null = null;
  private isDraggingSelection = false;
  private isCreatingSelection = false;
  private start: { x: number; y: number } | null = null;
  private moveStart: { x: number; y: number } | null = null;
  private selectedPixels: PixelChange[] = [];

  getSelection(): SelectionRect | null { return this.selection; }

  onPointerDown(e: ToolPointerEvent, _ctx: ToolContext): ToolResult | null {
    const px = e.pixelX, py = e.pixelY;

    // 기존 선택 영역 내부 클릭 → 이동 모드
    if (this.selection && this.isInsideSelection(px, py)) {
      this.isDraggingSelection = true;
      this.moveStart = { x: px, y: py };
      return null;
    }

    // 그 외 → 새 선택 영역 생성 시작
    this.isCreatingSelection = true;
    this.start = { x: px, y: py };
    this.selection = null;
    this.selectedPixels = [];
    return null;
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    const px = e.pixelX, py = e.pixelY;

    if (this.isCreatingSelection && this.start) {
      // 선택 영역 드래그 확장
      const minX = Math.max(0, Math.min(this.start.x, px));
      const minY = Math.max(0, Math.min(this.start.y, py));
      const maxX = Math.min(ctx.canvasSize - 1, Math.max(this.start.x, px));
      const maxY = Math.min(ctx.canvasSize - 1, Math.max(this.start.y, py));

      this.selection = {
        x: minX, y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      };
      return null;
    }

    if (this.isDraggingSelection && this.selection && this.moveStart) {
      // 선택 영역 이동
      const dx = px - this.moveStart.x;
      const dy = py - this.moveStart.y;
      if (dx !== 0 || dy !== 0) {
        this.selection = {
          ...this.selection,
          x: this.selection.x + dx,
          y: this.selection.y + dy,
        };
        this.moveStart = { x: px, y: py };

        // 이동 시 픽셀 변경은 커밋 시점에 반영
      }
      return null;
    }

    return null;
  }

  onPointerUp(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (this.isCreatingSelection) {
      this.isCreatingSelection = false;
      this.start = null;

      // 너무 작은 선택 (1px 이하) → 선택 해제
      if (this.selection && (this.selection.width <= 0 || this.selection.height <= 0)) {
        this.selection = null;
      }
      return null;
    }

    if (this.isDraggingSelection) {
      this.isDraggingSelection = false;
      this.moveStart = null;
      // TODO: 이동된 픽셀 변경사항 생성
      return null;
    }

    return null;
  }

  /** 선택 영역 해제 */
  clearSelection(): void {
    this.selection = null;
    this.selectedPixels = [];
  }

  /** 선택 영역 내 픽셀 복사 */
  copyPixels(pixels: (string | null)[][]): PixelChange[] {
    if (!this.selection) return [];
    const { x, y, width, height } = this.selection;
    const copied: PixelChange[] = [];
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const px = x + dx, py = y + dy;
        const color = pixels[py]?.[px] ?? null;
        if (color) copied.push({ x: dx, y: dy, color });
      }
    }
    this.selectedPixels = copied;
    return copied;
  }

  /** 복사된 픽셀을 현재 선택 위치에 붙여넣기용 변경 목록 생성 */
  pastePixels(offsetX: number, offsetY: number): PixelChange[] {
    return this.selectedPixels.map(p => ({
      x: p.x + offsetX,
      y: p.y + offsetY,
      color: p.color,
    }));
  }

  reset(): void {
    this.selection = null;
    this.isDraggingSelection = false;
    this.isCreatingSelection = false;
    this.start = null;
    this.moveStart = null;
    this.selectedPixels = [];
  }

  private isInsideSelection(x: number, y: number): boolean {
    if (!this.selection) return false;
    const s = this.selection;
    return x >= s.x && x < s.x + s.width && y >= s.y && y < s.y + s.height;
  }
}
