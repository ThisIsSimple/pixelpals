/**
 * EditorCanvas — Canvas 2D 렌더링 엔진
 *
 * 렌더링 파이프라인:
 *  1. 체커보드 배경 (투명 영역 표시)
 *  2. 어니언 스킨 (이전/다음 프레임, 옵션)
 *  3. 합성된 레이어 이미지
 *  4. 그리드 오버레이 (옵션)
 *  5. 도구 프리뷰 오버레이
 *  6. 선택 영역 표시
 *  7. 커서 위치 표시
 */
import type {
  LayerData, ViewportState, PixelChange, SelectionRect, OnionSkinConfig,
  SymmetryMode,
} from '../../types/editor';
import { LayerCompositor } from './LayerCompositor';

const CHECKER_LIGHT = '#c8c8c8';
const CHECKER_DARK = '#a0a0a0';
const GRID_COLOR = 'rgba(255,255,255,0.15)';
const SELECTION_DASH = [4, 4];
const CURSOR_COLOR = 'rgba(255,255,255,0.5)';
const ONION_PREV_COLOR = 'rgba(255,60,60,';  // + opacity)
const ONION_NEXT_COLOR = 'rgba(60,120,255,'; // + opacity)
const SYMMETRY_LINE_COLOR = 'rgba(255, 0, 255, 0.6)';
const SYMMETRY_LINE_DASH = [6, 3];

export class EditorCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private compositor: LayerCompositor;

  private _size: number;
  private _viewport: ViewportState = { zoom: 1, panX: 0, panY: 0 };
  private _showGrid = true;
  private _cursorPixel: { x: number; y: number } | null = null;
  private _preview: PixelChange[] = [];
  private _selection: SelectionRect | null = null;
  private _selectionPhase = 0; // marching ants 애니메이션용
  private _animFrameId = 0;

  // 캐시: 합성된 프레임 이미지
  private _compositeCache: ImageData | null = null;
  private _compositeDirty = true;

  // 대칭 가이드라인
  private _symmetryMode: SymmetryMode = 'none';
  private _symmetryAxisPosition = 0.5;

  // 어니언 스킨 캐시
  private _onionPrevImages: ImageData[] = [];
  private _onionNextImages: ImageData[] = [];
  private _onionConfig: OnionSkinConfig = {
    enabled: false, prevFrames: 1, nextFrames: 0, opacity: 0.3,
  };

  constructor(canvas: HTMLCanvasElement, size: number) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this._size = size;
    this.compositor = new LayerCompositor(size);
    this.ctx.imageSmoothingEnabled = false;
  }

  // ─── 공개 API ───

  get size(): number { return this._size; }
  get viewport(): ViewportState { return { ...this._viewport }; }

  setSize(size: number): void {
    this._size = size;
    this.compositor.resize(size);
    this.invalidate();
  }

  setViewport(vp: Partial<ViewportState>): void {
    Object.assign(this._viewport, vp);
  }

  setShowGrid(show: boolean): void { this._showGrid = show; }
  setCursorPixel(x: number, y: number): void { this._cursorPixel = { x, y }; }
  clearCursor(): void { this._cursorPixel = null; }
  setPreview(pixels: PixelChange[]): void { this._preview = pixels; }
  clearPreview(): void { this._preview = []; }
  setSelection(sel: SelectionRect | null): void { this._selection = sel; }
  setOnionSkinConfig(cfg: OnionSkinConfig): void { this._onionConfig = cfg; }
  setSymmetry(mode: SymmetryMode, axisPosition: number): void {
    this._symmetryMode = mode;
    this._symmetryAxisPosition = axisPosition;
  }

  /** 합성 캐시 무효화 — 레이어 데이터 변경 시 호출 */
  invalidate(): void { this._compositeDirty = true; }

  /** 어니언 스킨용 프레임 이미지 설정 */
  setOnionSkinFrames(prev: LayerData[][], next: LayerData[][]): void {
    this._onionPrevImages = prev.map(layers => this.compositor.composite(layers));
    this._onionNextImages = next.map(layers => this.compositor.composite(layers));
  }

  /** 줌 레벨에 따른 실제 픽셀 크기 */
  get pixelDisplaySize(): number {
    return this._viewport.zoom;
  }

  /**
   * 화면 좌표 → 픽셀 좌표 변환
   * canvas 엘리먼트 기준 clientX/Y를 받아 에디터 픽셀 좌표로 변환
   */
  screenToPixel(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;

    const { zoom, panX, panY } = this._viewport;
    const totalSize = this._size * zoom;
    const originX = (this.canvas.width - totalSize) / 2 + panX;
    const originY = (this.canvas.height - totalSize) / 2 + panY;

    const px = Math.floor((canvasX - originX) / zoom);
    const py = Math.floor((canvasY - originY) / zoom);
    return { x: px, y: py };
  }

  /** 최적 줌 레벨 자동 계산 (캔버스 영역에 맞춤) */
  fitToView(): void {
    const rect = this.canvas.getBoundingClientRect();
    const maxDim = Math.min(rect.width, rect.height) * 0.85;
    const zoom = Math.max(1, Math.floor(maxDim / this._size));
    this._viewport = { zoom, panX: 0, panY: 0 };
  }

  // ─── 렌더링 ───

  /** 메인 렌더 — 전체 파이프라인 실행 */
  render(layers: LayerData[]): void {
    const { ctx, canvas } = this;
    const w = canvas.width;
    const h = canvas.height;

    // 배경 클리어
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    const { zoom, panX, panY } = this._viewport;
    const totalSize = this._size * zoom;
    const originX = Math.round((w - totalSize) / 2 + panX);
    const originY = Math.round((h - totalSize) / 2 + panY);

    // 1. 체커보드 배경
    this.drawCheckerboard(originX, originY, totalSize, zoom);

    // 2. 어니언 스킨 (이전 프레임)
    if (this._onionConfig.enabled) {
      this.drawOnionSkin(originX, originY, zoom);
    }

    // 3. 합성된 레이어
    if (this._compositeDirty) {
      this._compositeCache = this.compositor.composite(layers);
      this._compositeDirty = false;
    }
    if (this._compositeCache) {
      this.drawImageData(this._compositeCache, originX, originY, zoom);
    }

    // 4. 도구 프리뷰
    if (this._preview.length > 0) {
      this.drawPreview(originX, originY, zoom);
    }

    // 5. 그리드 (zoom >= 2에서 표시)
    if (this._showGrid && zoom >= 2) {
      this.drawGrid(originX, originY, totalSize, zoom);
    }

    // 5.5. 대칭 가이드라인
    if (this._symmetryMode !== 'none') {
      this.drawSymmetryGuide(originX, originY, totalSize, zoom);
    }

    // 6. 선택 영역
    if (this._selection) {
      this.drawSelection(originX, originY, zoom);
    }

    // 7. 커서 위치
    if (this._cursorPixel) {
      this.drawCursor(originX, originY, zoom);
    }
  }

  /** 선택 영역 marching ants 애니메이션 시작 */
  startSelectionAnimation(): void {
    if (this._animFrameId) return;
    const animate = () => {
      this._selectionPhase = (this._selectionPhase + 1) % 16;
      this._animFrameId = requestAnimationFrame(animate);
    };
    // 느린 속도로 업데이트 (약 8fps)
    const slowAnimate = () => {
      this._selectionPhase = (this._selectionPhase + 1) % 16;
      setTimeout(() => {
        this._animFrameId = requestAnimationFrame(slowAnimate);
      }, 120);
    };
    slowAnimate();
  }

  stopSelectionAnimation(): void {
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = 0;
    }
  }

  destroy(): void {
    this.stopSelectionAnimation();
  }

  // ─── 프라이빗 렌더링 헬퍼 ───

  private drawCheckerboard(ox: number, oy: number, totalSize: number, zoom: number): void {
    const ctx = this.ctx;
    const checkerSize = Math.max(1, Math.floor(zoom / 2)) || 1;
    const count = Math.ceil(totalSize / checkerSize);

    for (let cy = 0; cy < count; cy++) {
      for (let cx = 0; cx < count; cx++) {
        ctx.fillStyle = (cx + cy) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK;
        ctx.fillRect(
          ox + cx * checkerSize,
          oy + cy * checkerSize,
          checkerSize, checkerSize,
        );
      }
    }
  }

  private drawImageData(imgData: ImageData, ox: number, oy: number, zoom: number): void {
    const ctx = this.ctx;
    // ImageData를 임시 캔버스에 넣고 스케일 렌더
    const tmp = new OffscreenCanvas(imgData.width, imgData.height);
    const tmpCtx = tmp.getContext('2d')!;
    tmpCtx.putImageData(imgData, 0, 0);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tmp, ox, oy, this._size * zoom, this._size * zoom);
  }

  private drawGrid(ox: number, oy: number, totalSize: number, zoom: number): void {
    const ctx = this.ctx;
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let i = 0; i <= this._size; i++) {
      const pos = Math.round(ox + i * zoom) + 0.5;
      ctx.moveTo(pos, oy);
      ctx.lineTo(pos, oy + totalSize);
      ctx.moveTo(ox, Math.round(oy + i * zoom) + 0.5);
      ctx.lineTo(ox + totalSize, Math.round(oy + i * zoom) + 0.5);
    }
    ctx.stroke();
  }

  private drawPreview(ox: number, oy: number, zoom: number): void {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.6;
    for (const { x, y, color } of this._preview) {
      if (x < 0 || x >= this._size || y < 0 || y >= this._size) continue;
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(ox + x * zoom, oy + y * zoom, zoom, zoom);
      } else {
        // 지우기 프리뷰: 빨간 X 표시
        ctx.fillStyle = 'rgba(255,0,0,0.3)';
        ctx.fillRect(ox + x * zoom, oy + y * zoom, zoom, zoom);
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawSelection(ox: number, oy: number, zoom: number): void {
    if (!this._selection) return;
    const ctx = this.ctx;
    const { x, y, width, height } = this._selection;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.setLineDash(SELECTION_DASH);
    ctx.lineDashOffset = -this._selectionPhase;
    ctx.strokeRect(
      ox + x * zoom + 0.5,
      oy + y * zoom + 0.5,
      width * zoom - 1,
      height * zoom - 1,
    );

    // 내부에 반전 점선
    ctx.strokeStyle = '#000000';
    ctx.lineDashOffset = -this._selectionPhase + 4;
    ctx.strokeRect(
      ox + x * zoom + 0.5,
      oy + y * zoom + 0.5,
      width * zoom - 1,
      height * zoom - 1,
    );
    ctx.setLineDash([]);
  }

  private drawCursor(ox: number, oy: number, zoom: number): void {
    if (!this._cursorPixel) return;
    const ctx = this.ctx;
    const { x, y } = this._cursorPixel;
    if (x < 0 || x >= this._size || y < 0 || y >= this._size) return;

    ctx.strokeStyle = CURSOR_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      ox + x * zoom + 0.5,
      oy + y * zoom + 0.5,
      zoom - 1,
      zoom - 1,
    );
  }

  private drawOnionSkin(ox: number, oy: number, zoom: number): void {
    const ctx = this.ctx;
    const { opacity } = this._onionConfig;

    // 이전 프레임 (빨간 틴트)
    for (let i = 0; i < this._onionPrevImages.length; i++) {
      const fade = opacity * (1 - i * 0.3);
      if (fade <= 0) break;
      ctx.globalAlpha = fade;
      this.drawImageDataTinted(this._onionPrevImages[i], ox, oy, zoom, ONION_PREV_COLOR);
    }

    // 다음 프레임 (파란 틴트)
    for (let i = 0; i < this._onionNextImages.length; i++) {
      const fade = opacity * (1 - i * 0.3);
      if (fade <= 0) break;
      ctx.globalAlpha = fade;
      this.drawImageDataTinted(this._onionNextImages[i], ox, oy, zoom, ONION_NEXT_COLOR);
    }
    ctx.globalAlpha = 1;
  }

  private drawImageDataTinted(
    imgData: ImageData, ox: number, oy: number, zoom: number, tintBase: string,
  ): void {
    const ctx = this.ctx;
    const s = this._size;
    const data = imgData.data;

    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const idx = (y * s + x) * 4;
        const a = data[idx + 3];
        if (a > 0) {
          ctx.fillStyle = tintBase + (a / 255).toFixed(2) + ')';
          ctx.fillRect(ox + x * zoom, oy + y * zoom, zoom, zoom);
        }
      }
    }
  }

  private drawSymmetryGuide(ox: number, oy: number, totalSize: number, zoom: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = SYMMETRY_LINE_COLOR;
    ctx.lineWidth = 2;
    ctx.setLineDash(SYMMETRY_LINE_DASH);

    const axisPixel = Math.round(this._size * this._symmetryAxisPosition);

    if (this._symmetryMode === 'horizontal' || this._symmetryMode === 'both') {
      // 세로선 (좌우 대칭)
      const x = Math.round(ox + axisPixel * zoom) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, oy);
      ctx.lineTo(x, oy + totalSize);
      ctx.stroke();
    }

    if (this._symmetryMode === 'vertical' || this._symmetryMode === 'both') {
      // 가로선 (상하 대칭)
      const y = Math.round(oy + axisPixel * zoom) + 0.5;
      ctx.beginPath();
      ctx.moveTo(ox, y);
      ctx.lineTo(ox + totalSize, y);
      ctx.stroke();
    }

    ctx.restore();
  }
}
