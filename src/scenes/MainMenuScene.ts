import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { EventBus } from '../utils/EventBus';

/**
 * TEXT_RESOLUTION: 텍스트 내부 렌더링 해상도 배율.
 * Phaser Text는 내부적으로 캔버스에 텍스트를 그려 텍스처로 변환하는데,
 * resolution을 2로 올리면 2배 해상도로 그린 뒤 원래 크기로 표시해서 선명해진다.
 */
const TEXT_RES = 2;

/**
 * MainMenuScene — 메인 메뉴 화면
 */
export class MainMenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private floatingChars: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;

    // ── 배경 그라디언트 효과 (타일 패턴) ──
    for (let x = 0; x < GAME_WIDTH; x += 48) {
      for (let y = 0; y < GAME_HEIGHT; y += 48) {
        const tile = this.add.image(x + 24, y + 24, 'tile-grass');
        tile.setAlpha(0.15);
      }
    }

    // ── 타이틀 ──
    this.titleText = this.add.text(centerX, 100, 'PixelPals', {
      fontSize: '40px',
      fontFamily: 'Galmuri11, monospace',
      color: '#e94560',
      resolution: TEXT_RES,
    });
    this.titleText.setOrigin(0.5);

    this.tweens.add({
      targets: this.titleText,
      y: 110,
      duration: 1200,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });

    // ── 서브타이틀 ──
    const subtitle = this.add.text(centerX, 160, '나만의 픽셀 캐릭터를 그리고\n가챠로 세상에 풀고, 모험으로 모아라', {
      fontSize: '10px',
      fontFamily: 'Galmuri11, monospace',
      color: '#8a8a9a',
      align: 'center',
      lineSpacing: 8,
      resolution: TEXT_RES,
    });
    subtitle.setOrigin(0.5);

    // ── 메뉴 버튼 ──
    const menuDefs = [
      { label: '🎨  캐릭터 만들기', action: 'editor' },
      { label: '🏠  내 공간', action: 'space' },
      { label: '🎰  가챠 체험', action: 'gacha-demo' },
      { label: '⚔️  던전 탐험', action: 'dungeon' },
      { label: '📖  수집 도감', action: 'collection' },
    ];

    menuDefs.forEach((def, i) => {
      const y = 250 + i * 52;
      const btn = this.createMenuButton(centerX, y, def.label, def.action);
      this.menuItems.push(btn);

      btn.setAlpha(0);
      btn.setX(centerX - 30);
      this.tweens.add({
        targets: btn,
        alpha: 1,
        x: centerX,
        duration: 300,
        delay: i * 100,
        ease: 'Back.easeOut',
      });
    });

    // ── 떠다니는 장식 캐릭터 ──
    this.createFloatingCharacters();

    // ── 버전 표시 ──
    this.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, 'v0.1.0-dev', {
      fontSize: '8px',
      fontFamily: 'Galmuri11, monospace',
      color: '#5f574f',
      resolution: TEXT_RES,
    }).setOrigin(1, 1);

    EventBus.emit('scene:changed', 'MainMenuScene');
  }

  private createMenuButton(x: number, y: number, label: string, action: string): Phaser.GameObjects.Text {
    const text = this.add.text(x, y, label, {
      fontSize: '14px',
      fontFamily: 'Galmuri11, monospace',
      color: '#eaeaea',
      padding: { x: 16, y: 10 },
      backgroundColor: '#0f3460',
      resolution: TEXT_RES,
    });
    text.setOrigin(0.5);
    text.setInteractive({ useHandCursor: true });

    text.on('pointerover', () => {
      text.setStyle({ backgroundColor: '#e94560', color: '#fff1e8' });
      this.tweens.add({
        targets: text,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    text.on('pointerout', () => {
      text.setStyle({ backgroundColor: '#0f3460', color: '#eaeaea' });
      this.tweens.add({
        targets: text,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    text.on('pointerdown', () => {
      this.handleMenuAction(action);
    });

    return text;
  }

  private handleMenuAction(action: string): void {
    switch (action) {
      case 'editor':
        EventBus.emit('ui:openEditor');
        break;
      case 'space':
        this.scene.start('SpaceScene');
        break;
      case 'gacha-demo':
        this.scene.start('GachaScene');
        break;
      case 'dungeon':
        EventBus.emit('ui:showMessage', '던전 탐험은 Phase C6에서 구현됩니다!');
        break;
      case 'collection':
        EventBus.emit('ui:openCollection');
        break;
    }
  }

  private createFloatingCharacters(): void {
    const positions = [
      { x: 80, y: 350 },
      { x: GAME_WIDTH - 80, y: 300 },
      { x: 120, y: 500 },
      { x: GAME_WIDTH - 120, y: 480 },
    ];

    positions.forEach((pos, i) => {
      const char = this.add.image(pos.x, pos.y, 'character-default');
      char.setScale(2.5);
      char.setAlpha(0.6);

      this.tweens.add({
        targets: char,
        y: pos.y - 8,
        duration: 800 + i * 200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      this.floatingChars.push(char);
    });
  }
}
