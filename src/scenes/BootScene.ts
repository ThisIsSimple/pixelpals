import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { EventBus } from '../utils/EventBus';

/**
 * BootScene — Phaser 에셋 로딩 및 초기화
 *
 * v0.2.0: Phaser가 SpacePage/DungeonPage에서만 마운트되므로,
 * 이 씬은 게임 월드 에셋을 로드한 뒤 바로 SpaceScene으로 전환한다.
 * (MainMenuScene은 더 이상 존재하지 않음 — React HomePage로 대체됨)
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // 프로시저럴 에셋 생성 (외부 파일 없이 동작하도록)
    this.generatePlaceholderAssets();
  }

  create(): void {
    // 픽셀아트 텍스처에만 NEAREST 필터 적용
    this.applyPixelArtFilter();

    EventBus.emit('game:ready');

    // 바로 SpaceScene으로 전환 (로딩 화면은 React에서 처리 가능)
    this.scene.start('SpaceScene');
  }

  /**
   * 픽셀아트 텍스처에만 NEAREST 필터를 적용한다.
   */
  private applyPixelArtFilter(): void {
    const pixelArtKeys = ['character-default', 'tile-grass', 'gacha-machine'];

    pixelArtKeys.forEach((key) => {
      const texture = this.textures.get(key);
      if (texture && texture.source && texture.source.length > 0) {
        texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    });
  }

  /** 외부 에셋 파일 없이도 동작하도록 코드로 기본 에셋 생성 */
  private generatePlaceholderAssets(): void {
    // 기본 캐릭터 (16x16 단색 실루엣)
    const charCanvas = this.createPixelCanvas(16, 16, (ctx) => {
      const body = [
        '......##........',
        '.....####.......',
        '.....####.......',
        '......##........',
        '....######......',
        '...########.....',
        '...########.....',
        '....######......',
        '....#..##.......',
        '....#...#.......',
      ];
      ctx.fillStyle = '#60a5fa';
      body.forEach((row, y) => {
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '#') ctx.fillRect(x, y + 3, 1, 1);
        }
      });
    });
    this.textures.addCanvas('character-default', charCanvas);

    // 기본 타일 (48x48 풀 타일)
    const tileCanvas = this.createPixelCanvas(TILE_SIZE, TILE_SIZE, (ctx) => {
      ctx.fillStyle = '#2d5a3f';
      ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#3a7a52';
      for (let x = 0; x < TILE_SIZE; x += 8) {
        for (let y = 0; y < TILE_SIZE; y += 8) {
          if ((x + y) % 16 === 0) ctx.fillRect(x, y, 4, 4);
        }
      }
      ctx.strokeStyle = '#1a3a28';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
    });
    this.textures.addCanvas('tile-grass', tileCanvas);

    // 가챠 머신 (48x64)
    const machineCanvas = this.createPixelCanvas(48, 64, (ctx) => {
      ctx.fillStyle = '#e94560';
      ctx.fillRect(4, 8, 40, 48);
      ctx.fillStyle = '#16213e';
      ctx.fillRect(8, 12, 32, 24);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(18, 18, 12, 12);
      ctx.fillStyle = '#fff1e8';
      ctx.fillRect(20, 42, 8, 8);
      ctx.fillStyle = '#5f574f';
      ctx.fillRect(8, 56, 32, 8);
    });
    this.textures.addCanvas('gacha-machine', machineCanvas);
  }

  /** 캔버스 헬퍼 — 픽셀 단위 그리기 */
  private createPixelCanvas(
    width: number,
    height: number,
    draw: (ctx: CanvasRenderingContext2D) => void,
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    draw(ctx);
    return canvas;
  }
}
