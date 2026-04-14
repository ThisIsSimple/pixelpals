import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * DungeonPage — 던전 모험 페이지 (Phase C6 구현 예정)
 */
export const DungeonPage: React.FC = () => {
  const { dungeonId } = useParams<{ dungeonId?: string }>();
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <p className="text-5xl mb-5">⚔️</p>
      <h2 className="font-pixel text-pixel-text text-pixel-lg mb-3">던전 탐험</h2>
      <p className="font-pixel text-pixel-muted text-pixel-sm text-center leading-relaxed mb-5">
        {dungeonId
          ? `던전 "${dungeonId}" 준비 중...`
          : '던전 시스템은 Phase C6에서 구현됩니다.'
        }
      </p>
      <p className="font-pixel text-pixel-muted/60 text-pixel-xs text-center leading-relaxed mb-8">
        수집한 캐릭터로 팀을 구성하고<br />
        던전을 클리어하여 보상을 획득하세요!
      </p>
      <button
        onClick={() => navigate('/')}
        className="font-pixel text-pixel-sm text-pixel-text bg-pixel-primary hover:bg-pixel-accent px-5 py-2.5 transition-colors border-2 border-pixel-muted/30"
      >
        ← 돌아가기
      </button>
    </div>
  );
};
