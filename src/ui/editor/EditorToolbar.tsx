/**
 * EditorToolbar — 좌측 도구 바
 * 9개 도구 (이동 추가) + 그리드/대칭 토글
 * 아이콘은 벡터 아이콘 팩 이미지 + SVG 인라인 폴백
 */
import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import type { EditorTool, SymmetryMode } from '../../types/editor';

/** 아이콘 팩 경로 헬퍼 */
const iconPath = (path: string) => `/assets/vector-icon-pack/${path}`;

/** SVG 인라인 아이콘 (아이콘팩에 없는 도구용) */
const SvgIcon: React.FC<{ d: string; className?: string }> = ({ d, className = '' }) => (
  <svg viewBox="0 0 24 24" className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d={d} />
  </svg>
);

const TOOLS: { id: EditorTool; label: string; shortcut: string; iconSrc?: string; svgPath?: string }[] = [
  { id: 'pencil',     label: '연필',     shortcut: 'P', iconSrc: iconPath('Tools/Pencil/Pencil Flat White 64.png') },
  { id: 'eraser',     label: '지우개',   shortcut: 'E', iconSrc: iconPath('Items/Eraser/Eraser Flat White 64.png') },
  { id: 'fill',       label: '채우기',   shortcut: 'G', iconSrc: iconPath('Tools/Paint Bucket/Paint Bucket Flat White 64.png') },
  { id: 'line',       label: '선',       shortcut: 'L', svgPath: 'M5 19L19 5' },
  { id: 'rectangle',  label: '사각형',   shortcut: 'R', svgPath: 'M3 5h18v14H3z' },
  { id: 'circle',     label: '원',       shortcut: 'C', svgPath: 'M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0' },
  { id: 'select',     label: '선택',     shortcut: 'M', svgPath: 'M4 4h4M16 4h4M4 4v4M20 4v4M4 16v4M20 16v4M4 20h4M16 20h4' },
  { id: 'move',       label: '이동',     shortcut: 'V', iconSrc: iconPath('UI/Arrows Expand/Arrows Expand Flat White 64.png') },
];

export const EditorToolbar: React.FC = () => {
  const currentTool = useEditorStore(s => s.currentTool);
  const showGrid = useEditorStore(s => s.showGrid);
  const symmetryMode = useEditorStore(s => s.symmetryMode);
  const setTool = useEditorStore(s => s.setTool);
  const toggleGrid = useEditorStore(s => s.toggleGrid);
  const setSymmetryMode = useEditorStore(s => s.setSymmetryMode);

  const symmetryLabels: Record<SymmetryMode, string> = {
    none: '없음',
    horizontal: '좌우',
    vertical: '상하',
    both: '양방',
  };

  return (
    <div className="w-14 bg-pixel-surface border-r-2 border-pixel-muted/30 flex flex-col items-center gap-1 py-2 shrink-0">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => setTool(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
          className={`w-10 h-10 flex items-center justify-center border transition-colors
            ${currentTool === tool.id
              ? 'bg-pixel-accent border-pixel-accent text-white'
              : 'bg-pixel-primary border-pixel-muted/30 text-pixel-muted hover:bg-pixel-primary/80 hover:text-pixel-text'
            }`}
        >
          {tool.iconSrc ? (
            <img
              src={tool.iconSrc}
              alt={tool.label}
              className="w-6 h-6"
              style={{ imageRendering: 'auto' }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = 'none';
                if (el.parentElement) el.parentElement.textContent = tool.shortcut;
              }}
            />
          ) : tool.svgPath ? (
            <SvgIcon d={tool.svgPath} />
          ) : (
            <span className="font-pixel text-pixel-sm">{tool.shortcut}</span>
          )}
        </button>
      ))}

      <div className="w-8 border-t border-pixel-muted/30 my-1" />

      {/* 격자 토글 */}
      <button
        onClick={toggleGrid}
        title="격자 표시"
        className={`w-10 h-10 font-pixel text-[9px] flex items-center justify-center border transition-colors
          ${showGrid
            ? 'bg-green-700 border-green-600 text-white'
            : 'bg-pixel-primary border-pixel-muted/30 text-pixel-muted'
          }`}
      >
        격자
      </button>

      {/* 대칭 모드 선택 */}
      <div className="relative group">
        <button
          title={`대칭: ${symmetryLabels[symmetryMode]}`}
          className={`w-10 h-10 font-pixel text-[8px] flex items-center justify-center border transition-colors
            ${symmetryMode !== 'none'
              ? 'bg-green-700 border-green-600 text-white'
              : 'bg-pixel-primary border-pixel-muted/30 text-pixel-muted'
            }`}
          onClick={() => {
            const modes: SymmetryMode[] = ['none', 'horizontal', 'vertical', 'both'];
            const idx = modes.indexOf(symmetryMode);
            setSymmetryMode(modes[(idx + 1) % modes.length]);
          }}
        >
          {symmetryMode === 'none' ? '대칭' : symmetryLabels[symmetryMode]}
        </button>

        {/* 대칭 모드 드롭다운 */}
        <div className="absolute left-full top-0 ml-1 hidden group-hover:block z-50">
          <div className="bg-pixel-surface border-2 border-pixel-muted/30 p-1 min-w-[80px]">
            {(['none', 'horizontal', 'vertical', 'both'] as SymmetryMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSymmetryMode(mode)}
                className={`w-full text-left font-pixel text-[9px] px-2 py-1 transition-colors
                  ${symmetryMode === mode
                    ? 'bg-pixel-accent text-white'
                    : 'text-pixel-muted hover:bg-pixel-primary hover:text-pixel-text'
                  }`}
              >
                {symmetryLabels[mode]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
