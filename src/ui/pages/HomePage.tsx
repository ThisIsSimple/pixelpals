import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';

const MENU_ITEMS = [
  {
    path: '/editor',
    emoji: '🎨',
    title: '캐릭터 만들기',
    desc: '픽셀 에디터로 나만의 캐릭터를 그려보세요',
    color: 'bg-purple-900/40 hover:bg-purple-800/50',
    border: 'border-purple-500/50',
  },
  {
    path: '/space',
    emoji: '🏠',
    title: '내 공간',
    desc: '캐릭터를 배치하고 가챠 머신을 설치하세요',
    color: 'bg-green-900/40 hover:bg-green-800/50',
    border: 'border-green-500/50',
  },
  {
    path: '/gacha',
    emoji: '🎰',
    title: '가챠 체험',
    desc: '다른 크리에이터의 캐릭터를 뽑아보세요',
    color: 'bg-red-900/40 hover:bg-red-800/50',
    border: 'border-red-500/50',
  },
  {
    path: '/collection',
    emoji: '📖',
    title: '수집 도감',
    desc: '수집한 캐릭터와 스탯을 확인하세요',
    color: 'bg-blue-900/40 hover:bg-blue-800/50',
    border: 'border-blue-500/50',
  },
] as const;

/**
 * HomePage — 메인 메뉴 (React 버전)
 */
export const HomePage: React.FC = () => {
  const nickname = useGameStore((s) => s.nickname);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 overflow-auto">
      {/* 타이틀 */}
      <motion.h1
        className="font-pixel text-pixel-accent text-pixel-2xl mb-3"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        PixelPals
      </motion.h1>

      <p className="font-pixel text-pixel-muted text-pixel-xs text-center leading-relaxed mb-10">
        나만의 픽셀 캐릭터를 그리고<br />
        가챠로 세상에 풀고, 모험으로 모아라
      </p>

      {/* 메뉴 카드 그리드 */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xl">
        {MENU_ITEMS.map((item, i) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, ease: 'easeOut' }}
          >
            <Link
              to={item.path}
              className={`
                block p-5 border-2 ${item.border} ${item.color}
                transition-all duration-100 group
              `}
            >
              <div className="text-3xl mb-3">{item.emoji}</div>
              <div className="font-pixel text-pixel-text text-pixel-base mb-2 group-hover:text-white">
                {item.title}
              </div>
              <div className="font-pixel text-pixel-muted text-pixel-xs leading-relaxed">
                {item.desc}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 하단 정보 */}
      <div className="mt-10 text-center">
        <p className="font-pixel text-pixel-muted text-pixel-xs">
          환영합니다, <span className="text-pixel-text">{nickname}</span>님!
        </p>
        <p className="font-pixel text-pixel-xs text-pixel-muted/50 mt-2">v0.2.0-dev</p>
      </div>
    </div>
  );
};
