import type { UserProfile } from '../../types/game';

/** 유저 서비스 인터페이스 */
export interface IUserService {
  /** 현재 유저 프로필 */
  getCurrentUser(): Promise<UserProfile>;

  /** 프로필 업데이트 */
  updateProfile(profile: Partial<UserProfile>): Promise<void>;

  /** 다른 유저 프로필 조회 */
  getUser(userId: string): Promise<UserProfile | null>;
}
