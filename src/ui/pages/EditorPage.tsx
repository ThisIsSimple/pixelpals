import React from 'react';
import { EditorLayout } from '../editor/EditorLayout';
import { useNavigate } from 'react-router-dom';

/**
 * EditorPage — 픽셀 에디터 전체 화면 페이지
 *
 * EditorLayout이 모든 에디터 서브컴포넌트를 조합하여 렌더링한다.
 */
export const EditorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full">
      <EditorLayout onClose={() => navigate('/')} />
    </div>
  );
};
