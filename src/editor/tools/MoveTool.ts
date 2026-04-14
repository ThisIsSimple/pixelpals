/**
 * MoveTool — 선택 영역 또는 전체 레이어 내용 이동
 * - 선택 영역이 있으면 선택 영역 내 픽셀만 이동
 * - 선택 없으면 전체 레이어 픽셀 이동
 *
 * 복제/흔적 방지: 원본 전체 스냅샷을 보관하고,
 * 매 이동마다 "전체 복원 → 대상 픽셀 제거 → 새 위치에 배치" 방식으로 처리
 *
 * 플로팅 픽셀: 선택 영역 이동 시, 캔버스 밖으로 나간 픽셀 데이터도
 * 선택 영역이 살아 있는 한 보존. 다시 캔버스 안으로 돌아오면 복원됨.
 * 선택 해제 시점에 최종 커밋.
 */
import { BaseTool, type ToolContext, type ToolResult } from './BaseTool';
import type { ToolPointerEvent, PixelChange, SelectionRect } from '../../types/editor';

export class MoveTool extends BaseTool {
  readonly name = 'move';
  readonly cursor = 'grab';

  private isDragging = false;
  private dragStart: { x: number; y: number } | null = null;

  /** 드래그 시작 시점의 전체 레이어 스냅샷 */
  private fullSnapshot: (string | null)[][] = [];

  /** 이동 대상 픽셀 (현재 드래그의 원본 좌표 + 색상) */
  private targetPixels: { x: number; y: number; color: string }[] = [];

  /** 드래그 시작 시점의 원본 선택 영역 */
  private originalSelection: SelectionRect | null = null;

  /**
   * 플로팅 픽셀 — 선택 영역 기준 상대 좌표로 저장
   * 캔버스 밖으로 나가도 데이터가 보존됨
   */
  private floatingPixels: { rx: number; ry: number; color: string }[] = [];

  /** 플로팅 픽셀이 활성화 상태인지 */
  private hasFloating = false;

  private totalDx = 0;
  private totalDy = 0;

  onPointerDown(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    this.isDragging = true;
    this.dragStart = { x: e.pixelX, y: e.pixelY };
    this.totalDx = 0;
    this.totalDy = 0;

    // 전체 레이어 픽셀 스냅샷 저장
    const pixels = ctx.getPixels();
    this.fullSnapshot = pixels.map(row => [...row]);

    // 원본 선택 영역 보관
    this.originalSelection = ctx.selection ? { ...ctx.selection } : null;

    const sel = ctx.selection;

    if (this.hasFloating && sel) {
      // ── 이전 드래그에서 보존된 플로팅 픽셀 재사용 ──
      // 선택 영역의 현재 위치 기준으로 절대 좌표 복원
      this.targetPixels = this.floatingPixels.map(fp => ({
        x: sel.x + fp.rx,
        y: sel.y + fp.ry,
        color: fp.color,
      }));
    } else {
      // ── 새로운 이동: 레이어에서 픽셀 수집 ──
      this.targetPixels = [];
      const size = ctx.canvasSize;

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const color = pixels[y]?.[x];
          if (!color) continue;

          if (sel) {
            if (x >= sel.x && x < sel.x + sel.width && y >= sel.y && y < sel.y + sel.height) {
              this.targetPixels.push({ x, y, color });
            }
          } else {
            this.targetPixels.push({ x, y, color });
          }
        }
      }

      // 선택 영역이 있으면 플로팅으로 저장 (상대 좌표)
      if (sel) {
        this.floatingPixels = this.targetPixels.map(p => ({
          rx: p.x - sel.x,
          ry: p.y - sel.y,
          color: p.color,
        }));
        this.hasFloating = true;
      }
    }

    return null;
  }

  onPointerMove(e: ToolPointerEvent, ctx: ToolContext): ToolResult | null {
    if (!this.isDragging || !this.dragStart) return null;

    const dx = e.pixelX - this.dragStart.x;
    const dy = e.pixelY - this.dragStart.y;

    if (dx === this.totalDx && dy === this.totalDy) return null;
    this.totalDx = dx;
    this.totalDy = dy;

    const size = ctx.canvasSize;
    const changes: PixelChange[] = [];

    // 1단계: 전체 스냅샷에서 원본 상태 복원
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        changes.push({ x, y, color: this.fullSnapshot[y]?.[x] ?? null });
      }
    }

    // 2단계: 대상 픽셀의 원래 위치를 클리어 (캔버스 범위 내만)
    for (const p of this.targetPixels) {
      if (p.x >= 0 && p.x < size && p.y >= 0 && p.y < size) {
        changes.push({ x: p.x, y: p.y, color: null });
      }
    }

    // 3단계: 대상 픽셀을 새 위치에 배치 (캔버스 범위 내만 — 밖은 플로팅으로 보존)
    for (const p of this.targetPixels) {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        changes.push({ x: nx, y: ny, color: p.color });
      }
    }

    // 선택 영역도 같이 이동
    const movedSelection = this.originalSelection
      ? { ...this.originalSelection, x: this.originalSelection.x + dx, y: this.originalSelection.y + dy }
      : null;

    return { pixels: changes, selection: movedSelection };
  }

  onPointerUp(_e: ToolPointerEvent, _ctx: ToolContext): ToolResult | null {
    // 최종 선택 영역 위치 반영
    const finalSelection = this.originalSelection
      ? { ...this.originalSelection, x: this.originalSelection.x + this.totalDx, y: this.originalSelection.y + this.totalDy }
      : null;

    this.isDragging = false;
    this.dragStart = null;
    // targetPixels, fullSnapshot은 다음 드래그를 위해 정리
    this.targetPixels = [];
    this.fullSnapshot = [];
    this.originalSelection = null;

    // ★ floatingPixels, hasFloating는 유지! 선택 해제 전까지 보존
    return { undoable: true, selection: finalSelection };
  }

  /**
   * 플로팅 픽셀 해제 — 선택 영역 해제 시 호출
   * 현재 캔버스에 배치된 상태가 최종 결과가 됨
   */
  clearFloating(): void {
    this.floatingPixels = [];
    this.hasFloating = false;
  }

  /** 플로팅 픽셀이 있는지 확인 */
  get isFloating(): boolean {
    return this.hasFloating;
  }

  reset(): void {
    this.isDragging = false;
    this.dragStart = null;
    this.targetPixels = [];
    this.fullSnapshot = [];
    this.originalSelection = null;
    this.floatingPixels = [];
    this.hasFloating = false;
    this.totalDx = 0;
    this.totalDy = 0;
  }
}
