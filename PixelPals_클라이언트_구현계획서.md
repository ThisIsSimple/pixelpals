# PixelPals — 클라이언트 구현 계획서 v1.2

> **웹 기반 클라이언트 우선 설계 — 백엔드 연동 전 단계**

---

## 1. 설계 원칙

이 계획서는 "백엔드 없이도 클라이언트 단독으로 동작하는 프로토타입"을 목표로 한다. 서버가 붙기 전까지는 로컬 스토리지와 목(mock) 데이터로 전체 게임 플로우를 구현하고, 이후 API 연동 시 서비스 레이어만 교체하는 구조를 취한다.

**핵심 원칙:**

- **서비스 추상화:** 모든 데이터 접근을 Service 인터페이스로 감싸서, mock → real API 전환이 한 줄 변경으로 가능하도록 설계
- **데이터 주도 설계:** 캐릭터, 가챠 테이블, 공간 배치 등 게임 콘텐츠는 JSON으로 분리하여 코드와 독립
- **React SPA 주도 + Phaser 임베드:** React Router가 앱 전체를 관리하고, Phaser는 게임 월드(공간/던전)에서만 마운트되는 임베드 방식
- **UI는 React + Tailwind CSS 코드 기반:** 이미지 슬라이싱 없이 CSS로 픽셀아트 느낌을 구현하고, 아이콘팩 PNG로 시각적 퀄리티를 확보
- **딥링크 지원:** React Router 기반 URL 라우팅으로 특정 공간/가챠/도감에 직접 접근 가능
- **렌더링 하이브리드:** 전역 pixelArt: false로 텍스트를 선명하게 유지하고, 픽셀아트 텍스처에만 개별 NEAREST 필터 적용

---

## 2. 기술 스택

| 영역 | 기술 | 역할 |
|------|------|------|
| **앱 프레임워크** | React 18 + React Router 6 | SPA 전체 관리, 페이지 라우팅, 딥링크 |
| **게임 엔진** | Phaser 3 + TypeScript | 2D 게임 월드 렌더링 (공간/던전 전용, PhaserGame 컴포넌트로 임베드) |
| **애니메이션** | Framer Motion | 가챠 연출, 페이지 전환, UI 애니메이션 |
| **픽셀 에디터** | Konva.js + OffscreenCanvas | 레이어 기반 픽셀 드로잉 엔진 |
| **빌드 도구** | Vite 6 | HMR, 번들링, SPA 폴백 |
| **상태 관리** | Zustand | 경량 전역 상태 (인벤토리, 유저 데이터) |
| **로컬 저장** | IndexedDB (Dexie.js) | 백엔드 연동 전 로컬 데이터 영속화 |
| **스타일** | Tailwind CSS | UI 컴포넌트 스타일링 |
| **입력 통합** | Pointer Events API | 마우스/터치 통합 처리 |

---

## 3. 에셋 전략 — 벡터 아이콘팩 활용

### 3.1 아이콘팩 개요

프로젝트에 **5,514개 벡터 스타일 아이콘** (15개 카테고리)이 포함되어 있다.
코인, 젬, 검, 방패, 상자, 열쇠, 하트, 왕관, 낚싯대 등 게임에 즉시 사용 가능한 에셋이 풍부하다.

- **위치:** `assets/vector-icon-pack/`
- **인덱스:** `data/icon-index.json` (태그 기반 검색 가능)
- **사이즈:** 각 아이콘 64px + 256px 제공
- **변형:** Color(기본), Outline, Flat Black, Flat White + 색상 변형(Blue, Red, Green 등)

### 3.2 용도별 에셋 매핑

| 게임 요소 | 아이콘팩 카테고리 | 예시 |
|----------|-----------------|------|
| 인게임 화폐 | Currency | Coin, Gem, Star Gem |
| 가챠 보상 표시 | Items + Weapons | Chest, Sword, Shield |
| 공간 가구/장식 | Items + Nature | Chair, Bonfire, Flower, Cactus |
| 던전 장비 | Weapons + Clothing | Axe, Bow, Chestplate, Helmet |
| 채집/낚시 도구 | Tools | Fishing Rod, Hammer, Key |
| 재료 아이템 | Materials | Wood, Rock, Leather, Ore |
| HUD/UI 아이콘 | General + UI | Heart, Settings, Arrow, Bell |
| 캐릭터 악세서리 | Clothing | Crown, Ring, Glasses, Cap |
| 퀘스트/이벤트 | Holiday + General | Gift Box, Daily Rewards |
| 감정 이펙트 | General + Nature | Heart, Lightning Bolt, Fire, Bubble |

### 3.3 사용 원칙

1. 게임 내 아이콘이 필요하면 **먼저 `data/icon-index.json`에서 태그 검색**
2. Phaser 씬에서는 64px을 `this.load.image()`로 로드, 필요시 `setScale()`로 조절
3. React UI에서는 `<img src="..." className="w-6 h-6" />`로 인라인 사용
4. 없는 아이콘만 프로시저럴 생성

---

## 4. UI 전략 — React SPA + Phaser 임베드

### 4.1 핵심 결정: React가 앱, Phaser는 게임 월드 렌더러

**React Router가 앱 전체 네비게이션을 관리**하고, Phaser는 게임 월드가 필요한 페이지에서만
PhaserGame 컴포넌트를 통해 마운트/디스트로이되는 구조다.

**이 결정의 이유:**
- 메인 메뉴, 에디터, 가챠, 도감 등 대부분의 화면은 전형적인 웹 UI → React가 압도적으로 유리
- React Router로 URL 기반 딥링크 지원 (예: `/space/user123`으로 직접 방문)
- Phaser는 타일맵, 물리 충돌, 캐릭터 AI 이동 등 게임 월드에만 집중
- 가챠 연출도 Framer Motion + CSS 애니메이션으로 충분히 화려하게 가능

### 4.2 페이지 라우팅 구조

```
React Router (BrowserRouter)
│
├── GameLayout (NavBar + Outlet)
│   ├── /              → HomePage      메인 메뉴 (카드 그리드)
│   ├── /editor        → EditorPage    픽셀 에디터 (Canvas + React UI)
│   ├── /gacha         → GachaPage     가챠 뽑기 (Framer Motion 연출)
│   └── /collection    → CollectionPage 수집 도감 (그리드 + 상세 패널)
│
├── /space             → SpacePage     내 공간 (React 오버레이 + Phaser)
├── /space/:userId     → SpacePage     다른 유저 공간 방문
├── /dungeon/:id       → DungeonPage   던전 입장 (React 오버레이 + Phaser)
```

### 4.3 Phaser 마운트 규칙

- `PhaserGame` React 컴포넌트 (`src/ui/components/PhaserGame.tsx`)가 Phaser 인스턴스 생성/파괴
- **SpacePage**, **DungeonPage**에서만 마운트 — 다른 페이지로 이동하면 자동 destroy
- 네비게이션 버튼, HUD 등은 Phaser 위에 React로 오버레이 (absolute positioning)
- Phaser ↔ React 통신은 EventBus 유지

### 4.4 가챠 연출 — Framer Motion 기반

기존 GachaScene(Phaser)에서 React GachaPage로 전환:

| 연출 | 구현 방식 |
|------|----------|
| 머신 흔들림 | Framer Motion `animate={{ rotate: [-3, 3, ...] }}` |
| 플래시 효과 | `<motion.div>` opacity 0.9 → 0, 등급별 배경색 |
| 결과 카드 등장 | `<motion.div>` scale 0 → 1, spring 물리 |
| 파티클 (추후) | tsparticles 라이브러리 또는 CSS keyframe |

### 4.5 CSS 디자인 토큰 (픽셀아트 느낌)

```
색상 팔레트 (Tailwind custom — pixel-*):
  bg:      #1a1a2e    surface: #16213e    primary: #0f3460
  accent:  #e94560    text:    #eaeaea    muted:   #8a8a9a
  gold:    #ffd700    green:   #4ade80    blue:    #60a5fa
  purple:  #a78bfa

폰트: "Press Start 2P" 전용, 사이즈 7/8/10/12/14px 단계
테두리: 2~3px solid, rounded-none (라운드 없음)
그림자: box-shadow 픽셀 계단 (예: 3px 3px 0 #000)
전환: transition-all duration-100 (빠르고 반응적)
hover: 색상 변경 + scale 1.02~1.05
```

### 4.6 공통 UI 컴포넌트 설계

| 컴포넌트 | 설명 | 아이콘팩 사용 |
|---------|------|-------------|
| **NavBar** | 상단 네비게이션 (React Router Link, 화폐 표시) | 코인 아이콘 |
| **PixelButton** | 픽셀아트 스타일 버튼 (box-shadow 계단, hover 색변환) | 버튼 내 아이콘 (선택적) |
| **PixelPanel** | 패널/카드 (border 2px, bg-surface) | 헤더 영역 아이콘 |
| **PixelModal** | 오버레이 모달 (backdrop blur) | 타이틀 아이콘 |
| **IconBadge** | 아이콘 + 숫자 배지 (코인×100 등) | 코인, 젬 아이콘 |
| **StatBar** | 스탯 수치 막대 (STR, DEX 등) | - |
| **ItemSlot** | 인벤토리 슬롯 (드래그 가능) | 아이템 아이콘 256px |
| **Toast** | 토스트 메시지 (획득, 알림) | 관련 아이콘 (선택적) |

### 4.7 Phaser가 담당하는 인게임 요소

게임 월드 좌표에 결합된 것만 Phaser에서 처리:

- 타일맵 렌더링, 캐릭터 AI 이동, 물리 충돌
- 던전 전투 UI (체력바, 데미지 숫자 팝업, 콤보 카운터)
- 공간 내 말풍선, 감정 이펙트 (하트, 느낌표)
- 캐릭터 위 이름표/상태 표시
- 미니게임 인터랙션 (채집 타이밍 게이지, 낚시 균형 바)

---

## 5. 프로젝트 구조

```
pixelpals/
├── src/
│   ├── main.ts                    # React SPA 엔트리 (Phaser 없음)
│   ├── config/
│   │   ├── constants.ts           # 타일 크기, 캔버스 크기, 게임 상수
│   │   └── palette.ts             # 기본 16색 팔레트 정의
│   │
│   ├── scenes/                    # Phaser 씬 (게임 월드 전용)
│   │   ├── BootScene.ts           # 에셋 로딩 → SpaceScene 전환
│   │   ├── SpaceScene.ts          # 개인 공간 (타일맵 월드)
│   │   ├── DungeonScene.ts        # 던전 탐험 (추후 구현)
│   │   └── GatheringScene.ts      # 채집/낚시 미니게임 (추후 구현)
│   │   # ❌ 삭제됨: MainMenuScene, GachaScene, UIOverlayScene → React로 이동
│   │
│   ├── ui/                        # ★ React SPA 전체
│   │   ├── App.tsx                # React Router 루트 (BrowserRouter + Routes)
│   │   ├── layouts/
│   │   │   └── GameLayout.tsx     # NavBar + Outlet + Toast
│   │   ├── pages/                 # ★ 페이지 컴포넌트 (React Router)
│   │   │   ├── HomePage.tsx       # / → 메인 메뉴 (카드 그리드)
│   │   │   ├── EditorPage.tsx     # /editor → 픽셀 에디터
│   │   │   ├── GachaPage.tsx      # /gacha → 가챠 뽑기 (Framer Motion)
│   │   │   ├── CollectionPage.tsx # /collection → 수집 도감
│   │   │   ├── SpacePage.tsx      # /space/:userId → Phaser 게임 월드 마운트
│   │   │   └── DungeonPage.tsx    # /dungeon/:id → Phaser 게임 월드 마운트
│   │   ├── components/
│   │   │   ├── PhaserGame.tsx     # ★ Phaser 인스턴스 래퍼 (마운트/디스트로이)
│   │   │   └── NavBar.tsx         # 상단 네비게이션 (Link + 화폐)
│   │   ├── panels/
│   │   │   ├── EditorPlaceholder.tsx # 픽셀 에디터 (Canvas 기반)
│   │   │   └── ...                # GachaSetupPanel, SpaceEditPanel 등
│   │   └── common/
│   │       └── Toast.tsx          # 토스트 메시지
│   │
│   ├── editor/                    # 픽셀 에디터 엔진 (React)
│   │   └── (Canvas/, Tools/, Palette/, Animation/, Templates/)
│   │
│   ├── entities/                  # Phaser 게임 오브젝트
│   │   └── (PixelCharacter, GachaMachine, Furniture, NPC)
│   │
│   ├── systems/                   # 게임 시스템
│   │   └── (AnimationSystem, InventorySystem, DungeonSystem 등)
│   │
│   ├── services/                  # 서비스 추상화 레이어
│   │   ├── interfaces/            # IGachaService, ICharacterService 등
│   │   ├── mock/                  # 로컬 mock 구현
│   │   └── api/                   # 실제 API 구현 (백엔드 연동 시)
│   │
│   ├── stores/                    # Zustand 상태 저장소
│   │   ├── useGameStore.ts        # 게임 전역 상태 (화폐, 캐릭터)
│   │   ├── useEditorStore.ts      # 에디터 상태
│   │   └── useUIStore.ts          # UI 상태 (토스트 등)
│   │
│   ├── utils/
│   │   ├── EventBus.ts            # Phaser ↔ React 이벤트 통신
│   │   ├── GridUtils.ts           # 타일/월드 좌표 변환
│   │   └── RandomGen.ts           # 스탯/성격 랜덤 생성
│   │
│   └── types/                     # TypeScript 타입 정의
│       ├── character.ts, gacha.ts, space.ts, editor.ts, game.ts
│
├── data/
│   └── icon-index.json            # ★ 아이콘팩 검색 인덱스 (5,514개)
│
├── assets/
│   └── vector-icon-pack/          # ★ 5,514개 벡터 아이콘 (15 카테고리)
│
├── index.html                     # React SPA 단일 엔트리
├── package.json                   # react-router-dom, framer-motion 추가
├── tsconfig.json
├── vite.config.ts                 # SPA 폴백 설정
└── tailwind.config.ts
```

---

## 6. 핵심 아키텍처 설계

### 6.1 React SPA + Phaser 임베드 구조

**React Router가 앱 전체를 관리**하고, Phaser는 게임 월드가 필요한 페이지에서만 마운트된다.

```
┌─────────────────────────────────────────────┐
│              React SPA (전체 앱)              │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │    React Router (BrowserRouter)      │    │
│  │    ┌─ / (HomePage)         ← React   │    │
│  │    ├─ /editor              ← React   │    │
│  │    ├─ /gacha               ← React   │    │
│  │    ├─ /collection          ← React   │    │
│  │    ├─ /space/:userId       ← React + │    │
│  │    │   └─ PhaserGame 컴포넌트 마운트   │    │
│  │    └─ /dungeon/:id         ← React + │    │
│  │        └─ PhaserGame 컴포넌트 마운트   │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │         Zustand Store                │    │
│  │  (공유 상태: 인벤토리, 화폐, 유저)      │    │
│  └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**EventBus 통신 예시 (SpacePage에서):**

```typescript
// React → Phaser: 편집 모드 토글
EventBus.emit('space:toggleEdit', true);

// Phaser → React: 편집 모드 상태 알림
EventBus.on('space:editModeChanged', (mode) => setIsEditMode(mode));

// React → Phaser: 공간에 가구 배치 요청
EventBus.emit('space:placeFurniture', { id, gridX, gridY });
```

### 6.2 서비스 추상화 패턴

백엔드 연동 전환을 한 줄로 처리하기 위한 핵심 구조.

```typescript
// 인터페이스 정의
interface IGachaService {
  pull(machineId: string): Promise<GachaResult>;
  getMachineConfig(machineId: string): Promise<GachaMachineConfig>;
  setMachineConfig(config: GachaMachineConfig): Promise<void>;
}

// Mock 구현 (클라이언트 단독)
class MockGachaService implements IGachaService {
  async pull(machineId: string): Promise<GachaResult> {
    const config = await this.getMachineConfig(machineId);
    const result = this.calculateRandom(config.probabilityTable);
    const stats = CharacterStatGen.generate();
    await localDB.characters.add({ ...result, ...stats });
    return { character: result, stats };
  }
}

// 실제 API 구현 (백엔드 연동 시)
class ApiGachaService implements IGachaService {
  async pull(machineId: string): Promise<GachaResult> {
    return fetch('/api/gacha/pull', {
      method: 'POST',
      body: JSON.stringify({ machineId, nonce: generateNonce() })
    }).then(r => r.json());
  }
}

// 서비스 주입 — 이 한 줄만 바꾸면 전환 완료
export const gachaService: IGachaService = new MockGachaService();
// export const gachaService: IGachaService = new ApiGachaService();
```

### 6.3 페이지 네비게이션 플로우

```
React Router (BrowserRouter)
    │
    ├──→ / (HomePage)              ← 메인 메뉴 카드 그리드
    │       Link로 페이지 전환
    │
    ├──→ /editor (EditorPage)      ← 픽셀 에디터 (Canvas + React UI)
    │       캐릭터 저장 → / 로 navigate
    │
    ├──→ /gacha (GachaPage)        ← 가챠 뽑기 (Framer Motion 연출)
    │       결과 수집 → Zustand에 캐릭터 추가
    │
    ├──→ /collection (CollectionPage) ← 수집 도감 (그리드 + 상세)
    │
    ├──→ /space (SpacePage)        ← PhaserGame 마운트
    │   └── /space/:userId         ← 다른 유저 공간 방문
    │       BootScene → SpaceScene
    │       React 오버레이: 홈 버튼, 편집 토글
    │       EventBus로 Phaser ↔ React 통신
    │
    └──→ /dungeon/:id (DungeonPage) ← PhaserGame 마운트 (추후)
        BootScene → DungeonScene
        React 오버레이: 전투 UI

* NavBar: GameLayout 내의 모든 페이지에 공통 표시 (Space/Dungeon은 제외)
* Phaser는 Space/Dungeon 페이지 진입 시 생성, 이탈 시 자동 destroy
```

---

## 7. 모듈별 상세 구현 계획

### 7.1 픽셀 에디터 — 최우선 구현 모듈

기획서에서 "가장 중요한 기능"으로 명시된 핵심 모듈. React + Konva.js로 구현한다.

**구현 단계:**

| 순서 | 기능 | 세부 내용 | 예상 공수 |
|------|------|----------|----------|
| 1 | 캔버스 기본 | 16x16 그리드 렌더링, 줌/팬, 그리드 토글 | 2일 |
| 2 | 기본 도구 | 연필, 지우개, 스포이드 (Pointer Events 기반) | 2일 |
| 3 | 팔레트 시스템 | 16색 기본 팔레트, 색상 선택, 커스텀 팔레트 저장 | 1일 |
| 4 | 레이어 시스템 | 4레이어(몸체/얼굴/악세서리/이펙트), 표시/숨김, 순서 변경 | 2일 |
| 5 | 고급 도구 | 채우기(FloodFill), 선, 사각형, 원, 선택/이동 | 3일 |
| 6 | 편의 기능 | Undo/Redo(Command 패턴), 좌우 대칭, 복사/붙여넣기 | 2일 |
| 7 | 캔버스 크기 | 24x24, 32x32 지원 | 0.5일 |
| 8 | 애니메이션 편집 | 프레임 타임라인, 어니언 스킨, 실시간 미리보기 | 3일 |
| 9 | 템플릿 시스템 | 기본 템플릿 갤러리 (고양이, 강아지, 로봇 등) | 1일 |
| 10 | 내보내기 | 스프라이트 시트 생성, Phaser 호환 포맷 출력 | 1일 |

**Undo/Redo — Command 패턴:**

```typescript
interface EditorCommand {
  execute(): void;
  undo(): void;
}

class DrawPixelCommand implements EditorCommand {
  constructor(
    private layer: number,
    private x: number,
    private y: number,
    private newColor: string,
    private oldColor: string
  ) {}
  execute() { setPixel(this.layer, this.x, this.y, this.newColor); }
  undo() { setPixel(this.layer, this.x, this.y, this.oldColor); }
}
```

**스프라이트 내보내기 흐름:**

```
에디터 4레이어 → 레이어 병합(flatten) → OffscreenCanvas에 렌더링
  → 프레임이 여러 개면 스프라이트 시트로 합성
  → PNG Blob 생성 → IndexedDB에 저장
  → Phaser에서 동적 텍스처로 로드
```

### 7.2 캐릭터 시스템

**타입 정의:**

```typescript
interface CharacterDesign {
  id: string;
  name: string;
  creatorId: string;
  rarity: string;              // 크리에이터가 정한 등급명
  description: string;
  spriteSheet: Uint8Array;     // PNG 바이너리
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  canvasSize: 16 | 24 | 32;
}

interface CharacterInstance {
  instanceId: string;
  designId: string;
  ownerId: string;
  personality: Personality;     // 랜덤
  stats: CharacterStats;       // 랜덤
  traits: string[];            // 1~2개 랜덤
  colorVariant?: PaletteSwap;  // 선택적 색상 변이
  obtainedAt: number;
  obtainedFrom: 'gacha' | 'dungeon' | 'gathering' | 'quest' | 'trade';
}

interface CharacterStats {
  str: number;  // 1~100
  dex: number;
  int: number;
  cha: number;
  luk: number;
}

type Personality = '활발한' | '수줍은' | '지적인' | '장난꾸러기' | '다정한';
```

**코드 기반 기본 애니메이션 (AnimationSystem):**

기획서에 명시된 7가지 기본 움직임을 Phaser Tween으로 구현한다.

| 애니메이션 | 구현 방식 |
|-----------|----------|
| 좌우 플립 | `sprite.setFlipX(direction < 0)` |
| 통통 바운스 | update()에서 `y += Math.sin(time * bounceSpeed) * amplitude` |
| 아이들 흔들림 | Tween: x ±1~2px 반복, yoyo: true |
| 등장 팝 | Tween: scale 0→1.2→1.0, ease: 'Back.easeOut' |
| 감정 이펙트 | Particle Emitter (하트, 눈물, 연기) + 말풍선 스프라이트 |
| 상호작용 말풍선 | 근접 감지 시 말풍선 스프라이트 표시 |
| 수면 | 반투명 오버레이 + "zzZ" 텍스트 파티클 |

### 7.3 가챠 시스템

**크리에이터 설정 데이터:**

```typescript
interface GachaMachineConfig {
  machineId: string;
  creatorId: string;
  name: string;
  entries: GachaEntry[];       // 등록된 캐릭터 + 확률
  costPerPull: number;         // 1회 비용
  ceilingEnabled: boolean;     // 천장 시스템 ON/OFF
  ceilingCount?: number;       // N회 이내 최고 등급 보장
  animation: GachaAnimation;   // 연출 커스터마이징
}

interface GachaEntry {
  characterDesignId: string;
  rarityLabel: string;         // 크리에이터 지정 등급명
  probability: number;         // 0.0 ~ 1.0 (합계 = 1.0)
  rarityTier: number;          // 정렬/천장용 등급 순위
}

interface GachaAnimation {
  backgroundColor: string;
  effectType: 'sparkle' | 'fire' | 'rainbow' | 'simple';
  soundEffect: string;
}
```

**가챠 연출 씬 (GachaScene) 흐름:**

```
1. 화면 어둡게 전환 (overlay)
2. 가챠 머신 확대 애니메이션
3. 동전 투입 연출
4. 뽑기 캡슐 흔들림 → 등급에 따른 이펙트 강도 차등
   - 일반: 작은 반짝임
   - 희귀: 파란 빛줄기
   - 전설: 화면 전체 금빛 + 카메라 쉐이크
5. 캡슐 열림 → 캐릭터 등장 (등장 팝 애니메이션)
6. 스탯/성격 순차 공개 (타이핑 연출)
7. "수집하기" 버튼 → 인벤토리에 추가
```

### 7.4 공간 시스템

**타일맵 기반 개인 공간:**

```typescript
interface SpaceConfig {
  ownerId: string;
  width: number;               // 타일 단위 (기본 16, 최대 64)
  height: number;
  theme: SpaceTheme;
  tiles: number[][];           // 바닥 타일 배열
  walls: number[][];           // 벽 타일 배열
  furniture: PlacedObject[];   // 배치된 가구/장식
  characters: PlacedCharacter[]; // 배치된 캐릭터
  gachaMachines: PlacedGachaMachine[]; // 설치된 가챠 머신
}
```

**공간 구현 핵심:**

- 타일 크기: 48px (16px 캐릭터가 3배율로 들어가는 기준)
- Phaser Tilemap API로 바닥/벽 렌더링
- 가구/캐릭터는 Sprite로 타일 위에 배치
- 꾸미기 모드: React UI에서 가구 선택 → Phaser에서 드래그 배치
- 배치된 캐릭터는 AnimationSystem의 기본 애니메이션으로 자율 행동

**캐릭터 자율 행동 AI (클라이언트):**

```
매 3~8초마다 (랜덤 간격):
  1. 성격에 따른 행동 확률 테이블 참조
  2. 행동 선택: 이동 / 가만히 서기 / 다른 캐릭터 근처로 이동 / 수면
  3. 이동 시: A* 또는 간단 경로 찾기로 목적지까지 통통 바운스 이동
  4. 가끔 감정 이펙트 발동 (성격별 빈도 차등)
```

### 7.5 모험 콘텐츠

**던전 탐험 (DungeonScene):**

```
파티 구성 (소유 캐릭터 3~5체 선택)
    ↓
던전 진입 → 자동 전투 (타임라인 기반)
    ↓
웨이브별 적 출현 → 캐릭터 STR/DEX/INT에 따른 데미지 계산
    ↓
클리어 보상: 화폐 + 캐릭터 조각 (랜덤)
    ↓
조각 N개 = 캐릭터 1체 완성
```

- 전투는 시각적으로 캐릭터들이 좌→우로 적에게 달려가는 사이드뷰 형태
- 스탯 기반 데미지/회피 계산은 클라이언트에서 처리 (mock), 이후 서버로 이전
- 전투 연출: Tween 기반 공격/피격/스킬 모션

**채집 & 낚시 (GatheringScene):**

- 채집: 채집 포인트 터치 → 타이밍 미니게임 (게이지 바에서 정확한 타이밍에 탭)
- 낚시: 찌 떨림 감지 → 탭 → 당기기 미니게임 (좌우 균형 잡기)
- 보상: 아이템, 화폐, 확률적으로 캐릭터 알(Egg) 획득
- 알 부화: 일정 시간 경과 또는 행동(걷기/던전 진행) 후 랜덤 캐릭터 등장

---

## 8. 클라이언트 구현 단계 (Phase별)

### Phase C1 — 기초 프레임워크 (1주) ✅ 완료

> 프로젝트 뼈대 구축, Phaser + React 이중 구조 확립

- [x] Vite + TypeScript + Phaser 3 + React 프로젝트 세팅
- [x] Phaser GameConfig (pixelArt: false + 개별 NEAREST 필터, resolution: devicePixelRatio)
- [x] BootScene → MainMenuScene → SpaceScene / GachaScene 씬 전환
- [x] EventBus 구현 (Phaser ↔ React 통신)
- [x] Zustand 스토어 기본 구조 세팅 (useGameStore, useUIStore, useEditorStore)
- [x] IndexedDB (Dexie.js) 스키마 정의
- [x] 서비스 인터페이스 + Mock 서비스 기본 골격 (5개 서비스)
- [x] Tailwind CSS + 픽셀아트 스타일 기본 UI 테마 (커스텀 팔레트, 컴포넌트 클래스)
- [x] UIOverlayScene HUD (화폐 표시, 토스트 메시지)
- [x] 벡터 아이콘팩 통합 + 검색 인덱스 (icon-index.json)

### Phase C2 — 픽셀 에디터 (2주)

> 게임의 핵심 — 캐릭터를 그릴 수 있어야 게임이 시작된다

- [ ] Konva.js 기반 드로잉 캔버스 (16x16 그리드)
- [ ] 기본 도구: 연필, 지우개, 스포이드, 채우기
- [ ] 16색 기본 팔레트 + 커스텀 팔레트
- [ ] 4레이어 시스템 (표시/숨김, 순서 변경)
- [ ] Undo/Redo (Command 패턴)
- [ ] 좌우 대칭 모드
- [ ] 고급 도구: 선, 사각형, 원, 선택/이동
- [ ] 24x24, 32x32 캔버스 크기 확장
- [ ] 프레임 애니메이션 편집 + 어니언 스킨
- [ ] 스프라이트 시트 내보내기 (→ Phaser 텍스처 변환)
- [ ] 초보자 템플릿 갤러리

### Phase C3 — 캐릭터 & 공간 기본 (2주)

> 그린 캐릭터를 내 공간에 배치하고 살아 움직이게 한다

- [ ] PixelCharacter 엔티티 (에디터 산출물 → 게임 스프라이트)
- [ ] 코드 기반 기본 애니메이션 7종 구현
- [ ] 캐릭터 자율 행동 AI (이동, 대기, 감정 표현)
- [ ] SpaceScene: 16x16 타일맵 기본 공간
- [ ] 타일 에디터 (바닥/벽 페인팅)
- [ ] 가구/장식 배치 시스템 (드래그 앤 드롭)
- [ ] 캐릭터 배치 및 관리
- [ ] 공간 저장/불러오기 (IndexedDB)

### Phase C4 — 가챠 시스템 (1.5주)

> 크리에이터가 가챠를 세팅하고, 플레이어가 뽑는다

- [ ] GachaSetupPanel: 크리에이터용 가챠 설정 UI
  - 캐릭터 등록, 확률 설정, 등급명 커스터마이즈
  - 천장 시스템 설정
  - 뽑기 비용 설정
- [ ] GachaMachine 엔티티: 공간에 설치 가능한 가챠 머신 오브젝트
- [ ] CharacterStatGen: 스탯/성격/특성 랜덤 생성기
- [ ] GachaScene: 뽑기 연출 씬 (등급별 차등 연출)
- [ ] 확률표 표시 UI (투명한 확률 공시)
- [ ] Mock 가챠 서비스 (클라이언트 사이드 난수)
- [ ] 인벤토리 연동 (뽑기 결과 → 수집)

### Phase C5 — 수집 & 인벤토리 (1주)

> 모은 캐릭터를 관리하고 도감을 채운다

- [ ] InventoryPanel: 보유 캐릭터 목록 (필터/정렬)
- [ ] 캐릭터 상세보기 (스탯, 성격, 특성, 획득 경로)
- [ ] CollectionPanel: 수집 도감 (크리에이터별, 등급별)
- [ ] 중복 캐릭터 합성 (스탯 보너스)
- [ ] 캐릭터 조각 시스템 (분해/합성)
- [ ] CurrencySystem: 화폐 획득/소비 관리

### Phase C6 — 모험 콘텐츠 (2주)

> 뽑기 외 대안 경로 — 던전, 채집, 낚시

- [ ] DungeonScene: 사이드뷰 자동 전투
  - 파티 구성 UI
  - 웨이브 전투 시스템
  - 스탯 기반 데미지 계산
  - 전투 연출 (Tween)
  - 클리어 보상 (화폐, 캐릭터 조각)
- [ ] GatheringScene: 채집 미니게임
  - 타이밍 게이지 미니게임
  - 채집 레벨/숙련도
- [ ] 낚시 미니게임
  - 찌 떨림 감지 + 당기기 균형 게임
- [ ] 캐릭터 알 시스템 (획득 → 부화)
- [ ] 던전/채집 데이터 JSON 정의

### Phase C7 — 방문 & 소셜 기본 (1주)

> 다른 크리에이터의 공간을 방문하고 가챠를 돌린다

- [ ] VisitScene: 타인 공간 방문 (읽기 전용 SpaceScene)
- [ ] 크리에이터 프로필 페이지
- [ ] 크리에이터 검색/탐색 UI (mock 데이터)
- [ ] 방명록 시스템 (로컬)
- [ ] 좋아요 시스템
- [ ] 퀘스트 시스템 기본 (일일/주간)

### Phase C8 — 폴리싱 & 최적화 (1주)

> 전체 플로우 통합 테스트, 성능 최적화, 반응형

- [ ] 전체 게임 루프 통합 테스트 (크리에이터 루프 + 플레이어 루프)
- [ ] 성능 최적화: 오브젝트 풀링, 텍스처 아틀라스 통합
- [ ] 반응형 레이아웃 (데스크탑 + 모바일 PWA 대응)
- [ ] 터치 입력 최적화 (Pointer Events)
- [ ] 사운드/BGM 기본 연동
- [ ] 에러 처리, 로딩 상태 UI
- [ ] Service 레이어 API 전환 준비 확인

---

## 9. 주요 기술 결정 사항

### 9.1 Phaser 3 선택

| 항목 | 결정 |
|------|------|
| 버전 | **Phaser 3.80.1** 채택 |
| 근거 | 안정성과 생태계 성숙도 우선. 풍부한 플러그인/예제/문서. TypeScript 타입 지원 충분. |
| 리스크 | v4 출시 후 마이그레이션 필요 가능. 단, 현재 프로젝트 규모에서는 낮은 리스크. |

### 9.2 픽셀 에디터 렌더링

| 항목 | 결정 |
|------|------|
| 메인 프레임워크 | **Konva.js** (레이어/이벤트 처리) |
| 픽셀 렌더링 | **OffscreenCanvas** (실제 픽셀 데이터 조작) |
| 근거 | 기획서 권장 구성. Konva.js가 레이어/터치를 처리하고, 실제 픽셀 연산은 OffscreenCanvas로 성능 확보. |

### 9.3 상태 관리

| 항목 | 결정 |
|------|------|
| 선택 | **Zustand** |
| 근거 | Redux 대비 보일러플레이트 최소, Phaser 외부에서도 쉽게 접근, 구독 기반으로 React 리렌더 효율적 |

### 9.4 로컬 데이터 저장

| 항목 | 결정 |
|------|------|
| 선택 | **IndexedDB (Dexie.js 래퍼)** |
| 근거 | 스프라이트 시트(바이너리), 공간 설정, 인벤토리 등 대용량 데이터 저장 필요. localStorage는 5MB 한계. |

### 9.5 앱 아키텍처 — React SPA + Phaser 임베드

| 항목 | 결정 |
|------|------|
| 구조 | **React Router가 앱 전체 관리, Phaser는 게임 월드 페이지에서만 마운트** |
| 이전 | Phaser가 모든 씬을 관리하고 React는 오버레이 UI만 담당하는 구조에서 전환 |
| 근거 | 메인 메뉴/에디터/가챠/도감 등 대부분의 화면은 웹 UI → React가 유리. URL 딥링크 지원. |
| Phaser 범위 | SpacePage(개인 공간), DungeonPage(던전 전투)에서만 PhaserGame 컴포넌트로 마운트/디스트로이 |
| 가챠 연출 | Framer Motion + CSS 애니메이션 (Phaser 없이) |
| 추가 의존성 | react-router-dom ^6.23.0, framer-motion ^11.0.0 |

---

## 10. 데이터 흐름 다이어그램

### 캐릭터 생성 → 가챠 등록 → 뽑기 전체 흐름

```
[크리에이터]
    │
    ▼
픽셀 에디터 (React + Konva.js)
    │ 레이어 병합, 스프라이트 시트 생성
    ▼
CharacterDesign 저장 (IndexedDB)
    │
    ▼
가챠 설정 UI (React)
    │ 캐릭터 선택, 확률 배분, 등급명 설정
    ▼
GachaMachineConfig 저장 (IndexedDB)
    │
    ▼
공간에 가챠 머신 배치 (Phaser SpaceScene)
    │
    ▼
[플레이어가 방문]
    │
    ▼
가챠 머신 상호작용 → 확률표 확인
    │
    ▼
뽑기 요청 → MockGachaService.pull()
    │ 확률 계산 + 스탯/성격 랜덤 생성
    ▼
GachaScene (뽑기 연출)
    │
    ▼
CharacterInstance 생성 → 인벤토리 추가
    │
    ▼
내 공간에 배치 가능 (SpaceScene)
```

---

## 11. 예상 일정 요약

| Phase | 내용 | 기간 | 누적 |
|-------|------|------|------|
| C1 | 기초 프레임워크 | 1주 | 1주 |
| C2 | 픽셀 에디터 | 2주 | 3주 |
| C3 | 캐릭터 & 공간 | 2주 | 5주 |
| C4 | 가챠 시스템 | 1.5주 | 6.5주 |
| C5 | 수집 & 인벤토리 | 1주 | 7.5주 |
| C6 | 모험 콘텐츠 | 2주 | 9.5주 |
| C7 | 방문 & 소셜 | 1주 | 10.5주 |
| C8 | 폴리싱 & 최적화 | 1주 | **11.5주 (약 3개월)** |

기획서 Phase 1 MVP(3개월)와 정합. C1~C4까지(6.5주)가 최소 플레이 가능한 프로토타입.

---

## 12. 백엔드 연동 대비 체크리스트

클라이언트 완성 후, 서비스 레이어만 교체하면 되도록 다음을 보장한다.

- [ ] 모든 게임 로직 호출이 Service 인터페이스를 통과하는가?
- [ ] 가챠 결과 생성이 Service 내부에 캡슐화되어 있는가? (API 전환 시 서버 결과로 대체)
- [ ] 화폐 변경이 CurrencyService를 통해서만 이루어지는가?
- [ ] 캐릭터 소유권 변경이 CharacterService를 통해서만 이루어지는가?
- [ ] 공간 데이터 저장/로드가 SpaceService를 통해서만 이루어지는가?
- [ ] Nonce 생성 유틸이 준비되어 있는가? (API 전환 시 즉시 사용)
- [ ] WebSocket 연결 포인트가 식별되어 있는가? (실시간 방문자 표시 등)

---

*PixelPals 클라이언트 구현 계획서 v1.2 — 2026.04.14 작성/갱신*
*기반 문서: PixelPals 게임 기획서 v2.0*
*v1.1: 에셋 전략(§3), UI 전략(§4) 추가, Phaser 3 확정*
*v1.2: React SPA + Phaser 임베드 아키텍처로 전환, 딥링크 지원, Framer Motion 추가*
