import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { EventBus } from '../utils/EventBus';
import { generateStats, generatePersonality, generateTraits, generateId, weightedRandom } from '../utils/RandomGen';
import type { GachaResult } from '../types/gacha';

const TEXT_RES = 2;

/**
 * GachaScene — 가챠 뽑기 연출 씬
 */
export class GachaScene extends Phaser.Scene {
  private overlay!: Phaser.GameObjects.Rectangle;
  private resultContainer!: Phaser.GameObjects.Container;
  private isAnimating = false;

  private demoEntries = [
    { id: 'cat-normal', label: '🐱 노란 고양이', tier: 1, probability: 0.40 },
    { id: 'cat-black', label: '🐱 검은 고양이', tier: 2, probability: 0.30 },
    { id: 'cat-calico', label: '🐱 삼색 고양이', tier: 3, probability: 0.20 },
    { id: 'cat-rainbow', label: '🌈 무지개 고양이', tier: 4, probability: 0.08 },
    { id: 'cat-cosmic', label: '🌌 우주 고양이', tier: 5, probability: 0.02 },
  ];

  constructor() {
    super({ key: 'GachaScene' });
  }

  create(): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    // ── 어두운 오버레이 ──
    this.overlay = this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    this.overlay.setInteractive();

    // ── 가챠 머신 확대 ──
    const machine = this.add.image(centerX, centerY - 40, 'gacha-machine');
    machine.setScale(3);
    machine.setAlpha(0);

    this.tweens.add({
      targets: machine,
      alpha: 1,
      scaleX: 3.5,
      scaleY: 3.5,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // ── 확률 테이블 표시 ──
    const probText = this.demoEntries
      .map((e) => `${e.label}  ${(e.probability * 100).toFixed(1)}%`)
      .join('\n');

    const probDisplay = this.add.text(centerX, centerY + 100, probText, {
      fontSize: '10px',
      fontFamily: 'Galmuri11, monospace',
      color: '#c2c3c7',
      align: 'center',
      lineSpacing: 8,
      resolution: TEXT_RES,
    });
    probDisplay.setOrigin(0.5, 0);

    // ── 뽑기 버튼 ──
    const pullBtn = this.add.text(centerX, GAME_HEIGHT - 80, '🎰 뽑기! (100 코인)', {
      fontSize: '14px',
      fontFamily: 'Galmuri11, monospace',
      color: '#fff1e8',
      backgroundColor: '#e94560',
      padding: { x: 16, y: 10 },
      resolution: TEXT_RES,
    });
    pullBtn.setOrigin(0.5);
    pullBtn.setInteractive({ useHandCursor: true });

    pullBtn.on('pointerover', () => pullBtn.setStyle({ backgroundColor: '#ff004d' }));
    pullBtn.on('pointerout', () => pullBtn.setStyle({ backgroundColor: '#e94560' }));
    pullBtn.on('pointerdown', () => {
      if (!this.isAnimating) this.performPull(machine, probDisplay, pullBtn);
    });

    // ── 닫기 버튼 ──
    const closeBtn = this.add.text(GAME_WIDTH - 20, 20, '✕', {
      fontSize: '18px',
      fontFamily: 'Galmuri11, monospace',
      color: '#eaeaea',
      resolution: TEXT_RES,
    });
    closeBtn.setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => {
      this.scene.stop();
    });

    this.resultContainer = this.add.container(centerX, centerY);
    this.resultContainer.setVisible(false);

    EventBus.emit('scene:changed', 'GachaScene');
  }

  private performPull(
    machine: Phaser.GameObjects.Image,
    probDisplay: Phaser.GameObjects.Text,
    pullBtn: Phaser.GameObjects.Text,
  ): void {
    this.isAnimating = true;
    pullBtn.setVisible(false);
    probDisplay.setVisible(false);

    this.tweens.add({
      targets: machine,
      angle: { from: -3, to: 3 },
      duration: 80,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        machine.setAngle(0);

        const items = this.demoEntries.map((e) => e);
        const weights = this.demoEntries.map((e) => e.probability);
        const selected = weightedRandom(items, weights);

        const result: GachaResult = {
          characterDesignId: selected.id,
          rarityLabel: selected.label,
          rarityTier: selected.tier,
          stats: generateStats(),
          personality: generatePersonality(),
          traits: generateTraits(),
          instanceId: generateId(),
        };

        this.playRevealAnimation(result, machine, probDisplay, pullBtn);
      },
    });
  }

  private playRevealAnimation(
    result: GachaResult,
    machine: Phaser.GameObjects.Image,
    probDisplay: Phaser.GameObjects.Text,
    pullBtn: Phaser.GameObjects.Text,
  ): void {
    const centerX = GAME_WIDTH / 2;
    const centerY = GAME_HEIGHT / 2;

    const tierColors: Record<number, number> = {
      1: 0x8a8a9a,
      2: 0x29adff,
      3: 0xa78bfa,
      4: 0xffd700,
      5: 0xff004d,
    };
    const flashColor = tierColors[result.rarityTier] || 0xffffff;

    const flash = this.add.rectangle(centerX, centerY, GAME_WIDTH, GAME_HEIGHT, flashColor, 0);
    this.tweens.add({
      targets: flash,
      alpha: { from: 0.8, to: 0 },
      duration: 500,
      onComplete: () => flash.destroy(),
    });

    if (result.rarityTier >= 4) {
      this.cameras.main.shake(300, 0.01 * result.rarityTier);
    }

    this.tweens.add({
      targets: machine,
      alpha: 0,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
    });

    this.time.delayedCall(400, () => {
      this.resultContainer.removeAll(true);

      const charImg = this.add.image(0, -60, 'character-default');
      charImg.setScale(0);
      this.tweens.add({
        targets: charImg,
        scaleX: 4,
        scaleY: 4,
        duration: 400,
        ease: 'Back.easeOut',
      });

      const rarityText = this.add.text(0, 20, result.rarityLabel, {
        fontSize: '16px',
        fontFamily: 'Galmuri11, monospace',
        color: `#${flashColor.toString(16).padStart(6, '0')}`,
        resolution: TEXT_RES,
      });
      rarityText.setOrigin(0.5);

      const personalityText = this.add.text(0, 50, `성격: ${result.personality}`, {
        fontSize: '10px',
        fontFamily: 'Galmuri11, monospace',
        color: '#c2c3c7',
        resolution: TEXT_RES,
      });
      personalityText.setOrigin(0.5);

      const statsStr = [
        `STR ${result.stats.str}`,
        `DEX ${result.stats.dex}`,
        `INT ${result.stats.int}`,
        `CHA ${result.stats.cha}`,
        `LUK ${result.stats.luk}`,
      ].join('  ');
      const statsText = this.add.text(0, 72, statsStr, {
        fontSize: '8px',
        fontFamily: 'Galmuri11, monospace',
        color: '#eaeaea',
        resolution: TEXT_RES,
      });
      statsText.setOrigin(0.5);

      const traitsText = this.add.text(0, 94, `특성: ${result.traits.join(', ')}`, {
        fontSize: '8px',
        fontFamily: 'Galmuri11, monospace',
        color: '#ffa300',
        resolution: TEXT_RES,
      });
      traitsText.setOrigin(0.5);

      this.resultContainer.add([charImg, rarityText, personalityText, statsText, traitsText]);
      this.resultContainer.setVisible(true);

      const collectBtn = this.add.text(0, 140, '✨ 수집하기', {
        fontSize: '12px',
        fontFamily: 'Galmuri11, monospace',
        color: '#fff1e8',
        backgroundColor: '#008751',
        padding: { x: 14, y: 8 },
        resolution: TEXT_RES,
      });
      collectBtn.setOrigin(0.5);
      collectBtn.setInteractive({ useHandCursor: true });
      collectBtn.on('pointerdown', () => {
        EventBus.emit('character:obtained', result);
        EventBus.emit('ui:showMessage', `${result.rarityLabel}을(를) 수집했습니다!`);

        this.resultContainer.setVisible(false);
        collectBtn.destroy();
        machine.setAlpha(1);
        machine.setScale(3.5);
        probDisplay.setVisible(true);
        pullBtn.setVisible(true);
        this.isAnimating = false;
      });
      this.resultContainer.add(collectBtn);
    });
  }
}
