import type { IGachaService } from '../interfaces/IGachaService';
import type { GachaMachineConfig, GachaResult, GachaPullRecord } from '../../types/gacha';
import { generateStats, generatePersonality, generateTraits, generateId, weightedRandom } from '../../utils/RandomGen';

/** 로컬 mock 가챠 서비스 — 백엔드 연동 전 클라이언트 단독 동작 */
export class MockGachaService implements IGachaService {
  private machines: Map<string, GachaMachineConfig> = new Map();
  private pullRecords: Map<string, GachaPullRecord> = new Map();

  constructor() {
    // 데모 머신 등록
    this.machines.set('demo-machine', {
      machineId: 'demo-machine',
      creatorId: 'demo-creator',
      name: '레바의 고양이 뽑기',
      entries: [
        { characterDesignId: 'cat-normal', rarityLabel: '🐱 노란 고양이', probability: 0.40, rarityTier: 1 },
        { characterDesignId: 'cat-black', rarityLabel: '🐱 검은 고양이', probability: 0.30, rarityTier: 2 },
        { characterDesignId: 'cat-calico', rarityLabel: '🐱 삼색 고양이', probability: 0.20, rarityTier: 3 },
        { characterDesignId: 'cat-rainbow', rarityLabel: '🌈 무지개 고양이', probability: 0.08, rarityTier: 4 },
        { characterDesignId: 'cat-cosmic', rarityLabel: '🌌 우주 고양이', probability: 0.02, rarityTier: 5 },
      ],
      costPerPull: 100,
      ceilingEnabled: true,
      ceilingCount: 50,
      animation: { backgroundColor: '#1a1a2e', effectType: 'sparkle', soundEffect: 'default' },
    });
  }

  async pull(machineId: string, userId: string): Promise<GachaResult> {
    const config = this.machines.get(machineId);
    if (!config) throw new Error(`Machine ${machineId} not found`);

    // 천장 체크
    const recordKey = `${machineId}:${userId}`;
    let record = this.pullRecords.get(recordKey) || {
      machineId, userId, pullCount: 0, lastHighestTierPull: 0,
    };
    record.pullCount++;

    const maxTier = Math.max(...config.entries.map((e) => e.rarityTier));
    const pullsSinceHighest = record.pullCount - record.lastHighestTierPull;

    let selected: typeof config.entries[0];

    // 천장 도달 시 최고 등급 보장
    if (config.ceilingEnabled && pullsSinceHighest >= config.ceilingCount) {
      selected = config.entries.find((e) => e.rarityTier === maxTier)!;
      record.lastHighestTierPull = record.pullCount;
    } else {
      selected = weightedRandom(
        config.entries,
        config.entries.map((e) => e.probability),
      );
      if (selected.rarityTier === maxTier) {
        record.lastHighestTierPull = record.pullCount;
      }
    }

    this.pullRecords.set(recordKey, record);

    return {
      characterDesignId: selected.characterDesignId,
      rarityLabel: selected.rarityLabel,
      rarityTier: selected.rarityTier,
      stats: generateStats(),
      personality: generatePersonality(),
      traits: generateTraits(),
      instanceId: generateId(),
    };
  }

  async getMachineConfig(machineId: string): Promise<GachaMachineConfig | null> {
    return this.machines.get(machineId) || null;
  }

  async saveMachineConfig(config: GachaMachineConfig): Promise<void> {
    this.machines.set(config.machineId, config);
  }

  async getPullRecord(machineId: string, userId: string): Promise<GachaPullRecord | null> {
    return this.pullRecords.get(`${machineId}:${userId}`) || null;
  }
}
