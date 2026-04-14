/**
 * EditorToolbar — 좌측 도구 바
 * 8개 도구 + 그리드/대칭 토글
 */
import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import type { EditorTool } from '../../types/editor';

const TOOLS: { id: EditorTool; label: string; icon: string; shortcut: string }[] = [
  { id: 'pencil',     label: '연필',     icon: '✏️', shortcut: 'P' },
  { id: 'eraser',     label: '지우개',   icon: '🧹', shortcut: 'E' },
  { id: 'fill',       label: '채우기',   icon: '🪣', shortcut: 'G' },
  { id: 'eyedropper', label: '스포이드', icon: '💉', shortcut: 'I' },
  { id: 'line',       label: '선',       icon: '📏', shortcut: 'L' },
  { id: 'rectangle',  label: '사각형',   icon: '⬜', shortcut: 'R' },
  { id: 'circle',     label: '원',       icon: '⭕', shortcut: 'C' },
  { id: 'select',     label: '선택',     icon: '⊡',  shortcut: 'M' },
];

export const EditorToolbar: React.FC = () => {
  const currentTool = useEditorStore(s => s.currentTool);
  const showGrid = useEditorStore(s => s.showGrid);
  const symmetryMode = useEditorStore(s => s.symmetryMode);
  const setTool = useEditorStore(s => s.setTool);
  const toggleGrid = useEditorStore(s => s.toggleGrid);
  const toggleSymmetry = useEditorStore(s => s.toggleSymmetry);

  return (
    <div className="w-14 bg-pixel-surface border-r-2 border-pixel-muted/30 flex flex-col items-center gap-1 py-2 shrink-0">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => setTool(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
          className={`w-10 h-10 text-lg flex items-center justify-center border transition-colors
            ${currentTool === tool.id
              ? 'bg-pixel-accent border-pixel-accent text-white'
              : 'bg-pixel-primary border-pixel-muted/30 hover:bg-pixel-primary/80'
            }`}
        >
          {tool.icon}
        </button>
      ))}

      <div className="w-8 border-t border-pixel-muted/30 my-1" />

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

      <button
        onClick={toggleSymmetry}
        title="좌우 대칭"
        className={`w-10 h-10 font-pixel text-[9px] flex items-center justify-center border transition-colors
          ${symmetryMode
            ? 'bg-green-700 border-green-600 text-white'
            : 'bg-pixel-primary border-pixel-muted/30 text-pixel-muted'
          }`}
      >
        대칭
      </button>
    </div>
  );
};
