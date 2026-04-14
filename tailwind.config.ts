import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['Galmuri11', 'monospace'],
      },
      fontSize: {
        // Galmuri11 전용 크기 체계
        'pixel-xs':   ['11px', { lineHeight: '1.6' }],   // 보조 텍스트, 날짜, ID
        'pixel-sm':   ['13px', { lineHeight: '1.6' }],   // 설명, 라벨
        'pixel-base': ['15px', { lineHeight: '1.6' }],   // 본문, 버튼
        'pixel-lg':   ['18px', { lineHeight: '1.5' }],   // 소제목, 강조
        'pixel-xl':   ['22px', { lineHeight: '1.4' }],   // 페이지 제목
        'pixel-2xl':  ['28px', { lineHeight: '1.3' }],   // 메인 타이틀
      },
      colors: {
        pixel: {
          bg: '#1a1a2e',
          surface: '#16213e',
          primary: '#0f3460',
          accent: '#e94560',
          text: '#eaeaea',
          muted: '#8a8a9a',
          gold: '#ffd700',
          green: '#4ade80',
          blue: '#60a5fa',
          purple: '#a78bfa',
        },
      },
      animation: {
        'bounce-pixel': 'bounce-pixel 0.6s ease-in-out infinite',
        'pop-in': 'pop-in 0.3s ease-out',
      },
      keyframes: {
        'bounce-pixel': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
