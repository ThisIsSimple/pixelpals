import React from 'react';
import { EditorPlaceholder } from '../panels/EditorPlaceholder';
import { useNavigate } from 'react-router-dom';

/**
 * EditorPage — 픽셀 에디터 전체 화면 페이지
 *
 * 기존 오버레이 방식에서 독립 페이지로 전환.
 * EditorPlaceholder를 페이지 콘텐츠로 렌더링한다.
 */
export const EditorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full">
      <EditorPlaceholder onClose={() => navigate('/')} />
    </div>
  );
};
