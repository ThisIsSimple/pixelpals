import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import type { CharacterInstance } from '../../types/character';

const STAT_LABELS: Record<string, string> = {
  str: 'STR',
  dex: 'DEX',
  int: 'INT',
  cha: 'CHA',
  luk: 'LUK',
};

/**
 * CollectionPage — 수집 도감
 */
export const CollectionPage: React.FC = () => {
  const characters = useGameStore((s) => s.ownedCharacters);
  const [selected, setSelected] = useState<CharacterInstance | null>(null);

  return (
    <div className="h-full flex flex-col p-5 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="font-pixel text-pixel-text text-pixel-lg">📖 수집 도감</h2>
        <span className="font-pixel text-pixel-muted text-pixel-xs">
          {characters.length}마리 수집
        </span>
      </div>

      {characters.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-5xl mb-5">📭</p>
          <p className="font-pixel text-pixel-muted text-pixel-sm text-center leading-relaxed">
            아직 수집한 캐릭터가 없습니다.<br />
            가챠에서 캐릭터를 뽑아보세요!
          </p>
        </div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {/* 캐릭터 그리드 */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-4 gap-3">
              {characters.map((char, i) => (
                <motion.button
                  key={char.instanceId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(char)}
                  className={`
                    p-4 border-2 bg-pixel-surface text-center transition-all
                    ${selected?.instanceId === char.instanceId
                      ? 'border-pixel-accent'
                      : 'border-pixel-primary hover:border-pixel-muted'
                    }
                  `}
                >
                  <div className="w-12 h-12 bg-pixel-primary mx-auto mb-2 flex items-center justify-center">
                    <span className="text-2xl">🐱</span>
                  </div>
                  <p className="font-pixel text-pixel-xs text-pixel-text truncate">
                    {char.personality}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* 상세 패널 */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-64 bg-pixel-surface border-2 border-pixel-primary p-4 shrink-0 overflow-auto"
              >
                {/* 캐릭터 이미지 */}
                <div className="w-24 h-24 bg-pixel-primary mx-auto mb-4 flex items-center justify-center border-2 border-pixel-muted/30">
                  <span className="text-5xl">🐱</span>
                </div>

                <p className="font-pixel text-pixel-sm text-pixel-text text-center mb-1">
                  {selected.personality}
                </p>
                <p className="font-pixel text-pixel-xs text-pixel-muted text-center mb-4">
                  ID: {selected.instanceId.slice(0, 8)}...
                </p>

                {/* 스탯 바 */}
                <div className="space-y-2.5 mb-4">
                  {Object.entries(selected.stats).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="font-pixel text-pixel-xs text-pixel-muted">
                          {STAT_LABELS[key] || key}
                        </span>
                        <span className="font-pixel text-pixel-xs text-pixel-text">{val}</span>
                      </div>
                      <div className="h-2 bg-pixel-primary">
                        <div
                          className="h-full bg-pixel-accent transition-all"
                          style={{ width: `${val}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 특성 */}
                {selected.traits.length > 0 && (
                  <div className="mb-4">
                    <p className="font-pixel text-pixel-xs text-pixel-muted mb-2">특성</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.traits.map((trait) => (
                        <span
                          key={trait}
                          className="font-pixel text-pixel-xs bg-yellow-900/40 text-yellow-400 px-2 py-1 border border-yellow-700/30"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="font-pixel text-pixel-xs text-pixel-muted/60">
                  획득: {new Date(selected.obtainedAt).toLocaleDateString('ko-KR')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
