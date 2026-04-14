import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameLayout } from './layouts/GameLayout';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { GachaPage } from './pages/GachaPage';
import { CollectionPage } from './pages/CollectionPage';
import { SpacePage } from './pages/SpacePage';
import { DungeonPage } from './pages/DungeonPage';

/**
 * App — React SPA 루트
 *
 * v0.2.0 아키텍처: React Router가 앱 전체 네비게이션을 담당.
 * Phaser는 SpacePage/DungeonPage에서만 마운트되는 임베드 방식.
 *
 * 딥링크 지원:
 *   /                  → 메인 메뉴
 *   /editor            → 픽셀 에디터
 *   /gacha             → 가챠 뽑기
 *   /collection        → 수집 도감
 *   /space             → 내 공간 (Phaser)
 *   /space/:userId     → 다른 유저 공간 방문 (Phaser)
 *   /dungeon/:dungeonId → 던전 입장 (Phaser, 예정)
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GameLayout />}>
          <Route index element={<HomePage />} />
          <Route path="editor" element={<EditorPage />} />
          <Route path="gacha" element={<GachaPage />} />
          <Route path="collection" element={<CollectionPage />} />
        </Route>

        {/* Phaser 게임 월드 페이지는 NavBar 없이 풀스크린 */}
        <Route path="space" element={<SpacePage />} />
        <Route path="space/:userId" element={<SpacePage />} />
        <Route path="dungeon" element={<DungeonPage />} />
        <Route path="dungeon/:dungeonId" element={<DungeonPage />} />
      </Routes>
    </BrowserRouter>
  );
};
