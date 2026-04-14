/**
 * EditorCanvasView — Canvas 2D 래퍼 React 컴포넌트
 *
 * 핵심 역할:
 * 1. HTML Canvas 엘리먼트 생성 및 관리
 * 2. Pointer Events → 좌표 변환 → 도구 호출
 * 3. 스토어 변경 감지 → Canvas 재렌더
 * 4. 줌/팬 처리
 * 5. 키보드 단축키 처리
 */
import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { EditorCanvas } from '../../editor/core/EditorCanvas';
import { createToolRegistry, type BaseTool } from '../../editor/tools';
import { SelectTool } from '../../editor/tools/SelectTool';
import type { ToolPointerEvent, EditorTool } from '../../types/editor';

const ZOOM_LEVELS = [1, 2, 4, 8, 12, 16, 20, 24, 32];

export const EditorCanvasView: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorCanvasRef = useRef<EditorCanvas | null>(null);
  const toolsRef = useRef(createToolRegistry());
  const rafRef = useRef(0);
  const isDrawingRef = useRef(false);
  const strokeSnapshotSaved = useRef(false);

  // 스토어 상태
  const canvasSize = useEditorStore(s => s.canvasSize);
  const currentTool = useEditorStore(s => s.currentTool);
  const currentColor = useEditorStore(s => s.currentColor);
  const symmetryMode = useEditorStore(s => s.symmetryMode);
  const showGrid = useEditorStore(s => s.showGrid);
  const viewport = useEditorStore(s => s.viewport);
  const frames = useEditorStore(s => s.frames);
  const currentFrameIndex = useEditorStore(s => s.currentFrameIndex);
  const currentLayerIndex = useEditorStore(s => s.currentLayerIndex);
  const selection = useEditorStore(s => s.selection);
  const onionSkin = useEditorStore(s => s.onionSkin);
  const renderVersion = useEditorStore(s => s.renderVersion);

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

  // 현재 프레임의 레이어
  const currentLayers = frames[currentFrameIndex]?.layers ?? [];

  // 도구 컨텍스트
  const toolContext = useMemo(() => ({
    canvasSize,
    currentColor,
    symmetryMode,
    getPixels: getCurrentLayerPixels,
  }), [canvasSize, currentColor, symmetryMode, getCurrentLayerPixels]);

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

  // ─── 렌더 루프 ───

  useEffect(() => {
    const ec = editorCanvasRef.current;
    if (!ec) return;

    ec.setShowGrid(showGrid);
    ec.setViewport(viewport);
    ec.setSelection(selection);
    ec.setOnionSkinConfig(onionSkin);
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
  }, [showGrid, viewport, selection, onionSkin, renderVersion, currentFrameIndex, frames, currentLayers, currentTool]);

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

  // ─── 줌 (마우스 휠) ───

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const { zoom, panX, panY } = viewport;
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

      // 도구 단축키
      const toolMap: Record<string, EditorTool> = {
        p: 'pencil', e: 'eraser', g: 'fill', i: 'eyedropper',
        l: 'line', r: 'rectangle', c: 'circle', m: 'select',
      };
      const toolKey = toolMap[e.key.toLowerCase()];
      if (toolKey && !ctrl) { setTool(toolKey); return; }

      // 색상 스왑
      if (e.key.toLowerCase() === 'x' && !ctrl) { swapColors(); return; }

      // 프레임 이동
      if (e.key === '[') { setCurrentFrame(Math.max(0, currentFrameIndex - 1)); return; }
      if (e.key === ']') { setCurrentFrame(Math.min(frames.length - 1, currentFrameIndex + 1)); return; }

      // Escape → 선택 해제
      if (e.key === 'Escape') {
        const selectTool = toolsRef.current.select as SelectTool;
        selectTool.clearSelection();
        setSelection(null);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setTool, swapColors, setCurrentFrame, currentFrameIndex, frames.length, setSelection]);

  // 우클릭 기본 메뉴 방지
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

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
    </div>
  );
};
