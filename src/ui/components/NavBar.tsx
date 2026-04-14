import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useGameStore } from '../../stores/useGameStore';

const NAV_ITEMS = [
  { path: '/', label: '🏠 홈', exact: true },
  { path: '/editor', label: '🎨 에디터' },
  { path: '/space', label: '🌍 내 공간' },
  { path: '/gacha', label: '🎰 가챠' },
  { path: '/collection', label: '📖 도감' },
] as const;

/**
 * NavBar — 상단 네비게이션 바
 */
export const NavBar: React.FC = () => {
  const location = useLocation();
  const currency = useGameStore((s) => s.currency);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="h-12 bg-pixel-surface border-b-2 border-pixel-primary flex items-center px-4 shrink-0 z-50">
      {/* 로고 */}
      <Link
        to="/"
        className="font-pixel text-pixel-accent text-pixel-base mr-6 hover:opacity-80 transition-opacity"
      >
        PixelPals
      </Link>

      {/* 메뉴 */}
      <div className="flex gap-1 flex-1">
        {NAV_ITEMS.map(({ path, label, ...rest }) => (
          <Link
            key={path}
            to={path}
            className={`
              font-pixel text-pixel-xs px-3 py-1.5 transition-all duration-100
              ${isActive(path, 'exact' in rest ? rest.exact : undefined)
                ? 'bg-pixel-accent text-white'
                : 'text-pixel-muted hover:text-pixel-text hover:bg-pixel-primary'
              }
            `}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* 화폐 표시 */}
      <div className="font-pixel text-pixel-gold text-pixel-sm flex items-center gap-2">
        <img
          src="/assets/vector-icon-pack/Currency/Coin/Coin 64.png"
          alt="코인"
          className="w-5 h-5"
          style={{ imageRendering: 'auto' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <span>{currency.toLocaleString()}</span>
      </div>
    </nav>
  );
};
