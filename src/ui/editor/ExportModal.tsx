/**
 * ExportModal — 내보내기 모달
 * 스프라이트 시트 PNG 저장/다운로드
 */
import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { exportSpriteSheet, downloadBlob } from '../../editor/export/SpriteSheetExporter';

interface Props {
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({ onClose }) => {
  const frames = useEditorStore(s => s.frames);
  const canvasSize = useEditorStore(s => s.canvasSize);

  const [name, setName] = useState('my-character');
  const [isExporting, setIsExporting] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);

  // 미리보기 생성
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;

    (async () => {
      const result = await exportSpriteSheet(frames, canvasSize);
      const img = await createImageBitmap(result.blob);
      const scale = Math.min(400 / result.width, 200 / result.height, 8);

      canvas.width = result.width * scale;
      canvas.height = result.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#2a2a3e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    })();
  }, [frames, canvasSize]);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const result = await exportSpriteSheet(frames, canvasSize);
      downloadBlob(result.blob, `${name}.png`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-pixel-surface border-2 border-pixel-muted/30 p-4 w-96 max-w-[90vw]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-pixel text-pixel-base text-pixel-accent mb-3">내보내기</h3>

        {/* 미리보기 */}
        <div className="bg-[#2a2a3e] border border-pixel-muted/30 p-2 mb-3 flex justify-center">
          <canvas
            ref={previewRef}
            style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '160px' }}
          />
        </div>

        {/* 정보 */}
        <div className="font-pixel text-pixel-xs text-pixel-muted mb-3">
          <p>크기: {canvasSize}x{canvasSize}px · 프레임: {frames.length}개</p>
          <p>시트: {canvasSize * frames.length}x{canvasSize}px</p>
        </div>

        {/* 파일명 */}
        <div className="mb-3">
          <label className="font-pixel text-pixel-xs text-pixel-muted block mb-1">파일명</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full font-pixel text-pixel-sm bg-pixel-primary text-pixel-text border border-pixel-muted/30 px-2 py-1"
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 font-pixel text-pixel-sm text-white bg-pixel-accent hover:bg-pixel-accent/80 border-2 border-pixel-accent px-3 py-2 transition-colors disabled:opacity-50"
          >
            {isExporting ? '처리 중...' : '💾 다운로드'}
          </button>
          <button
            onClick={onClose}
            className="font-pixel text-pixel-sm text-pixel-muted bg-pixel-primary hover:bg-pixel-primary/80 border border-pixel-muted/30 px-3 py-2 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
