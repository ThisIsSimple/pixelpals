import React, { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PhaserGame } from '../components/PhaserGame';
import { BootScene } from '../../scenes/BootScene';
import { SpaceScene } from '../../scenes/SpaceScene';
import { EventBus } from '../../utils/EventBus';

/**
 * SpacePage — 개인 공간 페이지
 *
 * Phaser 게임 월드를 마운트하는 유일한 페이지 중 하나.
 * URL 파라미터로 다른 유저의 공간도 방문 가능: /space/:userId
 */
export const SpacePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);

  const targetUserId = userId || 'local-player';
  const isOwnSpace = targetUserId === 'local-player';

  const handleGameReady = useCallback((game: Phaser.Game) => {
    EventBus.on('space:editModeChanged', (mode: unknown) => {
      setIsEditMode(mode as boolean);
    });
    EventBus.emit('space:load', { userId: targetUserId });
  }, [targetUserId]);

  return (
    <div className="h-full relative">
      {/* Phaser 게임 월드 */}
      <PhaserGame
        scenes={[BootScene, SpaceScene]}
        sceneData={{ userId: targetUserId }}
        onReady={handleGameReady}
      />

      {/* React 오버레이 UI */}
      <div className="absolute top-3 left-3 z-20 flex gap-2">
        <button
          onClick={() => navigate('/')}
          className="font-pixel text-pixel-xs text-pixel-text bg-pixel-primary/80 backdrop-blur px-4 py-2 hover:bg-pixel-primary transition-colors border border-pixel-muted/30"
        >
          ← 홈
        </button>

        {isOwnSpace && (
          <button
            onClick={() => {
              const newMode = !isEditMode;
              setIsEditMode(newMode);
              EventBus.emit('space:toggleEdit', newMode);
            }}
            className={`
              font-pixel text-pixel-xs px-4 py-2 transition-colors border
              ${isEditMode
                ? 'text-white bg-green-700/80 border-green-500/50'
                : 'text-pixel-text bg-pixel-primary/80 border-pixel-muted/30'
              }
            `}
          >
            {isEditMode ? '✅ 완료' : '🔧 편집'}
          </button>
        )}
      </div>

      {/* 방문 중 표시 */}
      {!isOwnSpace && (
        <div className="absolute top-3 right-3 z-20">
          <div className="font-pixel text-pixel-xs text-pixel-muted bg-pixel-surface/80 backdrop-blur px-4 py-2 border border-pixel-muted/30">
            👋 {targetUserId}님의 공간 방문 중
          </div>
        </div>
      )}
    </div>
  );
};
