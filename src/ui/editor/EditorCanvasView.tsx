/**
 * EditorCanvasView — Canvas 2D 래퍼 React 컴포넌트
 *
 * 핵심 역할:
 * 1. HTML Canvas 엘리먼트 생성 및 관리
 * 2. Pointer Events → 좌표 변환 → 도구 호출
 * 3. 스토어 변경 감지 → Canvas 재렌더
 * 4. 줌/팬 처리 (브라우저 줌 차단)
 * 5. 키보드 단축키 처리
 * 6. 커스텀 우클릭 컨텍스트 메뉴
 */
import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { EditorCanvas } from '../../editor/core/EditorCanvas';
import { createToolRegistry, type BaseTool } from '../../editor/tools';
import { SelectTool } from '../../editor/tools/SelectTool';
import { MoveTool } from '../../editor/tools/MoveTool';
import type { ToolPointerEvent, EditorTool } from '../../types/editor';

const ZOOM_LEVELS = [1, 2, 4, 8, 12, 16, 20, 24, 32];

/** 커스텀 컨텍스트 메뉴 아이템 */
interface ContextMenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

export const EditorCanvasView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorCanvasRef = useRef<EditorCanvas | null>(null);
  const toolsRef = useRef(createToolRegistry());
  const rafRef = useRef(0);
  const isDrawingRef = useRef(false);
  const strokeSnapshotSaved = useRef(false);

  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // 스토어 상태
  const canvasSize = useEditorStore(s => s.canvasSize);
  const currentTool = useEditorStore(s => s.currentTool);
  const currentColor = useEditorStore(s => s.currentColor);
  const symmetryMode = useEditorStore(s => s.symmetryMode);
  const symmetryConfig = useEditorStore(s => s.symmetryConfig);
  const showGrid = useEditorStore(s => s.showGrid);
  const viewport = useEditorStore(s => s.viewport);
  const frames = useEditorStore(s => s.frames);
  const currentFrameIndex = useEditorStore(s => s.currentFrameIndex);
  const currentLayerIndex = useEditorStore(s => s.currentLayerIndex);
  const selection = useEditorStore(s => s.selection);
  const onionSkin = useEditorStore(s => s.onionSkin);
  const renderVersion = useEditorStore(s => s.renderVersion);
  const canUndo = useEditorStore(s => s.canUndo);
  const canRedo = useEditorStore(s => s.canRedo);

  const applyPixels = useEditorStore(s => s.applyPixels);
  const setColor = useEditorStore(s => s.setColor);
  const setTool = useEditorStore(s => s.setTool);
  const setViewport = useEditorStore(s => s.setViewport);
  const setSelection = useEditorStore(s => s.setSelection);
  const saveSnapshot = useEditorStore(s => s.saveSnapshot);
  const undo = useEditorStore(s => s.undo);
  const redo = useEditorStore(s => s.redo);
  const swapColors = useEditorStore(s => s.swapColors);
  const setCurrentFrame = useEditorStore(s => s.setCurrentFrame);
  const getCurrentLayerPixels = useEditorStore(s => s.getCurrentLayerPixels);
  const toggleGrid = useEditorStore(s => s.toggleGrid);
  const toggleSymmetry = useEditorStore(s => s.toggleSymmetry);

  // 현재 프레임의 레이어
  const currentLayers = frames[currentFrameIndex]?.layers ?? [];

  // 도구 컨텍스트
  const toolContext = useMemo(() => ({
    canvasSize,
    currentColor,
    symmetryMode,
    symmetryAxisPosition: symmetryConfig.axisPosition,
    selection,
    getPixels: getCurrentLayerPixels,
  }), [canvasSize, currentColor, symmetryMode, symmetryConfig.axisPosition, selection, getCurrentLayerPixels]);

  // 현재 활성 도구 인스턴스
  const getActiveTool = useCallback((): BaseTool => {
    return toolsRef.current[currentTool];
  }, [currentTool]);

  // ─── Canvas 초기화 ───

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement!.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    const ec = new EditorCanvas(canvas, canvasSize);
    ec.fitToView();
    editorCanvasRef.current = ec;

    // 스토어에 viewport 동기화
    setViewport(ec.viewport);

    return () => {
      ec.destroy();
      editorCanvasRef.current = null;
    };
  }, [canvasSize]);

  // ─── 리사이즈 처리 ───

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const ec = editorCanvasRef.current;
      if (!canvas || !ec) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ─── 브라우저 줌 차단 (Ctrl+마우스휠, Ctrl+/-/0) ───

  useEffect(() => {
    const preventBrowserZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    const preventBrowserZoomKeyboard = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault();
      }
    };
    // passive: false 필수 — preventDefault를 위해
    document.addEventListener('wheel', preventBrowserZoom, { passive: false });
    document.addEventListener('keydown', preventBrowserZoomKeyboard);
    return () => {
      document.removeEventListener('wheel', preventBrowserZoom);
      document.removeEventListener('keydown', preventBrowserZoomKeyboard);
    };
  }, []);

  // ─── 렌더 루프 ───

  useEffect(() => {
    const ec = editorCanvasRef.current;
    if (!ec) return;

    ec.setShowGrid(showGrid);
    ec.setViewport(viewport);
    ec.setSelection(selection);
    ec.setOnionSkinConfig(onionSkin);
    ec.setSymmetry(symmetryMode, symmetryConfig.axisPosition);
    ec.invalidate();

    // 어니언 스킨 프레임 설정
    if (onionSkin.enabled) {
      const prevFrames: any[][] = [];
      const nextFrames: any[][] = [];
      for (let i = 1; i <= onionSkin.prevFrames; i++) {
        const idx = currentFrameIndex - i;
        if (idx >= 0) prevFrames.push(frames[idx].layers);
      }
      for (let i = 1; i <= onionSkin.nextFrames; i++) {
        const idx = currentFrameIndex + i;
        if (idx < frames.length) nextFrames.push(frames[idx].layers);
      }
      ec.setOnionSkinFrames(prevFrames, nextFrames);
    }

    // 도구 프리뷰
    const preview = getActiveTool().getPreview();
    if (preview) ec.setPreview(preview);
    else ec.clearPreview();

    ec.render(currentLayers);
  }, [showGrid, viewport, selection, onionSkin, symmetryMode, symmetryConfig, renderVersion, currentFrameIndex, frames, currentLayers, currentTool]);

  // ─── Pointer Events (도구 처리) ───

  const makeToolEvent = useCallback((e: React.PointerEvent): ToolPointerEvent | null => {
    const ec = editorCanvasRef.current;
    if (!ec) return null;
    const { x, y } = ec.screenToPixel(e.clientX, e.clientY);
    return {
      pixelX: x, pixelY: y,
      screenX: e.clientX, screenY: e.clientY,
      button: e.button,
      shiftKey: e.shiftKey, altKey: e.altKey, ctrlKey: e.ctrlKey || e.metaKey,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    // 컨텍스트 메뉴 닫기
    setContextMenu(null);

    const te = makeToolEvent(e);
    if (!te) return;

    // Alt + 클릭 → 임시 스포이드
    const tool = te.altKey ? toolsRef.current.eyedropper : getActiveTool();

    // 스트로크 시작 전 스냅샷 저장
    if (!strokeSnapshotSaved.current) {
      saveSnapshot(tool.name);
      strokeSnapshotSaved.current = true;
    }

    isDrawingRef.current = true;
    const result = tool.onPointerDown(te, toolContext);

    if (result?.pixels) applyPixels(result.pixels);
    if (result?.newColor) setColor(result.newColor);
    if (result?.selection !== undefined) setSelection(result.selection);
    if (tool instanceof SelectTool) {
      setSelection(tool.getSelection());
    }

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [makeToolEvent, getActiveTool, toolContext, applyPixels, setColor, saveSnapshot, setSelection]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const ec = editorCanvasRef.current;
    if (!ec) return;

    const te = makeToolEvent(e);
    if (!te) return;

    // 커서 위치 업데이트
    ec.setCursorPixel(te.pixelX, te.pixelY);

    if (!isDrawingRef.current) {
      // 프리뷰만 업데이트
      ec.render(currentLayers);
      return;
    }

    const tool = te.altKey ? toolsRef.current.eyedropper : getActiveTool();
    const result = tool.onPointerMove(te, toolContext);

    if (result?.pixels) applyPixels(result.pixels);
    if (result?.newColor) setColor(result.newColor);
    if (result?.selection !== undefined) setSelection(result.selection);

    // 도구 프리뷰 업데이트
    const preview = tool.getPreview();
    if (preview) ec.setPreview(preview);
    else ec.clearPreview();

    if (tool instanceof SelectTool) {
      setSelection(tool.getSelection());
    }

    ec.render(currentLayers);
  }, [makeToolEvent, getActiveTool, toolContext, currentLayers, applyPixels, setColor, setSelection]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const te = makeToolEvent(e);
    if (!te) return;

    const tool = te.altKey ? toolsRef.current.eyedropper : getActiveTool();
    const result = tool.onPointerUp(te, toolContext);

    if (result?.pixels) applyPixels(result.pixels);
    if (result?.newColor) setColor(result.newColor);
    if (result?.selection !== undefined) setSelection(result.selection);

    // 프리뷰 클리어
    editorCanvasRef.current?.clearPreview();
    strokeSnapshotSaved.current = false;

    if (tool instanceof SelectTool) {
      setSelection(tool.getSelection());
    }
  }, [makeToolEvent, getActiveTool, toolContext, applyPixels, setColor, setSelection]);

  const handlePointerLeave = useCallback(() => {
    editorCanvasRef.current?.clearCursor();
    const ec = editorCanvasRef.current;
    if (ec) ec.render(currentLayers);
  }, [currentLayers]);

  // ─── 줌 (마우스 휠) — 에디터 캔버스만 줌 ───

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { zoom } = viewport;
    const currentIdx = ZOOM_LEVELS.indexOf(zoom);
    const nextIdx = e.deltaY < 0
      ? Math.min(currentIdx + 1, ZOOM_LEVELS.length - 1)
      : Math.max(currentIdx - 1, 0);
    const newZoom = ZOOM_LEVELS[nextIdx] ?? zoom;

    if (newZoom !== zoom) {
      setViewport({ zoom: newZoom });
    }
  }, [viewport, setViewport]);

  // ─── 키보드 단축키 ───

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에 포커스 있으면 무시
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Undo/Redo
      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (ctrl && e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); return; }
      if (ctrl && e.key === 'y') { e.preventDefault(); redo(); return; }

      // Ctrl/Cmd + D → 선택 해제
      if (ctrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        const selectTool = toolsRef.current.select as SelectTool;
        selectTool.clearSelection();
        (toolsRef.current.move as MoveTool).clearFloating();
        setSelection(null);
        return;
      }

      // 도구 단축키
      const toolMap: Record<string, EditorTool> = {
        p: 'pencil', e: 'eraser', g: 'fill', i: 'eyedropper',
        l: 'line', r: 'rectangle', c: 'circle', m: 'select', v: 'move',
      };
      const toolKey = toolMap[e.key.toLowerCase()];
      if (toolKey && !ctrl) { setTool(toolKey); return; }

      // 색상 스왑
      if (e.key.toLowerCase() === 'x' && !ctrl) { swapColors(); return; }

      // 프레임 이동
      if (e.key === '[') { setCurrentFrame(Math.max(0, currentFrameIndex - 1)); return; }
      if (e.key === ']') { setCurrentFrame(Math.min(frames.length - 1, currentFrameIndex + 1)); return; }

      // Escape → 선택 해제 + 컨텍스트 메뉴 닫기
      if (e.key === 'Escape') {
        setContextMenu(null);
        const selectTool = toolsRef.current.select as SelectTool;
        selectTool.clearSelection();
        (toolsRef.current.move as MoveTool).clearFloating();
        setSelection(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setTool, swapColors, setCurrentFrame, currentFrameIndex, frames.length, setSelection]);

  // ─── 커스텀 우클릭 컨텍스트 메뉴 ───

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const contextMenuItems: ContextMenuItem[] = useMemo(() => [
    { label: '실행취소', shortcut: 'Ctrl+Z', action: undo, disabled: !canUndo },
    { label: '다시실행', shortcut: 'Ctrl+Shift+Z', action: redo, disabled: !canRedo },
    { label: '', shortcut: '', action: () => {}, separator: true },
    { label: '연필 도구', shortcut: 'P', action: () => setTool('pencil') },
    { label: '지우개', shortcut: 'E', action: () => setTool('eraser') },
    { label: '채우기', shortcut: 'G', action: () => setTool('fill') },
    { label: '스포이드', shortcut: 'I / Alt+클릭', action: () => setTool('eyedropper') },
    { label: '선택', shortcut: 'M', action: () => setTool('select') },
    { label: '이동', shortcut: 'V', action: () => setTool('move') },
    { label: '', shortcut: '', action: () => {}, separator: true },
    { label: `격자 ${showGrid ? '끄기' : '켜기'}`, shortcut: '', action: toggleGrid },
    { label: `대칭 (${symmetryMode === 'none' ? '없음' : symmetryMode === 'horizontal' ? '좌우' : symmetryMode === 'vertical' ? '상하' : '양방향'})`, shortcut: '', action: toggleSymmetry },
    { label: '', shortcut: '', action: () => {}, separator: true },
    { label: '색상 스왑', shortcut: 'X', action: swapColors },
  ], [undo, redo, canUndo, canRedo, setTool, showGrid, toggleGrid, symmetryMode, toggleSymmetry, swapColors]);

  // 컨텍스트 메뉴 외부 클릭으로 닫기
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', close);
    };
  }, [contextMenu]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#0a0a1a] overflow-hidden relative"
      onContextMenu={handleContextMenu}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ imageRendering: 'pixelated' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      />

      {/* 줌 레벨 표시 */}
      <div className="absolute bottom-2 right-2 font-pixel text-[8px] text-pixel-muted/50 pointer-events-none">
        {viewport.zoom}x
      </div>

      {/* 커스텀 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          className="fixed z-[100] bg-pixel-surface border-2 border-pixel-muted/50 py-1 min-w-[180px] shadow-lg"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenuItems.map((item, i) =>
            item.separator ? (
              <div key={i} className="border-t border-pixel-muted/30 my-1" />
            ) : (
              <button
                key={i}
                onClick={() => { item.action(); setContextMenu(null); }}
                disabled={item.disabled}
                className="w-full flex items-center justify-between px-3 py-1 font-pixel text-[10px] text-pixel-text hover:bg-pixel-accent/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span className="text-pixel-muted text-[8px] ml-4">{item.shortcut}</span>
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
