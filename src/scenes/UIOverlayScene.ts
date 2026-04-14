import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';
import { EventBus } from '../utils/EventBus';

const TEXT_RES = 2;

/**
 * UIOverlayScene — HUD 오버레이
 */
export class UIOverlayScene extends Phaser.Scene {
  private currencyText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  private currency = 500;

  constructor() {
    super({ key: 'UIOverlayScene' });
  }

  create(): void {
    const hudBg = this.add.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH, 32, 0x16213e, 0.85);
    hudBg.setOrigin(0.5, 0);

    this.currencyText = this.add.text(GAME_WIDTH - 16, 8, `💰 ${this.currency}`, {
      fontSize: '12px',
      fontFamily: 'Galmuri11, monospace',
      color: '#ffd700',
      resolution: TEXT_RES,
    });
    this.currencyText.setOrigin(1, 0);

    this.add.text(16, 8, 'PixelPals', {
      fontSize: '12px',
      fontFamily: 'Galmuri11, monospace',
      color: '#e94560',
      resolution: TEXT_RES,
    });

    this.messageText = this.add.text(GAME_WIDTH / 2, 50, '', {
      fontSize: '10px',
      fontFamily: 'Galmuri11, monospace',
      color: '#fff1e8',
      backgroundColor: '#0f3460',
      padding: { x: 12, y: 8 },
      resolution: TEXT_RES,
    });
    this.messageText.setOrigin(0.5);
    this.messageText.setAlpha(0);

    EventBus.on('ui:showMessage', (msg: unknown) => {
      this.showToast(msg as string);
    });

    EventBus.on('currency:changed', (amount: unknown) => {
      this.currency = amount as number;
      this.currencyText.setText(`💰 ${this.currency}`);
    });

    EventBus.on('character:obtained', () => {
      this.currency -= 100;
      this.currencyText.setText(`💰 ${this.currency}`);
      EventBus.emit('currency:changed', this.currency);
    });
  }

  private showToast(message: string): void {
    this.messageText.setText(message);
    this.messageText.setAlpha(0);
    this.messageText.setY(40);

    this.tweens.add({
      targets: this.messageText,
      alpha: 1,
      y: 50,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: this.messageText,
            alpha: 0,
            y: 40,
            duration: 300,
          });
        });
      },
    });
  }
}
