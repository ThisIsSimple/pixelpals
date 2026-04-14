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
├── editor/               # 픽셀 에디터 코어 (Canvas 2D 렌더링 엔진)
│   ├── core/
│   │   ├── algorithms.ts     # Bresenham, FloodFill, MidpointCircle 등 순수 알고리즘
│   │   ├── EditorCanvas.ts   # Canvas 2D 렌더링 파이프라인 (체커보드→레이어→그리드→대칭선→선택→커서)
│   │   ├── LayerCompositor.ts # OffscreenCanvas 레이어 합성
│   │   └── HistoryManager.ts  # 스냅샷 기반 Undo/Redo (최대 80개)
│   ├── tools/
│   │   ├── BaseTool.ts       # 추상 도구 기반 (대칭 H/V/Both 지원)
│   │   ├── PencilTool.ts     # Bresenham 보간 드로잉
│   │   ├── EraserTool.ts     # 투명 지우기
│   │   ├── FillTool.ts       # FloodFill BFS
│   │   ├── EyedropperTool.ts # 색상 샘플링
│   │   ├── LineTool.ts       # 직선 (Shift → 각도 스냅)
│   │   ├── RectangleTool.ts  # 사각형 (Shift → 정사각형)
│   │   ├── CircleTool.ts     # 원 (Midpoint Circle)
│   │   ├── SelectTool.ts     # 사각형 선택
│   │   ├── MoveTool.ts       # 레이어 내용 이동
│   │   └── index.ts          # 도구 레지스트리
│   └── export/
│       └── SpriteSheetExporter.ts # 스프라이트 시트 PNG 생성
├── ui/
│   ├── App.tsx           # React Router 루트
│   ├── layouts/          # GameLayout (NavBar + Outlet)
│   ├── pages/            # HomePage, EditorPage, GachaPage, CollectionPage, SpacePage, DungeonPage
│   ├── editor/           # 에디터 React UI 컴포넌트
│   │   ├── EditorLayout.tsx      # 메인 레이아웃 (헤더+툴바+캔버스+사이드패널+타임라인)
│   │   ├── EditorCanvasView.tsx  # Canvas 래퍼 (포인터→도구, 줌, 단축키, 커스텀 컨텍스트 메뉴)
│   │   ├── EditorToolbar.tsx     # 좌측 도구바 (9개 도구, 아이콘 팩 이미지 사용)
│   │   ├── PalettePanel.tsx      # 전경/배경 색상 + 팔레트 프리셋
│   │   ├── LayerPanel.tsx        # 레이어 관리 (표시/잠금/투명도/순서)
│   │   ├── PreviewPanel.tsx      # 4x 미리보기 + 애니메이션 재생
│   │   ├── TimelinePanel.tsx     # 프레임 타임라인 (재생/FPS/어니언스킨)
│   │   ├── TemplateModal.tsx     # 초보자 템플릿 선택 (6종)
│   │   └── ExportModal.tsx       # 스프라이트 시트 PNG 내보내기
│   ├── components/       # PhaserGame, NavBar 등 재사용 컴포넌트
│   ├── panels/           # EditorPlaceholder (레거시) 등 패널
│   └── common/           # Toast 등 공통
├── stores/               # Zustand (useGameStore, useUIStore, useEditorStore)
├── services/             # 서비스 인터페이스 + Mock 구현
├── types/                # TypeScript 타입 (editor.ts: SymmetryMode, SymmetryConfig 등)
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

---

## 픽셀 에디터 아키텍처

### 렌더링 엔진 — Canvas 2D

`EditorCanvas.ts`가 HTML Canvas 위에 다음 순서로 렌더링:
1. 체커보드 배경 (투명 영역 시각화)
2. 어니언 스킨 (이전=빨강 틴트, 다음=파랑 틴트)
3. 합성된 레이어 이미지 (LayerCompositor via OffscreenCanvas)
4. 도구 프리뷰 오버레이
5. 그리드 (zoom ≥ 2에서 표시)
6. 대칭 가이드라인 (마젠타 대시, H/V/Both 지원)
7. 선택 영역 (marching ants)
8. 커서 하이라이트

### 도구 시스템

`BaseTool` 추상 클래스 → `onPointerDown/Move/Up` 생명주기.
총 9개 도구: pencil(P), eraser(E), fill(G), eyedropper(I), line(L), rectangle(R), circle(C), select(M), move(V).
- **스포이드(I)**: 툴바에는 표시하지 않음. Alt+클릭 또는 `I` 키로만 접근.
- **원(C)**: 꼭짓점 기반 바운딩 박스 방식. 시작점과 끝점이 대각선 꼭짓점, 내접 타원 생성. Shift → 정원.
- **이동(V)**: 플로팅 픽셀 시스템으로 동작. 선택 영역 이동 시 선택 박스와 픽셀이 함께 이동하며, 캔버스 밖으로 나간 픽셀도 선택 해제 전까지 보존.

대칭 모드: `SymmetryMode = 'none' | 'horizontal' | 'vertical' | 'both'` + 축 위치 조절(0~1).

### 이동 도구 — 플로팅 픽셀

`MoveTool`은 선택 영역 내 픽셀을 "플로팅" 상태로 관리:
1. 첫 드래그 시 선택 영역 내 픽셀을 **상대 좌표**(`rx`, `ry`)로 `floatingPixels`에 저장
2. 매 드래그마다 "스냅샷 복원 → 원위치 클리어 → 새 위치 배치" 3단계로 처리 (복제/흔적 방지)
3. 캔버스 밖으로 나간 픽셀은 레이어에 배치되지 않지만, `floatingPixels` 데이터는 보존
4. 연속 드래그 시 `floatingPixels`에서 복원하므로 캔버스 밖 픽셀도 되살아남
5. 선택 해제(Escape/Ctrl+D) 시 `clearFloating()` → 현재 캔버스 상태가 최종 결과

`ToolContext`에 `selection: SelectionRect | null` 필드 포함.
`ToolResult`에 `selection?: SelectionRect | null` 필드 — MoveTool이 선택 영역 위치도 반환.

### 키보드 단축키

`e.code` 기반 매핑 — 한국어/일본어 등 비영어 IME 활성 상태에서도 동작.

| 키 | 기능 |
|----|------|
| P / E / G / I / L / R / C / M / V | 도구 전환 |
| X | 전경/배경 색상 스왑 |
| Alt + 클릭 | 임시 스포이드 |
| Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y | Undo / Redo |
| Ctrl/Cmd+D | 선택 해제 |
| [ / ] | 이전/다음 프레임 |
| Escape | 선택 해제 + 컨텍스트 메뉴 닫기 |
| Space + 드래그 | 캔버스 패닝 (확대 시 화면 이동) |

### 줌 & 패닝

- **연속 줌**: 마우스 휠로 ×1.25 스텝씩 확대/축소 (1x ~ 80x)
- **마우스 기준 줌**: 마우스 포인터 아래 픽셀이 고정된 채로 줌 (panX/panY 자동 보정)
- **줌 컨트롤 바**: 캔버스 우하단에 −/슬라이더/+/배율 표시. 슬라이더로 직접 줌 조절 가능.
- **패닝**: Space 키를 누른 채 드래그하면 캔버스를 이동 (커서 grab/grabbing)
- **화면 맞춤 리셋**: 줌 레벨 표시(우하단)를 더블클릭하면 `fitToView()` 실행
- **브라우저 줌 차단**: Ctrl+마우스휠, Ctrl+/-/=/0 차단. 에디터 캔버스만 자체 줌 사용.

### 브라우저 동작 차단

에디터 페이지에서 자동 활성화:
- **뒤로가기 방지**: `popstate` + `beforeunload` + 마우스 사이드 버튼 차단. 작업 변경 시 확인 다이얼로그.
- **우클릭 차단**: 브라우저 기본 메뉴 대신 에디터 커스텀 컨텍스트 메뉴 표시.

### 상태 관리 — useEditorStore (Zustand)

주요 상태: `canvasSize`, `currentTool`, `currentColor/secondaryColor`, `symmetryMode/symmetryConfig`, `frames[]`, `viewport`, `selection`, `isDirty`, `renderVersion` (Canvas 재렌더 트리거).

Undo/Redo: `HistoryManager` 싱글턴, 스냅샷 기반 (프레임 배열 deep clone), 최대 80개.

## 텍스트 선명도 규칙
- Phaser GameConfig: `pixelArt: false`, `antialias: true`, `resolution: devicePixelRatio`
- 픽셀아트 스프라이트에만 개별적으로 `texture.setFilter(NEAREST)` 적용
- index.html에 `image-rendering: pixelated` 사용하지 않음
