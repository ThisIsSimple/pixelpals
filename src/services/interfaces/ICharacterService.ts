import type { CharacterDesign, CharacterInstance } from '../../types/character';

/** 캐릭터 서비스 인터페이스 */
export interface ICharacterService {
  /** 캐릭터 설계 저장 (에디터에서 생성) */
  saveDesign(design: CharacterDesign): Promise<void>;

  /** 캐릭터 설계 조회 */
  getDesign(designId: string): Promise<CharacterDesign | null>;

  /** 내가 만든 설계 목록 */
  getMyDesigns(creatorId: string): Promise<CharacterDesign[]>;

  /** 캐릭터 인스턴스 저장 (뽑기/획득 시) */
  saveInstance(instance: CharacterInstance): Promise<void>;

  /** 보유 캐릭터 목록 */
  getMyInstances(ownerId: string): Promise<CharacterInstance[]>;

  /** 캐릭터 인스턴스 삭제 (분해 시) */
  deleteInstance(instanceId: string): Promise<void>;
}
