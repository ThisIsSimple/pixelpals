import React from 'react';
import { useGameStore } from '../../stores/useGameStore';

interface Props {
  onClose: () => void;
}

/**
 * CollectionPlaceholder — 수집 도감
 * Phase C5에서 완전한 도감 UI로 확장
 */
export const CollectionPlaceholder: React.FC<Props> = ({ onClose }) => {
  const ownedCharacters = useGameStore((s) => s.ownedCharacters);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Galmuri11, monospace',
        color: '#eaeaea',
        padding: '16px',
      }}
    >
      {/* 헤더 */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '16px', color: '#ffd700' }}>📖 수집 도감</span>
        <button onClick={onClose} style={{
          fontFamily: 'Galmuri11', fontSize: '13px',
          backgroundColor: '#e94560', color: '#fff', border: 'none',
          padding: '6px 12px', cursor: 'pointer',
        }}>
          ✕ 닫기
        </button>
      </div>

      {/* 통계 */}
      <div style={{ fontSize: '12px', color: '#8a8a9a', marginBottom: '16px' }}>
        수집한 캐릭터: {ownedCharacters.length}체
      </div>

      {/* 캐릭터 목록 */}
      {ownedCharacters.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#5f574f', fontSize: '13px',
        }}>
          아직 수집한 캐릭터가 없습니다.<br />
          가챠를 돌리거나 모험을 떠나보세요!
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {ownedCharacters.map((char) => (
            <div
              key={char.instanceId}
              style={{
                backgroundColor: '#16213e',
                border: '2px solid #0f3460',
                padding: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#e94560', marginBottom: '4px' }}>
                {char.designId}
              </div>
              <div style={{ fontSize: '11px', color: '#c2c3c7', marginBottom: '4px' }}>
                성격: {char.personality}
              </div>
              <div style={{ fontSize: '11px', color: '#eaeaea' }}>
                STR {char.stats.str} | DEX {char.stats.dex} | INT {char.stats.int}
              </div>
              <div style={{ fontSize: '11px', color: '#eaeaea' }}>
                CHA {char.stats.cha} | LUK {char.stats.luk}
              </div>
              <div style={{ fontSize: '11px', color: '#ffa300', marginTop: '4px' }}>
                {char.traits.join(', ')}
              </div>
              <div style={{ fontSize: '11px', color: '#5f574f', marginTop: '4px' }}>
                획득: {char.obtainedFrom} | {new Date(char.obtainedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
