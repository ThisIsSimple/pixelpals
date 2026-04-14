import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { Toast } from '../common/Toast';
import { useUIStore } from '../../stores/useUIStore';

/**
 * GameLayout — 전체 앱 레이아웃
 *
 * 상단 NavBar + 중앙 콘텐츠 영역(Outlet) + 토스트 알림.
 * 모든 페이지가 이 레이아웃 안에서 렌더링된다.
 */
export const GameLayout: React.FC = () => {
  const toastMessage = useUIStore((s) => s.toastMessage);

  return (
    <div className="w-full h-screen bg-pixel-bg flex flex-col overflow-hidden">
      {/* 상단 네비게이션 */}
      <NavBar />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* 글로벌 토스트 */}
      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
};
