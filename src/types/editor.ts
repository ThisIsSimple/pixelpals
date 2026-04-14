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
  opacity: number; // 0~1
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

/** 픽셀 변경 단위 — 배치 처리용 */
export interface PixelChange {
  x: number;
  y: number;
  color: string | null;
}

/** 선택 영역 */
export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 줌/팬 뷰포트 상태 */
export interface ViewportState {
  zoom: number;    // 1, 2, 4, 8, 16, 32
  panX: number;    // 오프셋 (화면 픽셀)
  panY: number;
}

/** 도구 이벤트 데이터 */
export interface ToolPointerEvent {
  /** 픽셀 좌표 (0-based) */
  pixelX: number;
  pixelY: number;
  /** 화면 좌표 */
  screenX: number;
  screenY: number;
  /** 마우스 버튼 (0=left, 2=right) */
  button: number;
  /** 수정키 */
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
}

/** 도구 프리뷰 오버레이 */
export interface ToolPreview {
  pixels: PixelChange[];
}

/** 어니언 스킨 설정 */
export interface OnionSkinConfig {
  enabled: boolean;
  prevFrames: number; // 이전 프레임 표시 수 (1~3)
  nextFrames: number; // 다음 프레임 표시 수 (0~3)
  opacity: number;    // 0~1 (기본 0.3)
}
