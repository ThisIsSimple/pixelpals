/**
 * EyedropperTool — 스포이드
 * 클릭한 픽셀의 색상을 현재 색상으로 설정
 * Alt 키 누르면 아무 도구에서나 임시 활성화 (EditorLayout에서 처리)
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent } from '../../types/editor';

export class EyedropperTool extends BaseTool {
  readonly name = 'eyedropper';
  readonly cursor = 'crosshair';

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    return this.pick(e, ctx);
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    return this.pick(e, ctx);
  }

  onPointerUp(): ToolResult | null { return null; }

  private pick(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.inBounds(e.pixelX, e.pixelY, ctx.canvasSize)) return null;
    const pixels = ctx.getPixels();
    const color = pixels[e.pixelY]?.[e.pixelX];
    if (color) {
      return { newColor: color };
    }
    return null;
  }
}
