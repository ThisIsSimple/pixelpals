/**
 * LayerPanel — 레이어 관리 UI
 * 표시/숨김, 잠금, 불투명도, 순서 변경
 */
import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';

export const LayerPanel: React.FC = () => {
  const frames = useEditorStore(s => s.frames);
  const currentFrameIndex = useEditorStore(s => s.currentFrameIndex);
  const currentLayerIndex = useEditorStore(s => s.currentLayerIndex);
  const setCurrentLayer = useEditorStore(s => s.setCurrentLayer);
  const toggleLayerVisibility = useEditorStore(s => s.toggleLayerVisibility);
  const toggleLayerLock = useEditorStore(s => s.toggleLayerLock);
  const setLayerOpacity = useEditorStore(s => s.setLayerOpacity);
  const moveLayer = useEditorStore(s => s.moveLayer);

  const currentFrame = frames[currentFrameIndex];
  if (!currentFrame) return null;

  const layers = currentFrame.layers;

  return (
    <div className="mb-3">
      <div className="font-pixel text-[9px] text-pixel-muted mb-1">레이어</div>

      {/* 레이어 목록 (위에서부터 = 가장 위 레이어) */}
      <div className="flex flex-col gap-0.5">
        {[...layers].reverse().map((layer, revIdx) => {
          const realIdx = layers.length - 1 - revIdx;
          const isActive = currentLayerIndex === realIdx;

          return (
            <div
              key={layer.id}
              onClick={() => setCurrentLayer(realIdx)}
              className={`flex items-center gap-1 px-1.5 py-1 cursor-pointer transition-colors text-[10px]
                ${isActive
                  ? 'bg-pixel-primary border border-blue-500/50'
                  : 'border border-transparent hover:bg-pixel-primary/50'
                }`}
            >
              {/* 표시/숨김 */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(realIdx); }}
                className="w-5 h-5 flex items-center justify-center text-xs shrink-0"
                title={layer.visible ? '숨기기' : '표시'}
              >
                {layer.visible ? '👁' : '—'}
              </button>

              {/* 잠금 */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleLayerLock(realIdx); }}
                className="w-5 h-5 flex items-center justify-center text-xs shrink-0"
                title={layer.locked ? '잠금 해제' : '잠금'}
              >
                {layer.locked ? '🔒' : ' '}
              </button>

              {/* 이름 */}
              <span className={`font-pixel flex-1 truncate ${isActive ? 'text-pixel-text' : 'text-pixel-muted'}`}>
                {layer.name}
              </span>

              {/* 순서 변경 */}
              <div className="flex flex-col shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); if (realIdx < layers.length - 1) moveLayer(realIdx, realIdx + 1); }}
                  className="text-[8px] text-pixel-muted hover:text-pixel-text leading-none"
                  title="위로"
                >▲</button>
                <button
                  onClick={(e) => { e.stopPropagation(); if (realIdx > 0) moveLayer(realIdx, realIdx - 1); }}
                  className="text-[8px] text-pixel-muted hover:text-pixel-text leading-none"
                  title="아래로"
                >▼</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 현재 레이어 불투명도 */}
      {layers[currentLayerIndex] && (
        <div className="mt-2 flex items-center gap-1">
          <span className="font-pixel text-[8px] text-pixel-muted shrink-0">투명도</span>
          <input
            type="range"
            min={0} max={100}
            value={Math.round(layers[currentLayerIndex].opacity * 100)}
            onChange={(e) => setLayerOpacity(currentLayerIndex, Number(e.target.value) / 100)}
            className="flex-1 h-1 accent-pixel-accent"
          />
          <span className="font-pixel text-[8px] text-pixel-muted w-8 text-right">
            {Math.round(layers[currentLayerIndex].opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  );
};
