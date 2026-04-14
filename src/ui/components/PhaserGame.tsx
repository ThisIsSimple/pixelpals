import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../../config/constants';

interface PhaserGameProps {
  /** Phaser Scene 클래스 배열 — 첫 번째가 시작 씬 */
  scenes: (new (config?: string | Phaser.Types.Scenes.SettingsConfig) => Phaser.Scene)[];
  /** 씬에 전달할 초기 데이터 */
  sceneData?: Record<string, unknown>;
  /** 게임 준비 완료 콜백 */
  onReady?: (game: Phaser.Game) => void;
}

/**
 * PhaserGame — Phaser 인스턴스를 React 컴포넌트로 감싸는 래퍼
 *
 * Space, Dungeon 등 게임 월드가 필요한 페이지에서만 마운트된다.
 * 언마운트 시 Phaser 인스턴스를 자동으로 destroy한다.
 */
export const PhaserGame: React.FC<PhaserGameProps> = ({ scenes, sceneData, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      pixelArt: false,
      antialias: true,
      roundPixels: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: scenes,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // 첫 씬에 데이터 전달
    if (sceneData) {
      game.events.once('ready', () => {
        const firstScene = game.scene.scenes[0];
        if (firstScene) {
          firstScene.data.set('initData', sceneData);
        }
      });
    }

    onReady?.(game);

    // 개발용 전역 접근
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__PIXELPALS_GAME__ = game;
    }

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []); // scenes는 의도적으로 deps에서 제외 — 마운트 1회만 생성

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ imageRendering: 'auto' }}
    />
  );
};
