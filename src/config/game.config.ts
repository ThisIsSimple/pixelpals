/**
 * game.config.ts — Phaser 기본 설정값
 *
 * v0.2.0: Phaser 인스턴스는 PhaserGame 컴포넌트에서 생성된다.
 * 이 파일은 공통 설정값만 export하며, 실제 GameConfig 조립은 PhaserGame에서 한다.
 *
 * @deprecated PhaserGame 컴포넌트가 직접 config를 조립하므로 이 파일은
 *             참조용으로만 유지. 추후 삭제 예정.
 */

export const PHASER_DEFAULTS = {
  pixelArt: false,
  antialias: true,
  roundPixels: true,
  physics: {
    default: 'arcade' as const,
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
} as const;
