import type { SpaceConfig, VisitRecord } from '../../types/space';

/** 공간 서비스 인터페이스 */
export interface ISpaceService {
  /** 공간 설정 저장 */
  saveSpace(config: SpaceConfig): Promise<void>;

  /** 공간 설정 로드 */
  getSpace(ownerId: string): Promise<SpaceConfig | null>;

  /** 방문 기록 저장 */
  recordVisit(record: VisitRecord): Promise<void>;

  /** 방문 기록 조회 */
  getVisits(spaceOwnerId: string): Promise<VisitRecord[]>;
}
