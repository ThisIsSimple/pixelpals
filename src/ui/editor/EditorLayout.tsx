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
 *
 * + 브라우저 뒤로가기/트랙패드 뒤로가기 방지
 * + 대칭축 위치 조절 슬라이더
 */
import React, { useState, useEffect, useCallback } from 'react';
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
  const isDirty = useEditorStore(s => s.isDirty);
  const symmetryMode = useEditorStore(s => s.symmetryMode);
  const symmetryConfig = useEditorStore(s => s.symmetryConfig);
  const setSymmetryAxisPosition = useEditorStore(s => s.setSymmetryAxisPosition);

  // ─── 브라우저 뒤로가기 방지 ───

  // beforeunload: 탭 닫기/새로고침 시 경고
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // 최신 브라우저는 커스텀 메시지를 무시하지만 필수 설정
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // popstate: 브라우저 뒤로가기/트랙패드 스와이프 차단
  useEffect(() => {
    // 히스토리에 더미 엔트리를 넣어서 뒤로가기를 인터셉트
    window.history.pushState({ pixelEditor: true }, '');

    const handlePopState = (e: PopStateEvent) => {
      if (isDirty) {
        // 다시 더미를 넣어서 뒤로가기를 원복
        window.history.pushState({ pixelEditor: true }, '');
        const leave = window.confirm('저장되지 않은 작업이 있습니다. 정말 나가시겠습니까?');
        if (leave) {
          // 진짜 나가기
          resetEditor();
          onClose();
        }
      } else {
        onClose();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty, resetEditor, onClose]);

  // 트랙패드 좌/우 스와이프 뒤로가기 이벤트 차단
  useEffect(() => {
    const preventNavigation = (e: MouseEvent) => {
      // 브라우저 뒤로가기/앞으로가기 버튼 (마우스 사이드 버튼)
      if (e.button === 3 || e.button === 4) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('mouseup', preventNavigation, true);
    return () => window.removeEventListener('mouseup', preventNavigation, true);
  }, []);

  // 안전한 닫기
  const handleClose = useCallback(() => {
    if (isDirty) {
      const leave = window.confirm('저장되지 않은 작업이 있습니다. 정말 나가시겠습니까?');
      if (!leave) return;
    }
    resetEditor();
    onClose();
  }, [isDirty, resetEditor, onClose]);

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
          onClick={handleClose}
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
              if (size === canvasSize) return;
              if (isDirty) {
                const ok = window.confirm('캔버스 크기를 변경하면 현재 작업이 초기화됩니다. 계속하시겠습니까?');
                if (!ok) return;
              }
              setCanvasSize(size);
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
            className="w-7 h-7 flex items-center justify-center bg-pixel-primary border border-pixel-muted/30 hover:bg-pixel-primary/80 transition-colors disabled:opacity-30"
            title="실행취소 (Ctrl+Z)"
          >
            <img
              src="/assets/vector-icon-pack/UI/Undo/Undo Flat White 64.png"
              alt="실행취소"
              className="w-4 h-4"
              style={{ imageRendering: 'auto' }}
            />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="w-7 h-7 flex items-center justify-center bg-pixel-primary border border-pixel-muted/30 hover:bg-pixel-primary/80 transition-colors disabled:opacity-30"
            title="다시실행 (Ctrl+Shift+Z)"
          >
            <img
              src="/assets/vector-icon-pack/UI/Redo/Redo Flat White 64.png"
              alt="다시실행"
              className="w-4 h-4"
              style={{ imageRendering: 'auto' }}
            />
          </button>
        </div>

        {/* 대칭축 위치 슬라이더 (대칭 모드가 켜져 있을 때만) */}
        {symmetryMode !== 'none' && (
          <>
            <div className="w-px h-6 bg-pixel-muted/30" />
            <div className="flex items-center gap-1">
              <span className="font-pixel text-[8px] text-pixel-muted shrink-0">대칭축</span>
              <input
                type="range"
                min={10}
                max={90}
                value={Math.round(symmetryConfig.axisPosition * 100)}
                onChange={(e) => setSymmetryAxisPosition(Number(e.target.value) / 100)}
                className="w-16 h-1 accent-purple-500"
                title={`대칭축 위치: ${Math.round(symmetryConfig.axisPosition * 100)}%`}
              />
              <span className="font-pixel text-[8px] text-pixel-muted w-6">
                {Math.round(symmetryConfig.axisPosition * 100)}%
              </span>
            </div>
          </>
        )}

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 타이틀 */}
        <span className="font-pixel text-pixel-sm text-pixel-gold">
          <img
            src="/assets/vector-icon-pack/Tools/Pencil/Pencil 64.png"
            alt=""
            className="w-4 h-4 inline-block mr-1"
            style={{ imageRendering: 'auto' }}
          />
          픽셀 에디터
        </span>

        {/* 스페이서 */}
        <div className="flex-1" />

        {/* 새로 만들기 */}
        <button
          onClick={() => setShowTemplate(true)}
          className="font-pixel text-[9px] text-pixel-muted hover:text-pixel-text bg-pixel-primary border border-pixel-muted/30 px-2 py-1 transition-colors flex items-center gap-1"
          title="템플릿에서 새로 시작"
        >
          <img
            src="/assets/vector-icon-pack/UI/Plus/Plus Flat White 64.png"
            alt=""
            className="w-3 h-3"
            style={{ imageRendering: 'auto' }}
          />
          새로 만들기
        </button>

        {/* 내보내기 */}
        <button
          onClick={() => setShowExport(true)}
          className="font-pixel text-[9px] text-white bg-pixel-accent hover:bg-pixel-accent/80 border-2 border-pixel-accent px-2 py-1 transition-colors flex items-center gap-1"
        >
          <img
            src="/assets/vector-icon-pack/UI/Save/Save Flat White 64.png"
            alt=""
            className="w-3 h-3"
            style={{ imageRendering: 'auto' }}
          />
          내보내기
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
