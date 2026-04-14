/**
 * HistoryManager — Undo/Redo (스냅샷 방식)
 *
 * 각 커밋 시점의 레이어 픽셀 스냅샷을 저장.
 * Command 패턴보다 단순하고, 레이어 변경을 원자적으로 되돌릴 수 있다.
 */
import type { AnimationFrame, CanvasSize } from '../../types/editor';
import { EDITOR_LAYER_NAMES } from '../../config/constants';

const MAX_HISTORY = 80;

interface HistoryEntry {
  description: string;
  frames: AnimationFrame[];
  currentFrameIndex: number;
  currentLayerIndex: number;
}

/** 프레임 배열 깊은 복사 (픽셀 데이터 포함) */
function cloneFrames(frames: AnimationFrame[]): AnimationFrame[] {
  return frames.map(f => ({
    ...f,
    layers: f.layers.map(l => ({
      ...l,
      pixels: l.pixels.map(row => [...row]),
    })),
  }));
}

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];

  /** 현재 상태를 스냅샷으로 저장 (변경 전에 호출) */
  pushSnapshot(
    description: string,
    frames: AnimationFrame[],
    currentFrameIndex: number,
    currentLayerIndex: number,
  ): void {
    this.undoStack.push({
      description,
      frames: cloneFrames(frames),
      currentFrameIndex,
      currentLayerIndex,
    });

    // 새 변경이 있으면 redo 스택 초기화
    this.redoStack = [];

    // 최대 히스토리 제한
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
  }

  /** Undo — 이전 상태로 되돌리기 */
  undo(
    currentFrames: AnimationFrame[],
    currentFrameIndex: number,
    currentLayerIndex: number,
  ): HistoryEntry | null {
    const entry = this.undoStack.pop();
    if (!entry) return null;

    // 현재 상태를 redo 스택에 저장
    this.redoStack.push({
      description: entry.description,
      frames: cloneFrames(currentFrames),
      currentFrameIndex,
      currentLayerIndex,
    });

    return {
      ...entry,
      frames: cloneFrames(entry.frames),
    };
  }

  /** Redo — 되돌린 작업 다시 실행 */
  redo(
    currentFrames: AnimationFrame[],
    currentFrameIndex: number,
    currentLayerIndex: number,
  ): HistoryEntry | null {
    const entry = this.redoStack.pop();
    if (!entry) return null;

    this.undoStack.push({
      description: entry.description,
      frames: cloneFrames(currentFrames),
      currentFrameIndex,
      currentLayerIndex,
    });

    return {
      ...entry,
      frames: cloneFrames(entry.frames),
    };
  }

  get canUndo(): boolean { return this.undoStack.length > 0; }
  get canRedo(): boolean { return this.redoStack.length > 0; }
  get undoDescription(): string | null {
    return this.undoStack.length > 0
      ? this.undoStack[this.undoStack.length - 1].description
      : null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
