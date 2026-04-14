/**
 * SpriteSheetExporter — 스프라이트 시트 PNG 생성
 *
 * 모든 프레임을 가로로 나열한 스프라이트 시트 생성
 * 결과: Blob (PNG) + 메타데이터
 */
import type { AnimationFrame } from '../../types/editor';
import { LayerCompositor } from '../core/LayerCompositor';

export interface SpriteSheetResult {
  blob: Blob;
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}

/**
 * 프레임 배열 → 스프라이트 시트 PNG Blob
 * 프레임을 가로로 나열 (1행)
 */
export async function exportSpriteSheet(
  frames: AnimationFrame[],
  canvasSize: number,
): Promise<SpriteSheetResult> {
  const frameCount = frames.length;
  const sheetWidth = canvasSize * frameCount;
  const sheetHeight = canvasSize;

  const sheet = new OffscreenCanvas(sheetWidth, sheetHeight);
  const ctx = sheet.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const compositor = new LayerCompositor(canvasSize);

  for (let i = 0; i < frameCount; i++) {
    const imgData = compositor.composite(frames[i].layers);
    const tmp = new OffscreenCanvas(canvasSize, canvasSize);
    tmp.getContext('2d')!.putImageData(imgData, 0, 0);
    ctx.drawImage(tmp, i * canvasSize, 0);
  }

  const blob = await sheet.convertToBlob({ type: 'image/png' });

  return {
    blob,
    width: sheetWidth,
    height: sheetHeight,
    frameWidth: canvasSize,
    frameHeight: canvasSize,
    frameCount,
  };
}

/**
 * 단일 프레임 → PNG Blob
 */
export async function exportSingleFrame(
  frame: AnimationFrame,
  canvasSize: number,
  scale: number = 1,
): Promise<Blob> {
  const compositor = new LayerCompositor(canvasSize);
  const imgData = compositor.composite(frame.layers);

  const outSize = canvasSize * scale;
  const out = new OffscreenCanvas(outSize, outSize);
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const tmp = new OffscreenCanvas(canvasSize, canvasSize);
  tmp.getContext('2d')!.putImageData(imgData, 0, 0);
  ctx.drawImage(tmp, 0, 0, outSize, outSize);

  return out.convertToBlob({ type: 'image/png' });
}

/** Blob을 다운로드 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
