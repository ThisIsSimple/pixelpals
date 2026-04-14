/**
 * 도구 레지스트리 — 모든 도구 인스턴스를 생성하고 이름으로 접근
 */
import type { EditorTool } from '../../types/editor';
import type { BaseTool } from './BaseTool';
import { PencilTool } from './PencilTool';
import { EraserTool } from './EraserTool';
import { FillTool } from './FillTool';
import { EyedropperTool } from './EyedropperTool';
import { LineTool } from './LineTool';
import { RectangleTool } from './RectangleTool';
import { CircleTool } from './CircleTool';
import { SelectTool } from './SelectTool';
import { MoveTool } from './MoveTool';

export function createToolRegistry(): Record<EditorTool, BaseTool> {
  return {
    pencil: new PencilTool(),
    eraser: new EraserTool(),
    fill: new FillTool(),
    eyedropper: new EyedropperTool(),
    line: new LineTool(),
    rectangle: new RectangleTool(),
    circle: new CircleTool(),
    select: new SelectTool(),
    move: new MoveTool(),
  };
}

export { BaseTool } from './BaseTool';
export { PencilTool } from './PencilTool';
export { EraserTool } from './EraserTool';
export { FillTool } from './FillTool';
export { EyedropperTool } from './EyedropperTool';
export { LineTool } from './LineTool';
export { RectangleTool } from './RectangleTool';
export { CircleTool } from './CircleTool';
export { SelectTool } from './SelectTool';
export { MoveTool } from './MoveTool';
