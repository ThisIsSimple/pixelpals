/** 기본 16색 픽셀아트 팔레트 */

export interface Palette {
  name: string;
  colors: string[];
}

/** 기본 제공 팔레트 — 클래식 픽셀 16색 */
export const DEFAULT_PALETTE: Palette = {
  name: '클래식 16색',
  colors: [
    '#000000', // 검정
    '#1D2B53', // 다크 블루
    '#7E2553', // 다크 퍼플
    '#008751', // 다크 그린
    '#AB5236', // 브라운
    '#5F574F', // 다크 그레이
    '#C2C3C7', // 라이트 그레이
    '#FFF1E8', // 화이트
    '#FF004D', // 레드
    '#FFA300', // 오렌지
    '#FFEC27', // 옐로우
    '#00E436', // 그린
    '#29ADFF', // 블루
    '#83769C', // 라벤더
    '#FF77A8', // 핑크
    '#FFCCAA', // 피치
  ],
};

/** 추가 팔레트 프리셋 */
export const PALETTE_PRESETS: Palette[] = [
  DEFAULT_PALETTE,
  {
    name: '파스텔',
    colors: [
      '#2B2D42', '#8D99AE', '#EDF2F4', '#FFF5F5',
      '#FFB3B3', '#FFDAB9', '#FFFACD', '#C1FFC1',
      '#B0E0E6', '#C4B7EA', '#FFB6C1', '#F0E68C',
      '#98FB98', '#87CEEB', '#DDA0DD', '#FAEBD7',
    ],
  },
  {
    name: '게임보이',
    colors: [
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
      '#0F380F', '#306230', '#8BAC0F', '#9BBC0F',
    ],
  },
];

export const TRANSPARENT_COLOR = 'transparent';
