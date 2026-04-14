import { create } from 'zustand';
import type { EditorTool, CanvasSize, LayerData, AnimationFrame, EditorCommand } from '../types/editor';
import { DEFAULT_CANVAS_SIZE, EDITOR_LAYER_NAMES } from '../config/constants';
import { DEFAULT_PALETTE } from '../config/palette';

/** 빈 레이어 데이터 생성 */
function createEmptyLayers(size: CanvasSize): LayerData[] {
  return EDITOR_LAYER_NAMES.map((name, i) => ({
    id: i,
    name,
    visible: true,
    locked: false,
    pixels: Array.from({ length: size }, () => Array(size).fill(null)),
  }));
}

/** 빈 프레임 생성 */
function createEmptyFrame(index: number, size: CanvasSize): AnimationFrame {
  return {
    frameIndex: index,
    layers: createEmptyLayers(size),
    duration: 100,
  };
}

interface EditorState {
  // 에디터 설정
  canvasSize: CanvasSize;
  currentTool: EditorTool;
  currentColor: string;
  palette: string[];
  showGrid: boolean;
  symmetryMode: boolean;

  // 레이어/프레임
  frames: AnimationFrame[];
  currentFrameIndex: number;
  currentLayerIndex: number;

  // Undo/Redo
  undoStack: EditorCommand[];
  redoStack: EditorCommand[];

  // 액션
  setCanvasSize: (size: CanvasSize) => void;
  setTool: (tool: EditorTool) => void;
  setColor: (color: string) => void;
  toggleGrid: () => void;
  toggleSymmetry: () => void;
  setCurrentLayer: (index: number) => void;
  setCurrentFrame: (index: number) => void;
  addFrame: () => void;
  removeFrame: (index: number) => void;
  setPixel: (x: number, y: number, color: string | null) => void;
  pushCommand: (command: EditorCommand) => void;
  undo: () => void;
  redo: () => void;
  resetEditor: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  canvasSize: DEFAULT_CANVAS_SIZE as CanvasSize,
  currentTool: 'pencil',
  currentColor: DEFAULT_PALETTE.colors[8], // 레드
  palette: [...DEFAULT_PALETTE.colors],
  showGrid: true,
  symmetryMode: false,
  frames: [createEmptyFrame(0, DEFAULT_CANVAS_SIZE as CanvasSize)],
  currentFrameIndex: 0,
  currentLayerIndex: 0,
  undoStack: [],
  redoStack: [],

  setCanvasSize: (size) => {
    set({
      canvasSize: size,
      frames: [createEmptyFrame(0, size)],
      currentFrameIndex: 0,
      currentLayerIndex: 0,
      undoStack: [],
      redoStack: [],
    });
  },

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ currentColor: color }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSymmetry: () => set((s) => ({ symmetryMode: !s.symmetryMode })),
  setCurrentLayer: (index) => set({ currentLayerIndex: index }),
  setCurrentFrame: (index) => set({ currentFrameIndex: index }),

  addFrame: () => {
    const { frames, canvasSize } = get();
    const newFrame = createEmptyFrame(frames.length, canvasSize);
    set({ frames: [...frames, newFrame], currentFrameIndex: frames.length });
  },

  removeFrame: (index) => {
    const { frames, currentFrameIndex } = get();
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== index);
    set({
      frames: newFrames,
      currentFrameIndex: Math.min(currentFrameIndex, newFrames.length - 1),
    });
  },

  setPixel: (x, y, color) => {
    const { frames, currentFrameIndex, currentLayerIndex, canvasSize, symmetryMode } = get();
    if (x < 0 || x >= canvasSize || y < 0 || y >= canvasSize) return;

    const newFrames = [...frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const layers = [...frame.layers];
    const layer = { ...layers[currentLayerIndex] };
    const pixels = layer.pixels.map((row) => [...row]);

    pixels[y][x] = color;

    // 대칭 모드
    if (symmetryMode) {
      const mirrorX = canvasSize - 1 - x;
      if (mirrorX !== x) {
        pixels[y][mirrorX] = color;
      }
    }

    layer.pixels = pixels;
    layers[currentLayerIndex] = layer;
    frame.layers = layers;
    newFrames[currentFrameIndex] = frame;

    set({ frames: newFrames });
  },

  pushCommand: (command) => {
    set((s) => ({
      undoStack: [...s.undoStack, command],
      redoStack: [],
    }));
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;
    const command = undoStack[undoStack.length - 1];
    command.undo();
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, command],
    }));
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;
    const command = redoStack[redoStack.length - 1];
    command.execute();
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, command],
    }));
  },

  resetEditor: () => {
    const size = get().canvasSize;
    set({
      frames: [createEmptyFrame(0, size)],
      currentFrameIndex: 0,
      currentLayerIndex: 0,
      undoStack: [],
      redoStack: [],
    });
  },
}));
