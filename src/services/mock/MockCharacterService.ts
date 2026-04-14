import type { ICharacterService } from '../interfaces/ICharacterService';
import type { CharacterDesign, CharacterInstance } from '../../types/character';

/** 로컬 mock 캐릭터 서비스 */
export class MockCharacterService implements ICharacterService {
  private designs: Map<string, CharacterDesign> = new Map();
  private instances: Map<string, CharacterInstance> = new Map();

  async saveDesign(design: CharacterDesign): Promise<void> {
    this.designs.set(design.id, design);
  }

  async getDesign(designId: string): Promise<CharacterDesign | null> {
    return this.designs.get(designId) || null;
  }

  async getMyDesigns(creatorId: string): Promise<CharacterDesign[]> {
    return Array.from(this.designs.values()).filter((d) => d.creatorId === creatorId);
  }

  async saveInstance(instance: CharacterInstance): Promise<void> {
    this.instances.set(instance.instanceId, instance);
  }

  async getMyInstances(ownerId: string): Promise<CharacterInstance[]> {
    return Array.from(this.instances.values()).filter((i) => i.ownerId === ownerId);
  }

  async deleteInstance(instanceId: string): Promise<void> {
    this.instances.delete(instanceId);
  }
}
