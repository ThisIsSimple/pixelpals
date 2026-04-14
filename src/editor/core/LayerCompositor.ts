/**
 * LayerCompositor — 레이어 합성 엔진
 *
 * 각 레이어의 픽셀 데이터를 OffscreenCanvas에 렌더한 후
 * 아래→위 순서로 합성하여 최종 이미지를 생성한다.
 */
import type { LayerData } from '../../types/editor';

export class LayerCompositor {
  private size: number;
  private compositeCanvas: OffscreenCanvas;
  private compositeCtx: OffscreenCanvasRenderingContext2D;

  constructor(size: number) {
    this.size = size;
    this.compositeCanvas = new OffscreenCanvas(size, size);
    this.compositeCtx = this.compositeCanvas.getContext('2d')!;
  }

  /** 캔버스 크기 변경 */
  resize(size: number): void {
    this.size = size;
    this.compositeCanvas = new OffscreenCanvas(size, size);
    this.compositeCtx = this.compositeCanvas.getContext('2d')!;
  }

  /**
   * 여러 레이어를 합성하여 하나의 ImageData로 반환
   * layers[0]이 가장 아래, 마지막이 가장 위
   */
  composite(layers: LayerData[]): ImageData {
    const ctx = this.compositeCtx;
    const s = this.size;
    ctx.clearRect(0, 0, s, s);

    for (const layer of layers) {
      if (!layer.visible || layer.opacity <= 0) continue;

      ctx.globalAlpha = layer.opacity;
      const { pixels } = layer;
      for (let y = 0; y < s; y++) {
        const row = pixels[y];
        if (!row) continue;
        for (let x = 0; x < s; x++) {
          const color = row[x];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    ctx.globalAlpha = 1;
    return ctx.getImageData(0, 0, s, s);
  }

  /**
   * 단일 레이어를 ImageData로 렌더
   * 어니언 스킨 등에서 개별 레이어 렌더링 시 사용
   */
  renderLayer(layer: LayerData): ImageData {
    const ctx = this.compositeCtx;
    const s = this.size;
    ctx.clearRect(0, 0, s, s);
    ctx.globalAlpha = 1;

    const { pixels } = layer;
    for (let y = 0; y < s; y++) {
      const row = pixels[y];
      if (!row) continue;
      for (let x = 0; x < s; x++) {
        const color = row[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    return ctx.getImageData(0, 0, s, s);
  }

  /**
   * 프레임의 모든 레이어를 합성하여 Blob(PNG)으로 반환
   * 스프라이트 시트 내보내기에 사용
   */
  async compositeToBlob(layers: LayerData[]): Promise<Blob> {
    this.composite(layers);
    return this.compositeCanvas.convertToBlob({ type: 'image/png' });
  }
}
