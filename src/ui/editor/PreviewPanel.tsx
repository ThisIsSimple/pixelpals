/**
 * PreviewPanel — 실시간 미리보기
 * 현재 프레임 또는 애니메이션을 1x 크기로 렌더링
 */
import React, { useRef, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { LayerCompositor } from '../../editor/core/LayerCompositor';

export const PreviewPanel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compositorRef = useRef<LayerCompositor | null>(null);
  const animFrameRef = useRef(0);
  const frameIdxRef = useRef(0);
  const lastTickRef = useRef(0);

  const frames = useEditorStore(s => s.frames);
  const canvasSize = useEditorStore(s => s.canvasSize);
  const currentFrameIndex = useEditorStore(s => s.currentFrameIndex);
  const isPlaying = useEditorStore(s => s.isPlaying);
  const fps = useEditorStore(s => s.fps);
  const renderVersion = useEditorStore(s => s.renderVersion);

  // 초기화
  useEffect(() => {
    compositorRef.current = new LayerCompositor(canvasSize);
    return () => { compositorRef.current = null; };
  }, [canvasSize]);

  const renderFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    const compositor = compositorRef.current;
    if (!canvas || !compositor) return;

    const ctx = canvas.getContext('2d')!;
    const scale = 4; // 4x 확대
    canvas.width = canvasSize * scale;
    canvas.height = canvasSize * scale;

    ctx.imageSmoothingEnabled = false;

    // 배경
    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const frame = frames[frameIdx];
    if (!frame) return;

    const imgData = compositor.composite(frame.layers);
    const tmp = new OffscreenCanvas(canvasSize, canvasSize);
    const tmpCtx = tmp.getContext('2d')!;
    tmpCtx.putImageData(imgData, 0, 0);

    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
  }, [frames, canvasSize]);

  // 정지 상태 → 현재 프레임만 표시
  useEffect(() => {
    if (!isPlaying) {
      renderFrame(currentFrameIndex);
    }
  }, [isPlaying, currentFrameIndex, renderVersion, renderFrame]);

  // 재생 상태 → 애니메이션 루프
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    frameIdxRef.current = 0;
    lastTickRef.current = performance.now();

    const interval = 1000 / fps;
    const loop = (now: number) => {
      if (now - lastTickRef.current >= interval) {
        lastTickRef.current = now;
        frameIdxRef.current = (frameIdxRef.current + 1) % frames.length;
        renderFrame(frameIdxRef.current);
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };
    animFrameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, fps, frames.length, renderFrame]);

  return (
    <div className="mb-3">
      <div className="font-pixel text-[9px] text-pixel-muted mb-1">미리보기</div>
      <div className="bg-[#2a2a3e] border border-pixel-muted/30 p-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ imageRendering: 'pixelated', width: '100%', maxWidth: '128px' }}
        />
      </div>
    </div>
  );
};
