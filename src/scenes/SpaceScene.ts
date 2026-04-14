import Phaser from 'phaser';
import {
  TILE_SIZE,
  DEFAULT_SPACE_WIDTH, DEFAULT_SPACE_HEIGHT,
} from '../config/constants';
import { EventBus } from '../utils/EventBus';
import { gridToWorld } from '../utils/GridUtils';

/**
 * SpaceScene — 개인 공간 (크리에이터의 무대)
 *
 * v0.2.0: 이 씬은 PhaserGame 컴포넌트를 통해 SpacePage에서만 마운트된다.
 * 네비게이션 버튼, HUD 등 UI는 React에서 처리하므로 순수 게임 월드만 렌더링.
 */
export class SpaceScene extends Phaser.Scene {
  private spaceWidth = DEFAULT_SPACE_WIDTH;
  private spaceHeight = DEFAULT_SPACE_HEIGHT;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private placedObjects: Phaser.GameObjects.Image[] = [];
  private isEditMode = false;

  constructor() {
    super({ key: 'SpaceScene' });
  }

  create(): void {
    this.drawFloorTiles();

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setVisible(false);

    const worldWidth = this.spaceWidth * TILE_SIZE;
    const worldHeight = this.spaceHeight * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.centerOn(worldWidth / 2, worldHeight / 2);

    // 마우스 휠 줌
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const cam = this.cameras.main;
      const newZoom = Phaser.Math.Clamp(cam.zoom - deltaY * 0.001, 0.5, 2);
      cam.setZoom(newZoom);
    });

    // ── 샘플 가챠 머신 ──
    const machinePos = gridToWorld(7, 5);
    const machine = this.add.image(machinePos.worldX, machinePos.worldY - 8, 'gacha-machine');
    machine.setScale(1);
    machine.setInteractive({ useHandCursor: true });
    machine.on('pointerdown', () => {
      EventBus.emit('gacha:openMachine', { machineId: 'demo-machine' });
    });

    this.tweens.add({
      targets: machine,
      y: machine.y - 3,
      duration: 1500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // 샘플 캐릭터 배치
    this.placeSampleCharacters();

    // ── React로부터의 편집 모드 이벤트 수신 ──
    EventBus.on('space:toggleEdit', (mode: unknown) => {
      this.isEditMode = mode as boolean;
      this.gridGraphics.setVisible(this.isEditMode);
      if (this.isEditMode) {
        this.drawGrid();
      }
      EventBus.emit('space:editModeChanged', this.isEditMode);
    });

    EventBus.emit('scene:changed', 'SpaceScene');
  }

  private drawFloorTiles(): void {
    for (let gx = 0; gx < this.spaceWidth; gx++) {
      for (let gy = 0; gy < this.spaceHeight; gy++) {
        const pos = gridToWorld(gx, gy);
        this.add.image(pos.worldX, pos.worldY, 'tile-grass');
      }
    }
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x8a8a9a, 0.3);

    const worldWidth = this.spaceWidth * TILE_SIZE;
    const worldHeight = this.spaceHeight * TILE_SIZE;

    for (let x = 0; x <= worldWidth; x += TILE_SIZE) {
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, worldHeight);
    }
    for (let y = 0; y <= worldHeight; y += TILE_SIZE) {
      this.gridGraphics.moveTo(0, y);
      this.gridGraphics.lineTo(worldWidth, y);
    }
    this.gridGraphics.strokePath();
  }

  private placeSampleCharacters(): void {
    const positions = [
      { gx: 3, gy: 4 }, { gx: 10, gy: 8 },
      { gx: 5, gy: 12 }, { gx: 12, gy: 3 },
    ];

    positions.forEach((pos) => {
      const worldPos = gridToWorld(pos.gx, pos.gy);
      const char = this.add.image(worldPos.worldX, worldPos.worldY, 'character-default');
      char.setScale(2.5);

      this.tweens.add({
        targets: char,
        y: worldPos.worldY - 6,
        duration: 600 + Math.random() * 400,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      this.time.addEvent({
        delay: 3000 + Math.random() * 5000,
        callback: () => this.moveCharacterRandom(char),
        loop: true,
      });

      this.placedObjects.push(char);
    });
  }

  private moveCharacterRandom(char: Phaser.GameObjects.Image): void {
    const dx = (Math.random() - 0.5) * TILE_SIZE * 3;
    const dy = (Math.random() - 0.5) * TILE_SIZE * 3;

    const worldWidth = this.spaceWidth * TILE_SIZE;
    const worldHeight = this.spaceHeight * TILE_SIZE;

    const newX = Phaser.Math.Clamp(char.x + dx, TILE_SIZE, worldWidth - TILE_SIZE);
    const newY = Phaser.Math.Clamp(char.y + dy, TILE_SIZE, worldHeight - TILE_SIZE);

    char.setFlipX(dx < 0);

    this.tweens.add({
      targets: char,
      x: newX,
      y: newY,
      duration: 800,
      ease: 'Sine.easeInOut',
    });
  }

  shutdown(): void {
    // 씬 종료 시 이벤트 정리
    EventBus.off('space:toggleEdit');
  }
}
