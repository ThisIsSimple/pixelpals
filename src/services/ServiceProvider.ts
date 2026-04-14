/**
 * ServiceProvider — 서비스 주입 포인트
 *
 * 백엔드 연동 시 이 파일의 import만 바꾸면 전체 전환 완료.
 * Mock → Api 구현체로 교체하는 유일한 지점.
 */

import { MockGachaService } from './mock/MockGachaService';
import { MockCharacterService } from './mock/MockCharacterService';
import { MockCurrencyService } from './mock/MockCurrencyService';
import type { IGachaService } from './interfaces/IGachaService';
import type { ICharacterService } from './interfaces/ICharacterService';
import type { ICurrencyService } from './interfaces/ICurrencyService';

// ┌─────────────────────────────────────┐
// │  🔄 백엔드 연동 시 여기만 변경!       │
// │  import { ApiGachaService } from ... │
// │  export const gachaService = new ... │
// └─────────────────────────────────────┘

export const gachaService: IGachaService = new MockGachaService();
export const characterService: ICharacterService = new MockCharacterService();
export const currencyService: ICurrencyService = new MockCurrencyService();
