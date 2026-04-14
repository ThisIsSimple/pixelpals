/**
 * useEditorStore — 픽셀 에디터 Zustand 스토어
 *
 * 에디터의 모든 상태를 관리하는 중앙 저장소.
 * Canvas 렌더링과 Tool 시스템이 이 스토어를 읽고/쓴다.
 */
import { create } from 'zustand';
import type {
  EditorTool, CanvasSize, LayerData, AnimationFrame,
  PixelChange, ViewportState, SelectionRect, OnionSkinConfig,
  SymmetryMode, SymmetryConfig,
} from '../types/editor';
import { DEFAULT_CANVAS_SIZE, EDITOR_LAYER_NAMES } from '../config/constants';
import { DEFAULT_PALETTE } from '../config/palette';
import { HistoryManager } from '../editor/core/HistoryManager';

// ─── 헬퍼 함수 ───

function createEmptyLayers(size: CanvasSize): LayerData[] {
  return EDITOR_LAYER_NAMES.map((name, i) => ({
    id: i,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    pixels: Array.from({ length: size }, () => Array(size).fill(null)),
  }));
}

function createEmptyFrame(index: number, size: CanvasSize): AnimationFrame {
  return {
    frameIndex: index,
    layers: createEmptyLayers(size),
    duration: 100,
  };
}

// 싱글턴 히스토리 매니저
const historyManager = new HistoryManager();

// ─── 스토어 인터페이스 ───

interface EditorState {
  // === 에디터 설정 ===
  canvasSize: CanvasSize;
  currentTool: EditorTool;
  currentColor: string;
  secondaryColor: string; // 배경색 (우클릭용)
  palette: string[];
  palettePresetIndex: number;
  showGrid: boolean;
  symmetryMode: SymmetryMode;
  symmetryConfig: SymmetryConfig;
  /** 작업 변경 여부 (뒤로가기 방지용) */
  isDirty: boolean;

  // === 뷰포트 ===
  viewport: ViewportState;

  // === 레이어/프레임 ===
  frames: AnimationFrame[];
  currentFrameIndex: number;
  currentLayerIndex: number;

  // === 선택 영역 ===
  selection: SelectionRect | null;

  // === 애니메이션 ===
  isPlaying: boolean;
  fps: number;
  onionSkin: OnionSkinConfig;

  // === 히스토리 ===
  canUndo: boolean;
  canRedo: boolean;

  // === 더티 플래그 (Canvas 재렌더 트리거) ===
  renderVersion: number;

  // === 액션 ===
  setCanvasSize: (size: CanvasSize) => void;
  setTool: (tool: EditorTool) => void;
  setColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  swapColors: () => void;
  setPalette: (colors: string[], presetIndex: number) => void;
  toggleGrid: () => void;
  toggleSymmetry: () => void;
  setSymmetryMode: (mode: SymmetryMode) => void;
  setSymmetryAxisPosition: (pos: number) => void;
  setViewport: (vp: Partial<ViewportState>) => void;

  // 레이어
  setCurrentLayer: (index: number) => void;
  toggleLayerVisibility: (index: number) => void;
  toggleLayerLock: (index: number) => void;
  setLayerOpacity: (index: number, opacity: number) => void;
  moveLayer: (fromIndex: number, toIndex: number) => void;

  // 프레임
  setCurrentFrame: (index: number) => void;
  addFrame: () => void;
  duplicateFrame: (index: number) => void;
  removeFrame: (index: number) => void;

  // 픽셀 조작
  applyPixels: (changes: PixelChange[]) => void;
  setSelection: (sel: SelectionRect | null) => void;

  // 히스토리
  saveSnapshot: (description: string) => void;
  undo: () => void;
  redo: () => void;

  // 애니메이션
  setPlaying: (playing: boolean) => void;
  setFps: (fps: number) => void;
  setOnionSkin: (config: Partial<OnionSkinConfig>) => void;

  // 유틸
  resetEditor: () => void;
  getCurrentLayerPixels: () => (string | null)[][];
  loadProject: (frames: AnimationFrame[], palette: string[]) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // === 초기 상태 ===
  canvasSize: DEFAULT_CANVAS_SIZE as CanvasSize,
  currentTool: 'pencil',
  currentColor: DEFAULT_PALETTE.colors[8],
  secondaryColor: DEFAULT_PALETTE.colors[0],
  palette: [...DEFAULT_PALETTE.colors],
  palettePresetIndex: 0,
  showGrid: true,
  symmetryMode: 'none' as SymmetryMode,
  symmetryConfig: { mode: 'none' as SymmetryMode, axisPosition: 0.5 },
  isDirty: false,
  viewport: { zoom: 1, panX: 0, panY: 0 },
  frames: [createEmptyFrame(0, DEFAULT_CANVAS_SIZE as CanvasSize)],
  currentFrameIndex: 0,
  currentLayerIndex: 0,
  selection: null,
  isPlaying: false,
  fps: 8,
  onionSkin: { enabled: false, prevFrames: 1, nextFrames: 0, opacity: 0.3 },
  canUndo: false,
  canRedo: false,
  renderVersion: 0,

  // === 액션 구현 ===

  setCanvasSize: (size) => {
    historyManager.clear();
    set({
      canvasSize: size,
      frames: [createEmptyFrame(0, size)],
      currentFrameIndex: 0,
      currentLayerIndex: 0,
      selection: null,
      canUndo: false,
      canRedo: false,
      renderVersion: get().renderVersion + 1,
    });
  },

  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ currentColor: color }),
  setSecondaryColor: (color) => set({ secondaryColor: color }),
  swapColors: () => set(s => ({
    currentColor: s.secondaryColor,
    secondaryColor: s.currentColor,
  })),
  setPalette: (colors, presetIndex) => set({ palette: colors, palettePresetIndex: presetIndex }),
  toggleGrid: () => set(s => ({ showGrid: !s.showGrid, renderVersion: s.renderVersion + 1 })),
  toggleSymmetry: () => set(s => {
    const modes: SymmetryMode[] = ['none', 'horizontal', 'vertical', 'both'];
    const idx = modes.indexOf(s.symmetryMode);
    const next = modes[(idx + 1) % modes.length];
    return {
      symmetryMode: next,
      symmetryConfig: { ...s.symmetryConfig, mode: next },
      renderVersion: s.renderVersion + 1,
    };
  }),
  setSymmetryMode: (mode) => set(s => ({
    symmetryMode: mode,
    symmetryConfig: { ...s.symmetryConfig, mode },
    renderVersion: s.renderVersion + 1,
  })),
  setSymmetryAxisPosition: (pos) => set(s => ({
    symmetryConfig: { ...s.symmetryConfig, axisPosition: Math.max(0, Math.min(1, pos)) },
    renderVersion: s.renderVersion + 1,
  })),
  setViewport: (vp) => set(s => ({ viewport: { ...s.viewport, ...vp } })),

  // --- 레이어 ---

  setCurrentLayer: (index) => set({ currentLayerIndex: index }),

  toggleLayerVisibility: (index) => {
    const { frames, currentFrameIndex } = get();
    const newFrames = [...frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const layers = [...frame.layers];
    layers[index] = { ...layers[index], visible: !layers[index].visible };
    frame.layers = layers;
    newFrames[currentFrameIndex] = frame;
    set({ frames: newFrames, renderVersion: get().renderVersion + 1 });
  },

  toggleLayerLock: (index) => {
    const { frames, currentFrameIndex } = get();
    const newFrames = [...frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const layers = [...frame.layers];
    layers[index] = { ...layers[index], locked: !layers[index].locked };
    frame.layers = layers;
    newFrames[currentFrameIndex] = frame;
    set({ frames: newFrames });
  },

  setLayerOpacity: (index, opacity) => {
    const { frames, currentFrameIndex } = get();
    const newFrames = [...frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const layers = [...frame.layers];
    layers[index] = { ...layers[index], opacity: Math.max(0, Math.min(1, opacity)) };
    frame.layers = layers;
    newFrames[currentFrameIndex] = frame;
    set({ frames: newFrames, renderVersion: get().renderVersion + 1 });
  },

  moveLayer: (fromIndex, toIndex) => {
    const { frames, currentFrameIndex, currentLayerIndex } = get();
    const newFrames = [...frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const layers = [...frame.layers];
    const [moved] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, moved);
    frame.layers = layers;
    newFrames[currentFrameIndex] = frame;

    let newLayerIndex = currentLayerIndex;
    if (currentLayerIndex === fromIndex) newLayerIndex = toIndex;
    else if (fromIndex < currentLayerIndex && toIndex >= currentLayerIndex) newLayerIndex--;
    else if (fromIndex > currentLayerIndex && toIndex <= currentLayerIndex) newLayerIndex++;

    set({ frames: newFrames, currentLayerIndex: newLayerIndex, renderVersion: get().renderVersion + 1 });
  },

  // --- 프레임 ---

  setCurrentFrame: (index) => set({ currentFrameIndex: index, renderVersion: get().renderVersion + 1 }),

  addFrame: () => {
    const { frames, canvasSize } = get();
    const newFrame = createEmptyFrame(frames.length, canvasSize);
    set({ frames: [...frames, newFrame], currentFrameIndex: frames.length });
  },

  duplicateFrame: (index) => {
    const { frames } = get();
    const source = frames[index];
    const dup: AnimationFrame = {
      frameIndex: frames.length,
      duration: source.duration,
      layers: source.layers.map(l => ({
        ...l,
        pixels: l.pixels.map(row => [...row]),
      })),
    };
    const newFrames = [...frames];
    newFrames.splice(index + 1, 0, dup);
    set({ frames: newFrames, currentFrameIndex: index + 1 });
  },

  removeFrame: (index) => {
    const { frames, currentFrameIndex } = get();
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== index);
    set({
      frames: newFrames,
      currentFrameIndex: Math.min(currentFrameIndex, newFrames.length - 1),
      renderVersion: get().renderVersion + 1,
    });
  },

  // --- 픽셀 조작 ---

  applyPixels: (changes) => {
    if (changes.length === 0) return;
    const { frames, currentFrameIndex, currentLayerIndex, canvasSize } = get();
    const newFrames = [...frames];
    const frame = { ...newFrames[currentFrameIndex] };
    const layers = [...frame.layers];
    const layer = { ...layers[currentLayerIndex] };

    if (layer.locked) return;

    const pixels = layer.pixels.map(row => [...row]);
    for (const { x, y, color } of changes) {
      if (x >= 0 && x < canvasSize && y >= 0 && y < canvasSize) {
        pixels[y][x] = color;
      }
    }

    layer.pixels = pixels;
    layers[currentLayerIndex] = layer;
    frame.layers = layers;
    newFrames[currentFrameIndex] = frame;
    set({ frames: newFrames, renderVersion: get().renderVersion + 1, isDirty: true });
  },

  setSelection: (sel) => set({ selection: sel }),

  // --- 히스토리 ---

  saveSnapshot: (description) => {
    const { frames, currentFrameIndex, currentLayerIndex } = get();
    historyManager.pushSnapshot(description, frames, currentFrameIndex, currentLayerIndex);
    set({ canUndo: historyManager.canUndo, canRedo: historyManager.canRedo });
  },

  undo: () => {
    const { frames, currentFrameIndex, currentLayerIndex } = get();
    const entry = historyManager.undo(frames, currentFrameIndex, currentLayerIndex);
    if (entry) {
      set({
        frames: entry.frames,
        currentFrameIndex: entry.currentFrameIndex,
        currentLayerIndex: entry.currentLayerIndex,
        canUndo: historyManager.canUndo,
        canRedo: historyManager.canRedo,
        renderVersion: get().renderVersion + 1,
      });
    }
  },

  redo: () => {
    const { frames, currentFrameIndex, currentLayerIndex } = get();
    const entry = historyManager.redo(frames, currentFrameIndex, currentLayerIndex);
    if (entry) {
      set({
        frames: entry.frames,
        currentFrameIndex: entry.currentFrameIndex,
        currentLayerIndex: entry.currentLayerIndex,
        canUndo: historyManager.canUndo,
        canRedo: historyManager.canRedo,
        renderVersion: get().renderVersion + 1,
      });
    }
  },

  // --- 애니메이션 ---

  setPlaying: (playing) => set({ isPlaying: playing }),
  setFps: (fps) => set({ fps: Math.max(1, Math.min(24, fps)) }),
  setOnionSkin: (config) => set(s => ({
    onionSkin: { ...s.onionSkin, ...config },
    renderVersion: s.renderVersion + 1,
  })),

  // --- 유틸 ---

  resetEditor: () => {
    historyManager.clear();
    const size = get().canvasSize;
    set({
      frames: [createEmptyFrame(0, size)],
      currentFrameIndex: 0,
      currentLayerIndex: 0,
      selection: null,
      canUndo: false,
      canRedo: false,
      renderVersion: get().renderVersion + 1,
    });
  },

  getCurrentLayerPixels: () => {
    const { frames, currentFrameIndex, currentLayerIndex } = get();
    return frames[currentFrameIndex]?.layers[currentLayerIndex]?.pixels ?? [];
  },

  loadProject: (frames, palette) => {
    historyManager.clear();
    set({
      frames,
      palette,
      currentFrameIndex: 0,
      currentLayerIndex: 0,
      canUndo: false,
      canRedo: false,
      renderVersion: get().renderVersion + 1,
    });
  },
}));
