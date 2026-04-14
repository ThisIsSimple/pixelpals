/**
 * FillTool — FloodFill (BFS) 채우기
 * 클릭한 위치와 같은 색상의 연결된 영역을 현재 색상으로 채움
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange } from '../../types/editor';
import { floodFill } from '../core/algorithms';

export class FillTool extends BaseTool {
  readonly name = 'fill';
  readonly cursor = 'crosshair';

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.inBounds(e.pixelX, e.pixelY, ctx.canvasSize)) return null;

    const pixels = ctx.getPixels();
    const color = e.button === 2 ? null : ctx.currentColor;
    const affected = floodFill(pixels, e.pixelX, e.pixelY, color, ctx.canvasSize);

    if (affected.length === 0) return null;

    const changes: PixelChange[] = affected.map(([x, y]) => ({ x, y, color }));
    const final = this.applySymmetry(changes, ctx.canvasSize, ctx.symmetryMode);
    return { pixels: final, undoable: true };
  }

  onPointerMove(): ToolResult | null { return null; }
  onPointerUp(): ToolResult | null { return null; }
}
