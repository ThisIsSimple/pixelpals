import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';

interface Props {
  onClose: () => void;
}

/**
 * EditorPlaceholder — Phase C2에서 완전한 픽셀 에디터로 교체될 자리
 * 현재는 에디터 UI 구조와 기본 인터랙션만 표시
 */
export const EditorPlaceholder: React.FC<Props> = ({ onClose }) => {
  const {
    canvasSize, currentTool, currentColor, palette,
    showGrid, symmetryMode, currentLayerIndex, frames, currentFrameIndex,
    setTool, setColor, toggleGrid, toggleSymmetry,
    setCurrentLayer, setPixel, setCanvasSize,
  } = useEditorStore();

  const tools: { id: string; label: string; icon: string }[] = [
    { id: 'pencil', label: '연필', icon: '✏️' },
    { id: 'eraser', label: '지우개', icon: '🧹' },
    { id: 'fill', label: '채우기', icon: '🪣' },
    { id: 'eyedropper', label: '스포이드', icon: '💉' },
    { id: 'line', label: '선', icon: '📏' },
    { id: 'rectangle', label: '사각형', icon: '⬜' },
    { id: 'select', label: '선택', icon: '⊡' },
  ];

  const layerNames = ['몸체', '얼굴', '악세서리', '이펙트'];
  const currentFrame = frames[currentFrameIndex];
  const currentLayer = currentFrame?.layers[currentLayerIndex];

  const pixelSize = Math.min(400, window.innerWidth - 240) / canvasSize;

  const handlePixelClick = (x: number, y: number) => {
    if (currentTool === 'pencil') {
      setPixel(x, y, currentColor);
    } else if (currentTool === 'eraser') {
      setPixel(x, y, null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Galmuri11, monospace',
        color: '#eaeaea',
      }}
    >
      {/* 헤더 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 16px', backgroundColor: '#16213e', borderBottom: '2px solid #8a8a9a',
      }}>
        <span style={{ fontSize: '16px', color: '#e94560' }}>🎨 픽셀 에디터</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={canvasSize}
            onChange={(e) => setCanvasSize(Number(e.target.value) as 16 | 24 | 32)}
            style={{
              fontFamily: 'Galmuri11', fontSize: '11px',
              backgroundColor: '#0f3460', color: '#eaeaea', border: '1px solid #8a8a9a',
              padding: '4px',
            }}
          >
            <option value={16}>16x16</option>
            <option value={24}>24x24</option>
            <option value={32}>32x32</option>
          </select>
          <button onClick={onClose} style={{
            fontFamily: 'Galmuri11', fontSize: '13px',
            backgroundColor: '#e94560', color: '#fff', border: 'none',
            padding: '6px 12px', cursor: 'pointer',
          }}>
            ✕ 닫기
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* 도구 바 (좌측) */}
        <div style={{
          width: '64px', backgroundColor: '#16213e', borderRight: '2px solid #8a8a9a',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
          padding: '8px 0',
        }}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setTool(tool.id as import('../../types/editor').EditorTool)}
              title={tool.label}
              style={{
                width: '40px', height: '40px',
                fontSize: '20px',
                backgroundColor: currentTool === tool.id ? '#e94560' : '#0f3460',
                border: '1px solid #8a8a9a',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {tool.icon}
            </button>
          ))}

          <div style={{ borderTop: '1px solid #8a8a9a', width: '80%', margin: '4px 0' }} />

          <button onClick={toggleGrid} style={{
            width: '40px', height: '40px', fontSize: '11px',
            backgroundColor: showGrid ? '#008751' : '#0f3460',
            border: '1px solid #8a8a9a', cursor: 'pointer', color: '#eaeaea',
            fontFamily: 'Galmuri11',
          }}>
            격자
          </button>

          <button onClick={toggleSymmetry} style={{
            width: '40px', height: '40px', fontSize: '11px',
            backgroundColor: symmetryMode ? '#008751' : '#0f3460',
            border: '1px solid #8a8a9a', cursor: 'pointer', color: '#eaeaea',
            fontFamily: 'Galmuri11',
          }}>
            대칭
          </button>
        </div>

        {/* 캔버스 영역 (중앙) */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#0a0a1a',
        }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${canvasSize}, ${pixelSize}px)`,
              border: '2px solid #8a8a9a',
              imageRendering: 'pixelated',
            }}
          >
            {currentLayer && Array.from({ length: canvasSize }).map((_, y) =>
              Array.from({ length: canvasSize }).map((_, x) => {
                const color = currentLayer.pixels[y]?.[x];
                return (
                  <div
                    key={`${x}-${y}`}
                    onMouseDown={() => handlePixelClick(x, y)}
                    onMouseEnter={(e) => {
                      if (e.buttons === 1) handlePixelClick(x, y);
                    }}
                    style={{
                      width: `${pixelSize}px`,
                      height: `${pixelSize}px`,
                      backgroundColor: color || 'transparent',
                      border: showGrid ? '0.5px solid rgba(138,138,154,0.2)' : 'none',
                      cursor: 'crosshair',
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* 우측 패널 (팔레트 + 레이어) */}
        <div style={{
          width: '180px', backgroundColor: '#16213e', borderLeft: '2px solid #8a8a9a',
          padding: '8px', overflowY: 'auto',
        }}>
          {/* 팔레트 */}
          <div style={{ fontSize: '11px', marginBottom: '6px', color: '#8a8a9a' }}>팔레트</div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px',
            marginBottom: '12px',
          }}>
            {palette.map((color, i) => (
              <div
                key={i}
                onClick={() => setColor(color)}
                style={{
                  width: '100%', aspectRatio: '1',
                  backgroundColor: color,
                  border: currentColor === color ? '2px solid #fff' : '1px solid #5f574f',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {/* 현재 색상 */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px',
          }}>
            <div style={{
              width: '32px', height: '32px',
              backgroundColor: currentColor,
              border: '2px solid #eaeaea',
            }} />
            <span style={{ fontSize: '7px' }}>{currentColor}</span>
          </div>

          {/* 레이어 */}
          <div style={{ fontSize: '11px', marginBottom: '6px', color: '#8a8a9a' }}>레이어</div>
          {layerNames.map((name, i) => (
            <div
              key={i}
              onClick={() => setCurrentLayer(i)}
              style={{
                padding: '6px 8px', marginBottom: '2px',
                fontSize: '11px',
                backgroundColor: currentLayerIndex === i ? '#0f3460' : 'transparent',
                border: currentLayerIndex === i ? '1px solid #29adff' : '1px solid transparent',
                cursor: 'pointer',
                display: 'flex', justifyContent: 'space-between',
              }}
            >
              <span>{name}</span>
              <span style={{ color: '#8a8a9a' }}>
                {currentFrame?.layers[i]?.visible ? '👁' : '🚫'}
              </span>
            </div>
          ))}

          {/* 프레임 */}
          <div style={{ fontSize: '11px', marginTop: '12px', marginBottom: '6px', color: '#8a8a9a' }}>
            프레임 ({frames.length})
          </div>
          <div style={{ fontSize: '11px', color: '#8a8a9a' }}>
            Phase C2에서 프레임 타임라인 구현
          </div>
        </div>
      </div>
    </div>
  );
};
