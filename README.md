# PixelPals

UGC 가챠 수집형 픽셀아트 웹 게임. 직접 픽셀 캐릭터를 만들고, 가챠로 수집하고, 나만의 공간을 꾸미고, 던전을 탐험할 수 있습니다.

## 주요 기능

**픽셀 에디터** — 브라우저에서 바로 쓸 수 있는 본격 픽셀아트 에디터입니다. 9가지 도구(연필, 지우개, 채우기, 스포이드, 선, 사각형, 원, 선택, 이동), 4레이어 시스템, 프레임 애니메이션, 대칭 드로잉, 어니언 스킨을 지원합니다. Canvas 2D 기반의 자체 렌더링 엔진으로 동작하며, 80x 줌과 마우스 기준 줌, Space+드래그 패닝을 제공합니다.

**가챠 시스템** — Framer Motion 기반 뽑기 연출과 수집 도감.

**개인 공간** — Phaser 기반 2D 월드에서 가구를 배치하고 캐릭터가 돌아다니는 나만의 방.

**던전** — Phaser 물리 엔진 기반 전투 시스템.

## 기술 스택

- **React 18** + React Router 6 + TypeScript + Vite
- **Phaser 3** — 게임 월드 전용 (SpacePage, DungeonPage에서만 마운트)
- **Framer Motion** — 가챠 연출, 페이지 전환
- **Zustand** — 상태 관리
- **Dexie.js** — IndexedDB 로컬 저장소
- **Tailwind CSS** + Galmuri11 픽셀 폰트

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 아키텍처

React SPA가 전체 앱을 관리하고, Phaser는 게임 월드가 필요한 페이지에서만 마운트되는 구조입니다.

```
React Router
├── /              → 홈
├── /editor        → 픽셀 에디터 (Canvas 2D)
├── /gacha         → 가챠 (Framer Motion)
├── /collection    → 수집 도감
├── /space         → 개인 공간 (Phaser)
└── /dungeon/:id   → 던전 (Phaser)
```

## 프로젝트 구조

```
src/
├── main.ts               # React SPA 진입점
├── config/               # 상수, 색상 팔레트
├── scenes/               # Phaser 씬
├── editor/               # 픽셀 에디터 코어
│   ├── core/             # 렌더링 엔진, 알고리즘, 히스토리
│   ├── tools/            # 9개 도구 (BaseTool 추상 클래스)
│   └── export/           # 스프라이트 시트 내보내기
├── ui/
│   ├── App.tsx           # React Router 루트
│   ├── pages/            # 페이지 컴포넌트
│   ├── editor/           # 에디터 UI (레이아웃, 툴바, 패널들)
│   ├── components/       # 공통 컴포넌트
│   └── layouts/          # 레이아웃
├── stores/               # Zustand 스토어
├── services/             # 서비스 추상화 (Mock → API)
├── types/                # TypeScript 타입
└── utils/                # EventBus, 유틸리티
```

## 에디터 단축키

| 키 | 기능 |
|----|------|
| P / E / G / I / L / R / C / M / V | 도구 전환 |
| X | 전경/배경 색상 스왑 |
| Alt + 클릭 | 스포이드 |
| Ctrl+Z / Ctrl+Shift+Z | Undo / Redo |
| Ctrl+A | 전체 선택 |
| Ctrl+D | 선택 해제 |
| Backspace / Delete | 선택 영역 삭제 |
| Space + 드래그 | 캔버스 이동 |
| 마우스 휠 | 줌 (1x ~ 80x) |
| [ / ] | 이전/다음 프레임 |

단축키는 `e.code` 기반이라 한국어 등 다른 입력기가 활성화된 상태에서도 동작합니다.

## 에셋

`assets/vector-icon-pack/`에 15개 카테고리, 5,514개 벡터 아이콘이 포함되어 있습니다. 64px(UI용)과 256px(상세용) 두 사이즈를 제공하며, Color/Outline/Flat 등 다양한 변형이 있습니다.

## 라이선스

Private
