/**
 * TemplateModal — 초보자 템플릿 선택 모달
 * 에디터 첫 진입 시 표시, 템플릿 또는 빈 캔버스로 시작
 */
import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import type { AnimationFrame, CanvasSize, LayerData } from '../../types/editor';
import { EDITOR_LAYER_NAMES } from '../../config/constants';
import { LayerCompositor } from '../../editor/core/LayerCompositor';

interface TemplateData {
  name: string;
  icon: string;
  /** 몸체 레이어 픽셀 데이터 (compact format: [y][x] = color hex or '') */
  body: string[][];
}

// 16x16 기본 템플릿 (간소화 — 핵심 실루엣만)
const TEMPLATES: TemplateData[] = [
  {
    name: '고양이',
    icon: '🐱',
    body: makeTemplate16([
      '................',
      '..xx......xx....',
      '.x..x....x..x...',
      '.x..x....x..x...',
      '..xxxx..xxxx....',
      '..x..xxxx..x....',
      '..x...xx...x....',
      '..x..x..x..x....',
      '...xx....xx.....',
      '...xxxxxxxx.....',
      '..x........x....',
      '..x........x....',
      '..x........x....',
      '...x......x.....',
      '....xxxxxx......',
      '................',
    ], '#FFA300'),
  },
  {
    name: '강아지',
    icon: '🐶',
    body: makeTemplate16([
      '................',
      '.xx..........xx.',
      'x..x........x..x',
      'x..x........x..x',
      '.xxxxxxxxxxxx...',
      '..x..........x..',
      '..x...xx..x..x..',
      '..x..x..x....x..',
      '..x...xx.....x..',
      '..x..........x..',
      '...xxxxxxxxxx...',
      '...x........x...',
      '...x........x...',
      '....x......x....',
      '.....xxxxxx.....',
      '................',
    ], '#AB5236'),
  },
  {
    name: '로봇',
    icon: '🤖',
    body: makeTemplate16([
      '....xxxxxxxx....',
      '...x........x...',
      '..x..xx..xx..x..',
      '..x..xx..xx..x..',
      '..x..........x..',
      '..x...xxxx...x..',
      '...x........x...',
      '....xxxxxxxx....',
      '....x......x....',
      '..xxxxxxxxxxxx..',
      '..x....xx....x..',
      '..x....xx....x..',
      '..x....xx....x..',
      '..xxxxxxxxxxxx..',
      '....xx....xx....',
      '....xx....xx....',
    ], '#C2C3C7'),
  },
  {
    name: '유령',
    icon: '👻',
    body: makeTemplate16([
      '......xxxx......',
      '....xxxxxxxx....',
      '...xxxxxxxxxx...',
      '..x..xxxx..xxx..',
      '..x..xxxx..xxx..',
      '..xxxxxxxxxxxx..',
      '..xxxxxxxxxxxx..',
      '..xxxxxxxxxxxx..',
      '..xxxxxxxxxxxx..',
      '..xxxxxxxxxxxx..',
      '..xxxxxxxxxxxx..',
      '..xxxxxxxxxxxx..',
      '..xx..xxxx..xx..',
      '..xx..xxxx..xx..',
      '...x..x..x..x..',
      '................',
    ], '#FFF1E8'),
  },
  {
    name: '여우',
    icon: '🦊',
    body: makeTemplate16([
      '.xx..........xx.',
      'x.xx........xx.x',
      'x..xx......xx..x',
      '.x..xxxxxxxx..x.',
      '..x..........x..',
      '..x...xx..x..x..',
      '..x..........x..',
      '..x....xx....x..',
      '...x........x...',
      '....xxxxxxxx....',
      '....x......x....',
      '....x......x....',
      '.....x....x.....',
      '......xxxx......',
      '................',
      '................',
    ], '#FFA300'),
  },
  {
    name: '하트',
    icon: '❤️',
    body: makeTemplate16([
      '................',
      '................',
      '..xxx....xxx....',
      '.xxxxx..xxxxx...',
      '.xxxxxxxxxxxxx..',
      '.xxxxxxxxxxxxx..',
      '.xxxxxxxxxxxxx..',
      '..xxxxxxxxxxx...',
      '...xxxxxxxxx....',
      '....xxxxxxx.....',
      '.....xxxxx......',
      '......xxx.......',
      '.......x........',
      '................',
      '................',
      '................',
    ], '#FF004D'),
  },
];

/** 문자열 패턴 → 16x16 픽셀 배열 변환 */
function makeTemplate16(rows: string[], color: string): string[][] {
  return rows.map(row => {
    const cells: string[] = [];
    for (let i = 0; i < 16; i++) {
      cells.push(row[i] === 'x' ? color : '');
    }
    return cells;
  });
}

/** 템플릿 → AnimationFrame 변환 */
function templateToFrame(template: TemplateData | null, size: CanvasSize): AnimationFrame {
  const layers: LayerData[] = EDITOR_LAYER_NAMES.map((name, i) => ({
    id: i,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    pixels: Array.from({ length: size }, () => Array(size).fill(null)),
  }));

  // 몸체 레이어에 템플릿 데이터 적용
  if (template) {
    const bodyLayer = layers[0]; // 몸체
    for (let y = 0; y < Math.min(template.body.length, size); y++) {
      for (let x = 0; x < Math.min(template.body[y].length, size); x++) {
        if (template.body[y][x]) {
          bodyLayer.pixels[y][x] = template.body[y][x];
        }
      }
    }
  }

  return { frameIndex: 0, layers, duration: 100 };
}

interface Props {
  onClose: () => void;
}

export const TemplateModal: React.FC<Props> = ({ onClose }) => {
  const canvasSize = useEditorStore(s => s.canvasSize);
  const loadProject = useEditorStore(s => s.loadProject);
  const palette = useEditorStore(s => s.palette);

  const handleSelect = (template: TemplateData | null) => {
    const frame = templateToFrame(template, canvasSize);
    loadProject([frame], palette);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-pixel-surface border-2 border-pixel-muted/30 p-5 w-[440px] max-w-[90vw]"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-pixel text-pixel-lg text-pixel-gold mb-1 text-center">📦 템플릿 선택</h3>
        <p className="font-pixel text-pixel-xs text-pixel-muted mb-4 text-center">
          템플릿에서 시작하거나, 빈 캔버스를 선택하세요
        </p>

        {/* 템플릿 그리드 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {TEMPLATES.map((template, i) => (
            <TemplateCard
              key={i}
              template={template}
              canvasSize={canvasSize}
              onClick={() => handleSelect(template)}
            />
          ))}
        </div>

        {/* 빈 캔버스 */}
        <button
          onClick={() => handleSelect(null)}
          className="w-full font-pixel text-pixel-sm text-pixel-muted hover:text-pixel-text bg-pixel-primary hover:bg-pixel-primary/80 border border-pixel-muted/30 py-2 transition-colors"
        >
          빈 캔버스로 시작
        </button>
      </div>
    </div>
  );
};

/** 개별 템플릿 카드 */
const TemplateCard: React.FC<{
  template: TemplateData;
  canvasSize: number;
  onClick: () => void;
}> = ({ template, canvasSize, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const frame = templateToFrame(template, canvasSize as CanvasSize);
    const compositor = new LayerCompositor(canvasSize);
    const imgData = compositor.composite(frame.layers);

    const scale = 4;
    canvas.width = canvasSize * scale;
    canvas.height = canvasSize * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tmp = new OffscreenCanvas(canvasSize, canvasSize);
    tmp.getContext('2d')!.putImageData(imgData, 0, 0);
    ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
  }, [template, canvasSize]);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 bg-pixel-primary border border-pixel-muted/30 hover:border-pixel-accent hover:bg-pixel-primary/80 transition-colors"
    >
      <canvas
        ref={canvasRef}
        style={{ imageRendering: 'pixelated', width: '64px', height: '64px' }}
      />
      <span className="font-pixel text-[9px] text-pixel-muted">
        {template.icon} {template.name}
      </span>
    </button>
  );
};
