# PixelPals — 프로젝트 인스트럭션

## 아키텍처 — React SPA + Phaser 임베드

### 핵심 원칙: "React가 앱, Phaser는 게임 월드 렌더러"

이 프로젝트는 **React SPA(Single Page Application)**가 전체 앱을 관리하고,
**Phaser는 게임 월드가 필요한 페이지에서만 마운트**되는 구조다.

```
React Router (앱 전체 네비게이션)
├── /              → HomePage (React)
├── /editor        → EditorPage (React + Canvas)
├── /gacha         → GachaPage (React + Framer Motion)
├── /collection    → CollectionPage (React)
├── /space         → SpacePage (React 오버레이 + Phaser 게임 월드)
├── /space/:userId → SpacePage (다른 유저 방문)
├── /dungeon/:id   → DungeonPage (React 오버레이 + Phaser 게임 월드)
```

### Phaser 마운트 규칙

- Phaser 인스턴스는 `PhaserGame` React 컴포넌트로 생성/파괴된다 (`src/ui/components/PhaserGame.tsx`)
- **SpacePage**, **DungeonPage**에서만 마운트 — 다른 페이지로 이동하면 자동 destroy
- 네비게이션, HUD, 모달 등 모든 UI는 React에서 처리
- Phaser ↔ React 통신은 기존과 동일하게 `EventBus`

### 파일 구조 요약

```
src/
├── main.ts               # React SPA 초기화 (Phaser 없음)
├── config/               # 상수, 팔레트
├── scenes/               # Phaser 씬 (BootScene, SpaceScene만 남음)
├── ui/
│   ├── App.tsx           # React Router 루트
│   ├── layouts/          # GameLayout (NavBar + Outlet)
│   ├── pages/            # HomePage, EditorPage, GachaPage, CollectionPage, SpacePage, DungeonPage
│   ├── components/       # PhaserGame, NavBar 등 재사용 컴포넌트
│   ├── panels/           # EditorPlaceholder 등 패널
│   └── common/           # Toast 등 공통
├── stores/               # Zustand (useGameStore, useUIStore, useEditorStore)
├── services/             # 서비스 인터페이스 + Mock 구현
├── types/                # TypeScript 타입
└── utils/                # EventBus, GridUtils, RandomGen
```

### 딥링크 지원

React Router 기반이므로 URL로 직접 접근 가능:
- `https://pixelpals.app/space/user123` → user123의 공간 방문
- `https://pixelpals.app/gacha` → 가챠 페이지
- `https://pixelpals.app/collection` → 도감 페이지

인증이 필요한 경우 React Router의 라우트 가드로 로그인 리다이렉트 처리.

---

## 아이콘 에셋 활용 가이드

프로젝트에 **5,514개의 벡터 아이콘팩**이 포함되어 있다. 게임 내에서 아이콘이 필요할 때 **반드시 여기서 먼저 찾아서 사용**할 것.

### 위치
- 에셋 폴더: `assets/vector-icon-pack/`
- 검색 인덱스: `data/icon-index.json`

### 카테고리 (15개)
| 카테고리 | 수량 | 주요 용도 |
|---------|------|----------|
| **Currency** | 172 | 코인, 젬, 인곳 → 인게임 화폐 |
| **Items** | 944 | 상자, 풍선, 책, 의자 → 가구/아이템 |
| **Weapons** | 312 | 검, 활, 방패 → 던전 장비 |
| **Tools** | 628 | 낚싯대, 망치, 열쇠 → 채집/도구 |
| **Nature** | 396 | 나무, 꽃, 불 → 공간 장식/이펙트 |
| **General** | 576 | 하트, 선물, 설정, 집 → 범용 UI |
| **UI** | 496 | 화살표, 체크, 벨 → UI 요소 |
| **Player** | 324 | 플레이어, 손, 머리 → 캐릭터 관련 |
| **Clothing** | 244 | 모자, 갑옷, 반지 → 악세서리 |
| **Materials** | 172 | 나무, 돌, 가죽 → 재료 |
| **Holiday** | 428 | 시즌/이벤트 아이템 |
| **Technology** | 274 | 컴퓨터, 폰 → 테크 요소 |
| **Shapes** | 136 | 기본 도형 |
| **Sports** | 112 | 스포츠 아이템 |
| **Transport** | 300 | 탈것 |

### 파일 규칙
- 각 아이콘은 **64px**과 **256px** 두 사이즈 제공
- 변형: `Color(기본)`, `Outline`, `Flat Black`, `Flat White`
- 색상 변형: `Blue`, `Red`, `Green`, `Yellow`, `Purple`, `Bronze`, `Silver` 등
- 경로 패턴: `assets/vector-icon-pack/{Category}/{Item}/{파일명} {Size}.png`

### 검색 방법
`data/icon-index.json`을 읽어서 `tags` 배열에 키워드 매칭으로 검색.

```
예시: "coin"으로 검색 → Currency/Coin/Coin 64.png
예시: "sword"로 검색 → Weapons/Sword/Sword 256.png
예시: "heart"로 검색 → General/Heart/Heart 64.png
```

### 사용 원칙
1. 게임 내 아이콘이 필요하면 **먼저 icon-index.json에서 검색**
2. 게임용은 **64px** 사이즈 권장 (UI/HUD), 상세 표시는 **256px**
3. 없는 아이콘만 프로시저럴 생성 또는 외부 조달

---

## UI 설계 전략 — React + Tailwind

### 레이어 분담

| 영역 | 담당 | 비고 |
|------|------|------|
| **메인 메뉴, 가챠, 도감, 에디터, 상점, 설정** | React 페이지 | React Router로 네비게이션 |
| **가챠 뽑기 연출** | React (Framer Motion) | CSS 애니메이션 + motion 컴포넌트 |
| **게임 월드** (개인 공간, 타일, 캐릭터 배치) | Phaser (SpacePage) | PhaserGame 컴포넌트로 마운트 |
| **던전 전투** (물리, 충돌, 체력바) | Phaser (DungeonPage) | PhaserGame 컴포넌트로 마운트 |
| **공간 내 말풍선, 이펙트** | Phaser | 게임 월드와 물리적으로 결합 |
| **HUD, 네비게이션, 토스트** | React (NavBar, Toast) | 모든 페이지 공통 |

### CSS 픽셀아트 스타일 규칙

```
색상 팔레트 (Tailwind custom → pixel-*):
  bg:      #1a1a2e    surface: #16213e    primary: #0f3460
  accent:  #e94560    text:    #eaeaea    muted:   #8a8a9a
  gold:    #ffd700

폰트: font-pixel ("Galmuri11")
  크기 체계 (Tailwind custom):
    text-pixel-xs:   11px  — 보조 텍스트, 날짜, ID
    text-pixel-sm:   13px  — 설명, 라벨, 버튼 보조
    text-pixel-base: 15px  — 본문, 버튼 기본
    text-pixel-lg:   18px  — 소제목, 강조
    text-pixel-xl:   22px  — 페이지 제목
    text-pixel-2xl:  28px  — 메인 타이틀
  ※ Galmuri11는 일반 폰트보다 작게 렌더되므로 이 체계를 사용할 것

테두리: border-2, rounded 없음
전환: transition-all duration-100
```

### React에서 아이콘팩 사용법

```tsx
<img
  src="/assets/vector-icon-pack/Currency/Coin/Coin 64.png"
  alt="코인"
  className="w-6 h-6 inline-block"
  style={{ imageRendering: 'auto' }}
/>
```

### Phaser에서 아이콘팩 사용법

```typescript
this.load.image('icon-coin', 'assets/vector-icon-pack/Currency/Coin/Coin 64.png');
const coin = this.add.image(x, y, 'icon-coin');
coin.setScale(0.5);
```

---

## 기술 스택
- **React 18** + React Router 6 + TypeScript + Vite
- **Phaser 3** (게임 월드 전용, PhaserGame 컴포넌트로 임베드)
- **Framer Motion** (가챠 연출, 페이지 전환 애니메이션)
- **Zustand** (상태 관리), **Dexie.js** (IndexedDB)
- **Tailwind CSS** + "Galmuri11" 픽셀 폰트
- 서비스 추상화 패턴 (Mock → API 전환 대비)

## 텍스트 선명도 규칙
- Phaser GameConfig: `pixelArt: false`, `antialias: true`, `resolution: devicePixelRatio`
- 픽셀아트 스프라이트에만 개별적으로 `texture.setFilter(NEAREST)` 적용
- index.html에 `image-rendering: pixelated` 사용하지 않음
