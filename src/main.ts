/**
 * PixelPals — 메인 엔트리 포인트
 *
 * v0.2.0: React SPA가 앱 전체를 관리한다.
 * Phaser는 SpacePage/DungeonPage에서만 PhaserGame 컴포넌트로 마운트된다.
 */

import { createRoot } from 'react-dom/client';
import React from 'react';
import { App } from './ui/App';
import './styles.css';

// ── React SPA 초기화 ──
const rootEl = document.getElementById('app');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(React.createElement(App));
}

// ── HMR (Hot Module Replacement) ──
if (import.meta.hot) {
  import.meta.hot.accept();
}
