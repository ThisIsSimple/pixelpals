/** 픽셀 에디터 타입 정의 */

export type CanvasSize = 16 | 24 | 32;

export type EditorTool =
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'line'
  | 'rectangle'
  | 'circle'
  | 'eyedropper'
  | 'select';

/** 단일 레이어 픽셀 데이터 */
export interface LayerData {
  id: number;
  name: string;
  visible: boolean;
  locked: boolean;
  pixels: (string | null)[][]; // [y][x] = color hex or null (transparent)
}

/** 애니메이션 프레임 */
export interface AnimationFrame {
  frameIndex: number;
  layers: LayerData[];
  duration: number; // ms
}

/** 에디터 프로젝트 */
export interface EditorProject {
  id: string;
  name: string;
  canvasSize: CanvasSize;
  frames: AnimationFrame[];
  currentFrameIndex: number;
  currentLayerIndex: number;
  palette: string[];
  createdAt: number;
  updatedAt: number;
}

/** Undo/Redo 커맨드 인터페이스 */
export interface EditorCommand {
  execute(): void;
  undo(): void;
  description: string;
}
