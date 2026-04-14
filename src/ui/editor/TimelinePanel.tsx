/**
 * TimelinePanel — 프레임 타임라인
 * 하단에 위치, 프레임 추가/삭제/복제/이동 + 재생 컨트롤
 */
import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { LayerCompositor } from '../../editor/core/LayerCompositor';

export const TimelinePanel: React.FC = () => {
  const frames = useEditorStore(s => s.frames);
  const currentFrameIndex = useEditorStore(s => s.currentFrameIndex);
  const canvasSize = useEditorStore(s => s.canvasSize);
  const isPlaying = useEditorStore(s => s.isPlaying);
  const fps = useEditorStore(s => s.fps);
  const onionSkin = useEditorStore(s => s.onionSkin);
  const renderVersion = useEditorStore(s => s.renderVersion);

  const setCurrentFrame = useEditorStore(s => s.setCurrentFrame);
  const addFrame = useEditorStore(s => s.addFrame);
  const duplicateFrame = useEditorStore(s => s.duplicateFrame);
  const removeFrame = useEditorStore(s => s.removeFrame);
  const setPlaying = useEditorStore(s => s.setPlaying);
  const setFps = useEditorStore(s => s.setFps);
  const setOnionSkin = useEditorStore(s => s.setOnionSkin);

  return (
    <div className="h-20 bg-pixel-surface border-t-2 border-pixel-muted/30 flex items-center px-3 gap-3 shrink-0">
      {/* 재생 컨트롤 */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setCurrentFrame(Math.max(0, currentFrameIndex - 1))}
          className="w-7 h-7 font-pixel text-pixel-sm flex items-center justify-center bg-pixel-primary border border-pixel-muted/30 hover:bg-pixel-accent transition-colors"
          title="이전 프레임 ([)"
        >◀</button>

        <button
          onClick={() => setPlaying(!isPlaying)}
          className={`w-8 h-7 font-pixel text-pixel-sm flex items-center justify-center border transition-colors
            ${isPlaying ? 'bg-pixel-accent border-pixel-accent' : 'bg-pixel-primary border-pixel-muted/30 hover:bg-pixel-accent'}`}
          title={isPlaying ? '정지' : '재생'}
        >
          {isPlaying ? '■' : '▶'}
        </button>

        <button
          onClick={() => setCurrentFrame(Math.min(frames.length - 1, currentFrameIndex + 1))}
          className="w-7 h-7 font-pixel text-pixel-sm flex items-center justify-center bg-pixel-primary border border-pixel-muted/30 hover:bg-pixel-accent transition-colors"
          title="다음 프레임 (])"
        >▶</button>
      </div>

      {/* FPS */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="font-pixel text-[8px] text-pixel-muted">FPS</span>
        <input
          type="number"
          min={1} max={24}
          value={fps}
          onChange={(e) => setFps(Number(e.target.value))}
          className="w-10 font-pixel text-[9px] bg-pixel-primary text-pixel-text border border-pixel-muted/30 px-1 py-0.5 text-center"
        />
      </div>

      {/* 어니언 스킨 */}
      <button
        onClick={() => setOnionSkin({ enabled: !onionSkin.enabled })}
        title="어니언 스킨"
        className={`shrink-0 px-2 h-7 font-pixel text-[8px] flex items-center gap-1 border transition-colors
          ${onionSkin.enabled
            ? 'bg-purple-700 border-purple-500 text-white'
            : 'bg-pixel-primary border-pixel-muted/30 text-pixel-muted'
          }`}
      >
        🧅
      </button>

      {/* 프레임 목록 */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto py-1">
        {frames.map((frame, i) => (
          <FrameThumbnail
            key={i}
            index={i}
            isActive={i === currentFrameIndex}
            canvasSize={canvasSize}
            layers={frame.layers}
            renderVersion={renderVersion}
            onClick={() => setCurrentFrame(i)}
            onDuplicate={() => duplicateFrame(i)}
            onRemove={() => removeFrame(i)}
            canRemove={frames.length > 1}
          />
        ))}

        {/* 프레임 추가 버튼 */}
        <button
          onClick={addFrame}
          className="w-12 h-12 border-2 border-dashed border-pixel-muted/30 text-pixel-muted hover:border-pixel-accent hover:text-pixel-accent transition-colors flex items-center justify-center text-lg shrink-0"
          title="새 프레임 추가"
        >
          +
        </button>
      </div>
    </div>
  );
};

/** 개별 프레임 썸네일 */
const FrameThumbnail: React.FC<{
  index: number;
  isActive: boolean;
  canvasSize: number;
  layers: any[];
  renderVersion: number;
  onClick: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canRemove: boolean;
}> = ({ index, isActive, canvasSize, layers, renderVersion, onClick, onDuplicate, onRemove, canRemove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const scale = 2;
    canvas.width = canvasSize * scale;
    canvas.height = canvasSize * scale;
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = '#2a2a3e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const compositor = new LayerCompositor(canvasSize);
    const imgData = compositor.composite(layers);
    const tmp = new OffscreenCanvas(canvasSize, canvasSize);
    tmp.getContext('2d')!.putImageData(imgData, 0, 0);
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
  }, [canvasSize, layers, renderVersion]);

  return (
    <div
      onClick={onClick}
      className={`relative shrink-0 cursor-pointer group
        ${isActive ? 'ring-2 ring-pixel-accent' : 'ring-1 ring-pixel-muted/20 hover:ring-pixel-muted/50'}`}
    >
      <canvas
        ref={canvasRef}
        style={{ imageRendering: 'pixelated', width: '48px', height: '48px' }}
      />
      <span className="absolute bottom-0 left-0 font-pixel text-[7px] bg-black/60 text-pixel-muted px-0.5">
        {index + 1}
      </span>

      {/* 호버 시 복제/삭제 */}
      <div className="absolute top-0 right-0 hidden group-hover:flex gap-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="w-4 h-4 bg-blue-600 text-white text-[8px] flex items-center justify-center"
          title="복제"
        >⧉</button>
        {canRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="w-4 h-4 bg-red-600 text-white text-[8px] flex items-center justify-center"
            title="삭제"
          >✕</button>
        )}
      </div>
    </div>
  );
};
