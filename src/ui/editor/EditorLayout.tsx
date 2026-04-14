/**
 * EditorLayout — 픽셀 에디터 메인 레이아웃
 *
 * 모든 에디터 서브컴포넌트를 조합:
 * - 상단 헤더바 (캔버스 크기, Undo/Redo, 내보내기)
 * - 좌측 EditorToolbar
 * - 중앙 EditorCanvasView
 * - 우측 패널 (PalettePanel + LayerPanel + PreviewPanel)
 * - 하단 TimelinePanel
 * - 모달: TemplateModal, ExportModal
 */
import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { EDITOR_CANVAS_SIZES } from '../../config/constants';
import type { CanvasSize } from '../../types/editor';

import { EditorToolbar } from './EditorToolbar';
import { EditorCanvasView } from './EditorCanvasView';
import { PalettePanel } from './PalettePanel';
import { LayerPanel } from './LayerPanel';
import { PreviewPanel } from './PreviewPanel';
import { TimelinePanel } from './TimelinePanel';
import { TemplateModal } from './TemplateModal';
import { ExportModal } from './ExportModal';

interface Props {
  onClose: () => void;
}

export const EditorLayout: React.FC<Props> = ({ onClose }) => {
  const [showTemplate, setShowTemplate] = useState(true);
  const [showExport, setShowExport] = useState(false);

  const canvasSize = useEditorStore(s => s.canvasSize);
  const setCanvasSize = useEditorStore(s => s.setCanvasSize);
  const canUndo = useEditorStore(s => s.canUndo);
  const canRedo = useEditorStore(s => s.canRedo);
  const undo = useEditorStore(s => s.undo);
  const redo = useEditorStore(s => s.redo);
  const resetEditor = useEditorStore(s => s.resetEditor);

  // 에디터 나갈 때 리셋
  useEffect(() => {
    return () => {
      resetEditor();
    };
  }, [resetEditor]);

  return (
    <div className="h-full flex flex-col bg-pixel-bg">
      {/* ─── 상단 헤더 바 ─── */}
      <div className="h-10 bg-pixel-surface border-b-2 border-pixel-muted/30 flex items-center px-3 gap-3 shrink-0">
        {/* 뒤로가기 */}
        <button
          onClick={onClose}
          className="font-pixel text-pixel-sm text-pixel-muted hover:text-pixel-text transition-colors"
          title="에디터 닫기"
        >
          ← 돌아가기
        </button>

        <div className="w-px h-6 bg-pixel-muted/30" />

        {/* 캔버스 크기 선택 */}
        <div className="flex items-center gap-1">
          <span className="font-pixel text-[9px] text-pixel-muted">크기</span>
          <select
            value={canvasSize}
            onChange={(e) => {
              const size = Number(e.target.value) as CanvasSize;
              if (confirm('캔버스 크기를 변경하면 현재 작업이 초기화됩니다. 계속하시겠습니까?')) {
                setCanvasSize(size);
              }
            }}
            className="font-pixel text-[9px] bg-pixel-primary text-pixel-text border border-pixel-muted/30 px-1 py-0.5"
          >
            {EDITOR_CANVAS_SIZES.map(s => (
              <option key={s} value={s}>{s}x{s}</option>
            ))}
          </select>
        </div>

        <div className="w-px h-6 bg-pixel-muted/30" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="w-7 h-7 font-pixel text-pixel-sm flex items-center justify-center bg-pixel-primary border border-pixel-muted/30 hover:bg-pixel-primary/80 transition-colors disabled:opacity-30"
            title="실행취소 (Ctrl+Z)"
          >
            ↩
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="w-7 h-7 font-pixel text-pixel-sm flex items-center justify-center bg-pixel-primary border border-pixel-muted/30 hover:bg-pixel-primary/80 transition-colors disabled:opacity-30"
            title="다시실행 (Ctrl+Shift+Z)"
          >
            ↪
          </button>
        </div>

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 타이틀 */}
        <span className="font-pixel text-pixel-sm text-pixel-gold">✏️ 픽셀 에디터</span>

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 새로 만들기 */}
        <button
          onClick={() => setShowTemplate(true)}
          className="font-pixel text-[9px] text-pixel-muted hover:text-pixel-text bg-pixel-primary border border-pixel-muted/30 px-2 py-1 transition-colors"
          title="템플릿에서 새로 시작"
        >
          📦 새로 만들기
        </button>

        {/* 내보내기 */}
        <button
          onClick={() => setShowExport(true)}
          className="font-pixel text-[9px] text-white bg-pixel-accent hover:bg-pixel-accent/80 border-2 border-pixel-accent px-2 py-1 transition-colors"
        >
          💾 내보내기
        </button>
      </div>

      {/* ─── 메인 영역 (툴바 + 캔버스 + 사이드패널) ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* 좌측 도구바 */}
        <EditorToolbar />

        {/* 중앙 캔버스 */}
        <EditorCanvasView />

        {/* 우측 사이드 패널 */}
        <div className="w-48 bg-pixel-surface border-l-2 border-pixel-muted/30 overflow-y-auto p-2 shrink-0">
          <PreviewPanel />
          <PalettePanel />
          <LayerPanel />
        </div>
      </div>

      {/* ─── 하단 타임라인 ─── */}
      <TimelinePanel />

      {/* ─── 모달 ─── */}
      {showTemplate && (
        <TemplateModal onClose={() => setShowTemplate(false)} />
      )}
      {showExport && (
        <ExportModal onClose={() => setShowExport(false)} />
      )}
    </div>
  );
};
