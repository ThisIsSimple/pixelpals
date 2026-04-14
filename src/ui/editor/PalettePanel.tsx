/**
 * PalettePanel — 팔레트 + 전경/배경 색상
 */
import React from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import { PALETTE_PRESETS } from '../../config/palette';

export const PalettePanel: React.FC = () => {
  const palette = useEditorStore(s => s.palette);
  const currentColor = useEditorStore(s => s.currentColor);
  const secondaryColor = useEditorStore(s => s.secondaryColor);
  const palettePresetIndex = useEditorStore(s => s.palettePresetIndex);
  const setColor = useEditorStore(s => s.setColor);
  const setSecondaryColor = useEditorStore(s => s.setSecondaryColor);
  const swapColors = useEditorStore(s => s.swapColors);
  const setPalette = useEditorStore(s => s.setPalette);

  return (
    <div className="mb-3">
      {/* 전경/배경 색상 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-10 h-10">
          {/* 배경색 (뒤) */}
          <div
            className="absolute bottom-0 right-0 w-7 h-7 border border-pixel-muted/50"
            style={{ backgroundColor: secondaryColor }}
          />
          {/* 전경색 (앞) */}
          <div
            className="absolute top-0 left-0 w-7 h-7 border-2 border-white z-10"
            style={{ backgroundColor: currentColor }}
          />
        </div>
        <button
          onClick={swapColors}
          title="전경/배경 스왑 (X)"
          className="font-pixel text-[9px] text-pixel-muted hover:text-pixel-text transition-colors"
        >
          ⇄
        </button>
        <span className="font-pixel text-[9px] text-pixel-muted">{currentColor}</span>
      </div>

      {/* 팔레트 프리셋 선택 */}
      <select
        value={palettePresetIndex}
        onChange={(e) => {
          const idx = Number(e.target.value);
          const preset = PALETTE_PRESETS[idx];
          if (preset) setPalette(preset.colors, idx);
        }}
        className="w-full font-pixel text-[9px] bg-pixel-primary text-pixel-text border border-pixel-muted/30 p-1 mb-2"
      >
        {PALETTE_PRESETS.map((p, i) => (
          <option key={i} value={i}>{p.name}</option>
        ))}
      </select>

      {/* 팔레트 그리드 */}
      <div className="grid grid-cols-4 gap-0.5">
        {palette.map((color, i) => (
          <button
            key={i}
            onClick={() => setColor(color)}
            onContextMenu={(e) => { e.preventDefault(); setSecondaryColor(color); }}
            title={`좌클릭: 전경색 / 우클릭: 배경색\n${color}`}
            className="aspect-square border transition-all"
            style={{
              backgroundColor: color,
              borderColor: currentColor === color ? '#fff' : secondaryColor === color ? '#888' : '#3a3a4a',
              borderWidth: currentColor === color ? '2px' : '1px',
            }}
          />
        ))}
      </div>
    </div>
  );
};
