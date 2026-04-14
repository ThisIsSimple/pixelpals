import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import { useUIStore } from '../../stores/useUIStore';
import { weightedRandom, generateStats, generatePersonality, generateTraits, generateId } from '../../utils/RandomGen';
import type { GachaResult } from '../../types/gacha';
import type { Personality } from '../../types/character';

const GACHA_COST = 100;

const DEMO_ENTRIES = [
  { id: 'cat-normal', label: '🐱 노란 고양이', tier: 1, probability: 0.40 },
  { id: 'cat-black', label: '🐱 검은 고양이', tier: 2, probability: 0.30 },
  { id: 'cat-calico', label: '🐱 삼색 고양이', tier: 3, probability: 0.20 },
  { id: 'cat-rainbow', label: '🌈 무지개 고양이', tier: 4, probability: 0.08 },
  { id: 'cat-cosmic', label: '🌌 우주 고양이', tier: 5, probability: 0.02 },
];

const TIER_COLORS: Record<number, string> = {
  1: 'text-gray-400',
  2: 'text-blue-400',
  3: 'text-purple-400',
  4: 'text-yellow-400',
  5: 'text-red-400',
};

const TIER_BG: Record<number, string> = {
  1: 'border-gray-500/50',
  2: 'border-blue-500/50',
  3: 'border-purple-500/50',
  4: 'border-yellow-500/60',
  5: 'border-red-500/60',
};

const TIER_FLASH: Record<number, string> = {
  1: 'bg-gray-400',
  2: 'bg-blue-400',
  3: 'bg-purple-400',
  4: 'bg-yellow-400',
  5: 'bg-red-500',
};

type GachaPhase = 'idle' | 'shaking' | 'flash' | 'reveal';

/**
 * GachaPage — 가챠 뽑기 페이지 (React + Framer Motion)
 */
export const GachaPage: React.FC = () => {
  const [phase, setPhase] = useState<GachaPhase>('idle');
  const [result, setResult] = useState<GachaResult | null>(null);
  const currency = useGameStore((s) => s.currency);
  const spendCurrency = useGameStore((s) => s.spendCurrency);
  const addCharacter = useGameStore((s) => s.addCharacter);
  const showToast = useUIStore((s) => s.showToast);
  const clearToast = useUIStore((s) => s.clearToast);

  const handlePull = useCallback(() => {
    if (phase !== 'idle') return;
    if (currency < GACHA_COST) {
      showToast('코인이 부족합니다!');
      setTimeout(clearToast, 2000);
      return;
    }

    spendCurrency(GACHA_COST);
    setPhase('shaking');

    setTimeout(() => {
      const items = DEMO_ENTRIES.map((e) => e);
      const weights = DEMO_ENTRIES.map((e) => e.probability);
      const selected = weightedRandom(items, weights);

      const newResult: GachaResult = {
        characterDesignId: selected.id,
        rarityLabel: selected.label,
        rarityTier: selected.tier,
        stats: generateStats(),
        personality: generatePersonality(),
        traits: generateTraits(),
        instanceId: generateId(),
      };

      setResult(newResult);
      setPhase('flash');

      setTimeout(() => {
        setPhase('reveal');
      }, 400);
    }, 1200);
  }, [phase, currency, spendCurrency, showToast, clearToast]);

  const handleCollect = useCallback(() => {
    if (!result) return;

    addCharacter({
      instanceId: result.instanceId,
      designId: result.characterDesignId,
      ownerId: 'local-player',
      personality: result.personality as Personality,
      stats: result.stats,
      traits: result.traits,
      obtainedAt: Date.now(),
      obtainedFrom: 'gacha',
    });

    showToast(`${result.rarityLabel}을(를) 수집했습니다!`);
    setTimeout(clearToast, 2500);
    setResult(null);
    setPhase('idle');
  }, [result, addCharacter, showToast, clearToast]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* 플래시 효과 */}
      <AnimatePresence>
        {phase === 'flash' && result && (
          <motion.div
            className={`absolute inset-0 ${TIER_FLASH[result.rarityTier]} z-30`}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      {/* 가챠 머신 */}
      <motion.div
        className="w-36 h-48 bg-pixel-accent border-4 border-red-700 relative mb-8 flex flex-col items-center justify-center"
        animate={
          phase === 'shaking'
            ? { rotate: [-3, 3, -3, 3, -2, 2, -1, 1, 0], transition: { duration: 1.2, ease: 'linear' } }
            : { rotate: 0 }
        }
      >
        <div className="w-28 h-24 bg-pixel-surface border-2 border-pixel-primary flex items-center justify-center mb-2">
          <span className="text-4xl">🎰</span>
        </div>
        <div className="w-14 h-7 bg-pixel-text/20 border border-pixel-muted/30" />
        <div className="absolute -bottom-2 w-40 h-4 bg-gray-700 border-t-2 border-gray-600" />
      </motion.div>

      {/* 결과 공개 */}
      <AnimatePresence mode="wait">
        {phase === 'reveal' && result ? (
          <motion.div
            key="result"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`border-2 ${TIER_BG[result.rarityTier]} bg-pixel-surface p-6 text-center mb-6 w-80`}
          >
            {/* 캐릭터 비주얼 */}
            <div className="w-20 h-20 bg-pixel-primary mx-auto mb-4 flex items-center justify-center border-2 border-pixel-muted/30">
              <span className="text-4xl">
                {result.rarityTier >= 4 ? '✨' : '🐱'}
              </span>
            </div>

            <p className={`font-pixel text-pixel-lg ${TIER_COLORS[result.rarityTier]} mb-3`}>
              {result.rarityLabel}
            </p>

            <p className="font-pixel text-pixel-xs text-pixel-muted mb-3">
              성격: {result.personality}
            </p>

            <div className="flex justify-center gap-3 mb-3 flex-wrap">
              {Object.entries(result.stats).map(([key, val]) => (
                <span key={key} className="font-pixel text-pixel-xs text-pixel-text">
                  {key.toUpperCase()} {val}
                </span>
              ))}
            </div>

            <p className="font-pixel text-pixel-xs text-yellow-500 mb-4">
              특성: {result.traits.join(', ')}
            </p>

            <button
              onClick={handleCollect}
              className="font-pixel text-pixel-sm text-white bg-green-700 hover:bg-green-600 px-5 py-2.5 transition-colors"
            >
              ✨ 수집하기
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <div className="bg-pixel-surface border-2 border-pixel-primary p-4 w-80">
              <p className="font-pixel text-pixel-sm text-pixel-text mb-3 text-center">확률표</p>
              {DEMO_ENTRIES.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center py-1.5">
                  <span className={`font-pixel text-pixel-xs ${TIER_COLORS[entry.tier]}`}>
                    {entry.label}
                  </span>
                  <span className="font-pixel text-pixel-xs text-pixel-muted">
                    {(entry.probability * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 뽑기 버튼 */}
      {phase === 'idle' && !result && (
        <motion.button
          onClick={handlePull}
          className="font-pixel text-pixel-base text-white bg-pixel-accent hover:bg-red-600 px-8 py-3 transition-colors border-2 border-red-700"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🎰 뽑기! ({GACHA_COST} 코인)
        </motion.button>
      )}

      {phase === 'shaking' && (
        <p className="font-pixel text-pixel-sm text-pixel-muted animate-pulse">뽑는 중...</p>
      )}
    </div>
  );
};
