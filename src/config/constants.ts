/** 게임 전역 상수 */

// 타일 & 그리드
export const TILE_SIZE = 48;
export const DEFAULT_SPACE_WIDTH = 16;   // 타일 단위
export const DEFAULT_SPACE_HEIGHT = 16;
export const MAX_SPACE_WIDTH = 64;
export const MAX_SPACE_HEIGHT = 64;

// 픽셀 에디터
export const EDITOR_CANVAS_SIZES = [8, 16, 24, 32, 48, 64] as const;
export const DEFAULT_CANVAS_SIZE = 16;
export const EDITOR_LAYER_COUNT = 4;
export const EDITOR_LAYER_NAMES = ['몸체', '얼굴', '악세서리', '이펙트'] as const;

// 캐릭터 스탯
export const STAT_MIN = 1;
export const STAT_MAX = 100;
export const STAT_NAMES = ['str', 'dex', 'int', 'cha', 'luk'] as const;
export const PERSONALITIES = ['활발한', '수줍은', '지적인', '장난꾸러기', '다정한'] as const;

// 가챠
export const GACHA_MIN_COST = 10;
export const GACHA_MAX_COST = 1000;
export const GACHA_DEFAULT_CEILING = 100;

// 화폐
export const STARTING_CURRENCY = 500;
export const DAILY_FREE_CURRENCY = 100;

// 게임 화면
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

// 캐릭터 행동 AI
export const AI_ACTION_INTERVAL_MIN = 3000; // ms
export const AI_ACTION_INTERVAL_MAX = 8000;
