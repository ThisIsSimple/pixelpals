/**
 * BaseTool — 모든 드로잉 도구의 추상 기반 클래스
 *
 * 도구의 생명주기:
 *  1. onPointerDown — 클릭/터치 시작
 *  2. onPointerMove — 드래그 중 (반복)
 *  3. onPointerUp   — 릴리즈 → 커밋 또는 취소
 *
 * 각 도구는 프리뷰 픽셀을 반환하거나 즉시 스토어에 반영할 수 있다.
 */
import type { ToolPointerEvent, PixelChange } from '../../types/editor';

/** 도구가 스토어에 반영할 결과 */
export interface ToolResult {
  /** 변경할 픽셀들 (스토어에 배치 적용) */
  pixels?: PixelChange[];
  /** 색상 변경 (스포이드) */
  newColor?: string;
  /** 이 결과를 Undo 가능하게 할지 */
  undoable?: boolean;
}

/** 도구 컨텍스트 — 현재 에디터 상태 접근 */
export interface ToolContext {
  canvasSize: number;
  currentColor: string;
  symmetryMode: boolean;
  /** 현재 레이어의 픽셀 데이터 (읽기 전용 참고) */
  getPixels(): (string | null)[][];
}

export abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly cursor: string;

  /** 포인터 다운 — 도구 사용 시작 */
  abstract onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null;

  /** 포인터 무브 — 드래그 중 */
  abstract onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null;

  /** 포인터 업 — 도구 사용 종료, 최종 결과 반환 */
  abstract onPointerUp(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null;

  /**
   * 프리뷰 픽셀 반환 — 드래그 중 오버레이에 표시할 픽셀
   * null이면 프리뷰 없음
   */
  getPreview(): PixelChange[] | null {
    return null;
  }

  /** 도구 전환 시 정리 */
  reset(): void {}

  // ─── 유틸리티 ───

  /** 대칭 모드 적용: 변경 목록에 미러 픽셀 추가 */
  protected applySymmetry(
    changes: PixelChange[], canvasSize: number, symmetry: boolean,
  ): PixelChange[] {
    if (!symmetry) return changes;
    const mirrored: PixelChange[] = [];
    for (const c of changes) {
      mirrored.push(c);
      const mirrorX = canvasSize - 1 - c.x;
      if (mirrorX !== c.x) {
        mirrored.push({ x: mirrorX, y: c.y, color: c.color });
      }
    }
    return mirrored;
  }

  /** 픽셀이 캔버스 범위 안인지 확인 */
  protected inBounds(x: number, y: number, size: number): boolean {
    return x >= 0 && x < size && y >= 0 && y < size;
  }
}
