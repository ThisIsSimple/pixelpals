import type { GachaMachineConfig, GachaResult, GachaPullRecord } from '../../types/gacha';

/** 가챠 서비스 인터페이스 — Mock/API 공통 */
export interface IGachaService {
  /** 가챠 1회 뽑기 */
  pull(machineId: string, userId: string): Promise<GachaResult>;

  /** 가챠 머신 설정 조회 */
  getMachineConfig(machineId: string): Promise<GachaMachineConfig | null>;

  /** 가챠 머신 설정 저장 (크리에이터용) */
  saveMachineConfig(config: GachaMachineConfig): Promise<void>;

  /** 뽑기 기록 조회 (천장 카운트용) */
  getPullRecord(machineId: string, userId: string): Promise<GachaPullRecord | null>;
}
