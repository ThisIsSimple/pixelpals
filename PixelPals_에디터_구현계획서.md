# PixelPals 픽셀 에디터 — 구현 계획서 v1.0

> **목표**: "누구나 자신의 픽셀 캐릭터를 그려 가챠에 등록할 수 있는" 웹 기반 픽셀아트 에디터
> **벤치마크**: Aseprite(기능 표준) + Piskel(웹 구현 참고) + Pixelorama(오픈소스 참고)
> **원칙**: 전문가 기능보다 **접근성과 재미**를 우선한다

---

## 1. 설계 철학

### 1.1 Aseprite vs PixelPals 에디터

| 관점 | Aseprite | PixelPals 에디터 |
|------|----------|-----------------|
| 대상 | 전문 픽셀 아티스트 | 게임 유저 (비전문가 포함) |
| 용도 | 범용 에셋 제작 | 게임 내 캐릭터/가구/아이템 제작 |
| 캔버스 | 무제한 | 16~32px (의도적 제한 → 픽셀아트 특성 강제) |
| 레이어 | 무제한 | 4레이어 (몸체/얼굴/악세서리/이펙트) |
| 복잡도 | 높음 (학습 곡선 큼) | 낮음 (5분 안에 첫 캐릭터 완성) |

### 1.2 핵심 원칙

1. **5분 규칙** — 처음 접한 유저가 5분 안에 캐릭터 하나를 완성할 수 있어야 한다
2. **템플릿 퍼스트** — 빈 캔버스가 아닌 템플릿에서 시작하는 것이 기본 경험
3. **즉시 피드백** — 그린 캐릭터가 게임에서 어떻게 보이는지 실시간 프리뷰
4. **실수 두려움 없음** — 무제한 Undo/Redo + 레이어 안전망

---

## 2. 기술 아키텍처

### 2.1 렌더링 엔진 선택: HTML Canvas 2D (직접 구현)

기획서에서는 Konva.js를 권장했으나, 재검토 결과 **순수 Canvas 2D API**가 더 적합하다.

| 기준 | Konva.js | Canvas 2D 직접 구현 |
|------|----------|-------------------|
| **번들 사이즈** | ~140KB min | 0KB (브라우저 내장) |
| **픽셀 그리드 렌더링** | 범용 → 오버헤드 | 최적화 가능 (fillRect 직접) |
| **레이어 합성** | 자체 레이어 (DOM 기반) | OffscreenCanvas 합성 (GPU 활용) |
| **이벤트 처리** | Konva 이벤트 시스템 | Pointer Events API 직접 |
| **의존성** | 추가 의존성 | 없음 |
| **16~32px 그리드** | 오버킬 | 완벽한 핏 |

**결정: Canvas 2D + OffscreenCanvas + Pointer Events**

### 2.2 아키텍처 개요

```
┌─────────────────────────────────────────────────┐
│ EditorPage (React)                              │
│ ┌─────────┬──────────────────┬────────────────┐ │
│ │ Toolbar │    CanvasArea    │  RightPanel    │ │
│ │ (도구)  │  ┌────────────┐ │ ┌────────────┐ │ │
│ │         │  │  Canvas2D  │ │ │  Palette    │ │ │
│ │ Pencil  │  │  (메인)    │ │ │  Layers     │ │ │
│ │ Eraser  │  │            │ │ │  Preview    │ │ │
│ │ Fill    │  └────────────┘ │ │  Timeline   │ │ │
│ │ Line    │                 │ └────────────┘ │ │
│ │ Rect    │  ┌────────────┐ │                │ │
│ │ Circle  │  │ OffScreen  │ │                │ │
│ │ Select  │  │ (합성용)   │ │                │ │
│ │ Dropper │  └────────────┘ │                │ │
│ └─────────┴──────────────────┴────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Timeline (프레임 타임라인)                    │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 2.3 핵심 모듈 구조

```
src/editor/
├── core/
│   ├── EditorCanvas.ts        # Canvas 2D 렌더링 엔진
│   ├── LayerCompositor.ts     # 레이어 합성 (OffscreenCanvas)
│   ├── HistoryManager.ts      # Undo/Redo (Command 패턴)
│   └── ProjectManager.ts      # 프로젝트 저장/로드 (IndexedDB)
├── tools/
│   ├── BaseTool.ts            # 도구 추상 클래스
│   ├── PencilTool.ts          # 연필 (픽셀 퍼펙트)
│   ├── EraserTool.ts          # 지우개
│   ├── FillTool.ts            # 채우기 (FloodFill)
│   ├── LineTool.ts            # 선 (Bresenham)
│   ├── RectangleTool.ts       # 사각형
│   ├── CircleTool.ts          # 원 (Midpoint Circle)
│   ├── EyedropperTool.ts      # 스포이드
│   └── SelectTool.ts          # 선택/이동
├── animation/
│   ├── TimelineManager.ts     # 프레임 타임라인 관리
│   ├── OnionSkin.ts           # 어니언 스킨 렌더링
│   └── AnimationPlayer.ts    # 실시간 미리보기 재생
├── export/
│   ├── SpriteSheetExporter.ts # 스프라이트 시트 PNG 생성
│   └── GifExporter.ts        # GIF 애니메이션 내보내기 (선택)
└── templates/
    └── TemplateGallery.ts     # 초보자 템플릿 데이터
```

### 2.4 React 컴포넌트 구조

```
src/ui/pages/EditorPage.tsx          # 페이지 컨테이너
src/ui/editor/
├── EditorLayout.tsx                 # 전체 레이아웃 (3열 + 하단 타임라인)
├── EditorToolbar.tsx                # 좌측 도구 바
├── EditorCanvas.tsx                 # 중앙 캔버스 (React ↔ Canvas 브릿지)
├── EditorRightPanel.tsx             # 우측 패널 컨테이너
├── PalettePanel.tsx                 # 팔레트 UI
├── LayerPanel.tsx                   # 레이어 UI
├── PreviewPanel.tsx                 # 실시간 미리보기 (1x 크기)
├── TimelinePanel.tsx                # 하단 프레임 타임라인
├── TemplateModal.tsx                # 템플릿 선택 모달
└── ExportModal.tsx                  # 내보내기 모달
```

---

## 3. 기능 상세 명세

### 3.1 드로잉 도구 (8종)

#### 연필 (Pencil) — 핵심 도구
```
- 1픽셀 정확도 드로잉
- 픽셀 퍼펙트 모드: 대각선에서 불필요한 이중 픽셀 제거
  (Aseprite의 Pixel Perfect 알고리즘 참고)
- 마우스 드래그 시 연속 드로잉 (Bresenham 보간)
- 대칭 모드 연동: X축 미러링 시 반대쪽에도 동시 드로잉
```

#### 지우개 (Eraser)
```
- 픽셀을 투명(null)으로 설정
- 현재 레이어에만 영향
- 드래그 지우기 지원
```

#### 채우기 (Fill / Paint Bucket)
```
- FloodFill 알고리즘 (4방향 BFS)
- 같은 색상 영역을 선택한 색상으로 채움
- 현재 레이어에만 영향
- 빈 영역(투명) 채우기 지원
```

#### 스포이드 (Eyedropper / Color Picker)
```
- 캔버스 클릭 시 해당 픽셀의 색상을 현재 색상으로 설정
- 현재 레이어의 색상 샘플링
- Alt 키 누른 상태에서 아무 도구나 사용 중 클릭 → 스포이드 동작 (Aseprite 방식)
```

#### 선 (Line)
```
- Bresenham 라인 알고리즘
- 클릭(시작점) → 드래그 → 릴리즈(끝점) 방식
- 드래그 중 미리보기(프리뷰) 표시
- Shift 누르면 수평/수직/45도 스냅
```

#### 사각형 (Rectangle)
```
- 클릭(시작 모서리) → 드래그 → 릴리즈(끝 모서리)
- 채움 / 외곽선만 토글 옵션
- 드래그 중 실시간 프리뷰
- Shift 누르면 정사각형 고정
```

#### 원 (Circle / Ellipse)
```
- Midpoint Circle 알고리즘
- 클릭(중심 또는 바운딩박스 모서리) → 드래그 → 릴리즈
- 채움 / 외곽선만 토글 옵션
- Shift 누르면 정원 고정
```

#### 선택 (Select / Move)
```
- 사각형 영역 선택 (마키)
- 선택 영역 이동 (드래그)
- 선택 영역 복사/잘라내기/붙여넣기
- 선택 해제 (Escape 또는 빈 영역 클릭)
- 선택 영역 외곽선 점선 애니메이션 (marching ants)
```

### 3.2 캔버스 시스템

#### 렌더링 파이프라인
```
각 레이어의 OffscreenCanvas
    ↓ (보이는 레이어만)
LayerCompositor가 순서대로 합성
    ↓
체커보드 배경 (투명 영역 표시)
    ↓
그리드 오버레이 (옵션)
    ↓
도구 프리뷰 오버레이 (선, 사각형 등 드래그 중)
    ↓
어니언 스킨 오버레이 (옵션)
    ↓
선택 영역 오버레이
    ↓
최종 화면 Canvas에 렌더
```

#### 줌 & 팬
```
- 마우스 휠: 줌 인/아웃 (x1, x2, x4, x8, x16, x32)
- 스페이스바 + 드래그: 캔버스 팬 (이동)
- 줌 레벨 표시 (우하단)
- 핀치 줌 (모바일)
- Ctrl+0: 줌 리셋 (캔버스 영역에 맞춤)
```

#### 캔버스 크기
```
- 16x16 (기본, 추천) — 16px 캐릭터
- 24x24 — 중간 디테일
- 32x32 — 고디테일
- 프로젝트 생성 시 선택, 이후 변경 불가 (데이터 손실 방지)
```

### 3.3 레이어 시스템

#### 4레이어 구조
```
[이펙트]    — 발광, 오라, 파티클 효과
[악세서리]  — 모자, 안경, 날개 등 탈부착 가능 아이템
[얼굴]      — 표정, 눈, 입 (프레임마다 바꿔서 감정 표현)
[몸체]      — 캐릭터의 기본 실루엣 (보통 전 프레임 동일)
```

#### 레이어 기능
```
- 표시/숨김 토글 (눈 아이콘)
- 잠금 (잠긴 레이어는 편집 불가)
- 불투명도 조절 (0~100%, 슬라이더)
- 레이어 순서 변경 (드래그 또는 화살표 버튼)
- 현재 선택 레이어 하이라이트
- 레이어 미리보기 썸네일 (16x16 or 아이콘)
```

### 3.4 팔레트 시스템

#### 기본 팔레트
```
- Pico-8 스타일 16색 기본 제공 (현재 구현됨)
- 추가 프리셋: 파스텔, 게임보이, 어스톤 등
- 팔레트 전환 드롭다운
```

#### 색상 선택
```
- 팔레트에서 클릭으로 선택 (현재 구현됨)
- 전경색 / 배경색 분리 (Aseprite 방식)
  - 좌클릭 = 전경색으로 드로잉
  - 우클릭 = 배경색으로 드로잉 (주로 지우기)
- X 키: 전경/배경 스왑
- 현재 색상 표시 (전경 + 배경 겹침 표시)
```

#### 커스텀 팔레트 (향후)
```
- 팔레트에 색상 추가/제거/수정
- HSV 색상 피커
- 커스텀 팔레트 저장/로드
- 팔레트 공유 (Lospec 팔레트 DB 연동 가능)
```

### 3.5 애니메이션 시스템

#### 프레임 타임라인
```
┌──────────────────────────────────────────────────┐
│ ◀ ■ ▶ │ FPS: [8 ▼] │ 🧅 어니언 │ ♻ 루프    │
├──────────────────────────────────────────────────┤
│ [1] [2] [3] [4] [+]                             │
│  ▲현재                                          │
└──────────────────────────────────────────────────┘

- 프레임 추가/삭제/복제
- 프레임 순서 변경 (드래그)
- 프레임 클릭으로 이동
- 현재 프레임 하이라이트
- 재생/정지/다음/이전 컨트롤
```

#### 어니언 스킨 (Onion Skinning)
```
- 이전 프레임: 빨간 틴트 반투명 오버레이
- 다음 프레임: 파란 틴트 반투명 오버레이
- 표시 범위: 이전/다음 1~3프레임 (설정 가능)
- 불투명도 조절 (기본 30%)
- 토글 버튼으로 On/Off
```

#### 실시간 미리보기
```
- 우측 패널 PreviewPanel에서 1x 크기로 재생
- 설정된 FPS로 프레임 순환
- 루프 재생
- 미리보기 배경색 선택 (어두운/밝은/투명)
```

### 3.6 프리뷰 시스템 (PixelPals 특화)

다른 에디터에는 없는 PixelPals만의 특화 기능:

```
┌────────────────────┐
│   실시간 미리보기   │
│  ┌──────────────┐  │
│  │              │  │
│  │   캐릭터가   │  │
│  │   공간에서   │  │
│  │   뛰어다니는 │  │
│  │   모습 재생  │  │
│  │              │  │
│  └──────────────┘  │
│  1x  2x  4x       │
│  ⬜ 밝은배경        │
│  ⬛ 어두운배경      │
└────────────────────┘

- 현재 그리고 있는 캐릭터가 게임 내에서 어떻게 보이는지 미리보기
- 바운스 애니메이션 적용 상태로 미리보기
- 1x / 2x / 4x 배율 선택
- 밝은/어두운/투명 배경 선택
```

### 3.7 내보내기 시스템

#### 스프라이트 시트 생성
```
에디터의 프레임들 (레이어 합성 후)
    ↓
OffscreenCanvas에 가로로 나열
    ↓
canvas.toBlob('image/png')
    ↓
IndexedDB에 CharacterDesign으로 저장
    ↓
Phaser TextureManager에서 동적 로드

출력 예시 (4프레임 16x16):
┌────┬────┬────┬────┐
│ F1 │ F2 │ F3 │ F4 │  → 64x16 PNG
└────┴────┴────┴────┘
```

#### 저장 데이터 구조
```typescript
interface CharacterDesign {
  id: string;
  name: string;
  creatorId: string;
  canvasSize: 16 | 24 | 32;
  // 원본 프로젝트 (재편집용)
  projectData: {
    frames: AnimationFrame[];
    palette: string[];
  };
  // 최종 출력 (렌더링용)
  spriteSheet: Blob;          // PNG 스프라이트 시트
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  createdAt: number;
  updatedAt: number;
}
```

### 3.8 템플릿 시스템

#### 초보자 경험
```
에디터 첫 진입 시:
1. "템플릿에서 시작하기" 또는 "빈 캔버스" 선택
2. 템플릿 선택 모달:
   ┌──────────────────────────┐
   │  📦 템플릿 선택           │
   │                          │
   │  🐱 고양이  🐶 강아지    │
   │  🤖 로봇    👻 유령      │
   │  🦊 여우    🐻 곰        │
   │  🌟 별      ❤️ 하트      │
   │                          │
   │  [빈 캔버스로 시작]       │
   └──────────────────────────┘
3. 템플릿 선택 → 기본 형태 로드 → 자유 수정
```

#### 템플릿 데이터
```
- 각 템플릿 = 미리 그려진 LayerData[] (몸체 레이어만)
- 유저는 얼굴/악세서리/이펙트 레이어를 자유롭게 추가
- 색상 변경만으로도 자신만의 캐릭터 완성 가능
```

### 3.9 키보드 단축키

| 키 | 기능 | 비고 |
|----|------|------|
| **P** | 연필 | Aseprite 호환 |
| **E** | 지우개 | |
| **G** | 채우기 | Aseprite: G |
| **I** | 스포이드 | Aseprite: I |
| **L** | 선 | |
| **R** | 사각형 | |
| **C** | 원 | |
| **M** | 선택 | Aseprite: M |
| **X** | 전경/배경색 스왑 | |
| **[** / **]** | 이전/다음 프레임 | |
| **Space + 드래그** | 캔버스 팬 | |
| **Ctrl+Z** | 실행 취소 | |
| **Ctrl+Shift+Z** | 다시 실행 | |
| **Ctrl+C** | 복사 | |
| **Ctrl+V** | 붙여넣기 | |
| **Ctrl+X** | 잘라내기 | |
| **Ctrl+A** | 전체 선택 | |
| **Escape** | 선택 해제 / 도구 취소 | |
| **Ctrl+S** | 프로젝트 저장 | |
| **Alt + 클릭** | 스포이드 (아무 도구 중) | Aseprite 방식 |
| **Shift + 드래그** | 직선 스냅 (선/사각형) | |

---

## 4. 구현 단계 (Phase C2 세부)

### Step 1: 캔버스 렌더링 엔진 (2일)

**목표:** div 기반 → Canvas 2D 전환, 고성능 렌더링

```
구현 항목:
- [ ] EditorCanvas 코어 클래스 (Canvas 2D)
  - 픽셀 그리드 렌더 (fillRect 기반)
  - 체커보드 투명 배경
  - 그리드 라인 오버레이
  - 줌/팬 (마우스 휠 + Space 드래그)
- [ ] LayerCompositor (OffscreenCanvas)
  - 레이어 순서대로 합성
  - 보이기/숨김 반영
  - 불투명도 반영
- [ ] EditorCanvas React 컴포넌트
  - Canvas ref 관리
  - Pointer Events 바인딩
  - 리사이즈 대응
- [ ] 좌표 변환 유틸
  - 화면 좌표 → 픽셀 좌표 변환
  - 줌 레벨 반영
```

**산출물:** 빈 캔버스에 체커보드 배경 + 그리드가 표시되고, 줌/팬이 작동하는 상태

### Step 2: 기본 도구 4종 (2일)

**목표:** 핵심 드로잉 도구 구현

```
구현 항목:
- [ ] BaseTool 추상 클래스
  - onPointerDown / onPointerMove / onPointerUp
  - 프리뷰 렌더 인터페이스
  - 커서 스타일 정의
- [ ] PencilTool
  - 1픽셀 드로잉
  - 드래그 시 Bresenham 보간 (빠른 드래그에도 빈 틈 없음)
  - 픽셀 퍼펙트 모드 (이중 픽셀 제거)
  - 대칭 모드 연동
- [ ] EraserTool
  - 투명으로 설정
  - PencilTool 로직 재활용
- [ ] FillTool (FloodFill)
  - BFS 기반 4방향 채우기
  - 같은 색상 → 선택 색상으로 교체
  - 빈 영역(null) 채우기
- [ ] EyedropperTool
  - 클릭한 픽셀의 색상 → currentColor 설정
  - Alt 키 임시 활성화
```

**산출물:** 연필로 그리고, 지우고, 채우고, 색상 샘플링이 가능한 상태

### Step 3: 고급 도구 4종 (2일)

**목표:** 도형 도구 + 선택 도구

```
구현 항목:
- [ ] LineTool
  - Bresenham 라인 알고리즘
  - 드래그 중 프리뷰 (오버레이 캔버스에)
  - Shift 스냅 (수평/수직/45도)
- [ ] RectangleTool
  - 채움 / 외곽선 모드
  - 드래그 중 프리뷰
  - Shift → 정사각형
- [ ] CircleTool
  - Midpoint Circle 알고리즘
  - 채움 / 외곽선 모드
  - Shift → 정원
- [ ] SelectTool
  - 사각형 선택 영역 (marching ants 효과)
  - 선택 영역 이동
  - Ctrl+C/X/V 복사/잘라내기/붙여넣기
  - Escape → 선택 해제
```

**산출물:** 모든 도구가 동작하는 완전한 도구 세트

### Step 4: Undo/Redo + 키보드 단축키 (1일)

**목표:** 편집 안전망 + 효율적 작업

```
구현 항목:
- [ ] HistoryManager 리팩터링
  - EditorCommand 패턴 실제 적용
  - setPixel → PaintCommand 래핑
  - fill → FillCommand 래핑
  - 선택 이동 → MoveCommand 래핑
  - 최대 히스토리: 100단계
- [ ] KeyboardShortcutManager
  - useEffect로 keydown 바인딩
  - 도구 단축키 (P, E, G, I, L, R, C, M)
  - 편집 단축키 (Ctrl+Z, Ctrl+Shift+Z, Ctrl+C/V/X)
  - Alt+클릭 → 임시 스포이드
  - Space+드래그 → 캔버스 팬
```

### Step 5: 레이어 UI 완성 (1일)

**목표:** 레이어 패널 인터랙션 완성

```
구현 항목:
- [ ] LayerPanel 컴포넌트
  - 표시/숨김 토글 (👁 아이콘 클릭)
  - 잠금/해제 토글 (🔒 아이콘)
  - 불투명도 슬라이더 (0~100%)
  - 레이어 순서 변경 (위/아래 버튼 또는 드래그)
  - 현재 레이어 하이라이트
  - 레이어 미리보기 썸네일
```

### Step 6: 팔레트 UI 확장 (0.5일)

**목표:** 색상 관리 개선

```
구현 항목:
- [ ] PalettePanel 컴포넌트
  - 전경색/배경색 표시 (겹침 사각형)
  - X 키로 스왑
  - 팔레트 프리셋 전환 (클래식 16, 파스텔, 게임보이)
  - 우클릭 → 배경색 선택
```

### Step 7: 프레임 타임라인 (2일)

**목표:** 애니메이션 편집 기능

```
구현 항목:
- [ ] TimelinePanel 컴포넌트
  - 프레임 썸네일 목록 (가로 스크롤)
  - 프레임 추가/삭제/복제
  - 프레임 클릭으로 이동
  - 현재 프레임 하이라이트
  - 재생/정지/이전/다음 컨트롤
  - FPS 설정 (1~24, 기본 8)
- [ ] TimelineManager
  - 프레임 데이터 관리
  - 재생 타이머 (requestAnimationFrame)
  - 루프 모드
- [ ] OnionSkin 렌더링
  - 이전 프레임 → 빨간 틴트 오버레이 (30% 불투명도)
  - 다음 프레임 → 파란 틴트 오버레이 (30% 불투명도)
  - 토글 버튼
```

### Step 8: 미리보기 + 내보내기 (1.5일)

**목표:** 게임 연동 파이프라인

```
구현 항목:
- [ ] PreviewPanel 컴포넌트
  - 1x 크기 캔버스에서 실시간 애니메이션 재생
  - 배경색 선택 (밝은/어두운/투명)
  - 바운스 애니메이션 미리보기 (게임 내 모습)
- [ ] SpriteSheetExporter
  - 프레임 합성 → 가로 나열 스프라이트 시트
  - canvas.toBlob('image/png') → Blob 생성
  - IndexedDB에 CharacterDesign 저장
  - 다운로드 버튼 (로컬 PNG 저장)
- [ ] ExportModal
  - 이름 입력
  - 미리보기 (스프라이트 시트 전체)
  - "저장" / "다운로드" / "취소"
```

### Step 9: 템플릿 시스템 (1일)

**목표:** 초보자 온보딩

```
구현 항목:
- [ ] 기본 템플릿 8종 제작
  - 고양이, 강아지, 로봇, 유령, 여우, 곰, 별, 하트
  - 각 16x16, 몸체 레이어에 기본 형태
  - 최소한의 픽셀로 인식 가능한 실루엣
- [ ] TemplateModal 컴포넌트
  - 그리드 레이아웃으로 템플릿 표시
  - 클릭 → 해당 템플릿 로드 → 에디터 시작
  - "빈 캔버스" 옵션
- [ ] 에디터 첫 진입 시 자동 표시
```

### Step 10: UI 폴리싱 + 통합 테스트 (1일)

**목표:** 완성도 마무리

```
구현 항목:
- [ ] Tailwind 기반 전체 스타일 통일
  - 인라인 스타일 → Tailwind 클래스 전환
  - 픽셀아트 테마 일관성
  - 반응형 (최소 1024px 이상 지원)
- [ ] 커서 커스텀
  - 연필: crosshair
  - 지우개: 커스텀 원형
  - 채우기: 버킷 커서
  - 스포이드: 스포이드 커서
- [ ] 에디터 → 가챠 연동 테스트
  - 캐릭터 제작 → 저장 → 가챠 등록 가능 확인
- [ ] 성능 테스트
  - 32x32 캔버스 + 4레이어 + 8프레임 시 프레임 드롭 없는지 확인
```

---

## 5. 구현 일정 요약

| Step | 내용 | 기간 | 누적 |
|------|------|------|------|
| 1 | 캔버스 렌더링 엔진 | 2일 | 2일 |
| 2 | 기본 도구 4종 | 2일 | 4일 |
| 3 | 고급 도구 4종 | 2일 | 6일 |
| 4 | Undo/Redo + 단축키 | 1일 | 7일 |
| 5 | 레이어 UI | 1일 | 8일 |
| 6 | 팔레트 확장 | 0.5일 | 8.5일 |
| 7 | 프레임 타임라인 | 2일 | 10.5일 |
| 8 | 미리보기 + 내보내기 | 1.5일 | 12일 |
| 9 | 템플릿 시스템 | 1일 | 13일 |
| 10 | 폴리싱 + 테스트 | 1일 | **14일 (2주)** |

---

## 6. 현재 코드 활용 계획

### 유지하는 것
- `useEditorStore.ts` — 상태 관리 구조 (확장 필요)
- `types/editor.ts` — 타입 정의 (확장 필요)
- `config/palette.ts` — 팔레트 데이터
- `config/constants.ts` — 에디터 관련 상수

### 교체하는 것
- `EditorPlaceholder.tsx` → `EditorLayout.tsx` + 여러 서브 컴포넌트
  - div 기반 캔버스 → Canvas 2D 기반
  - 인라인 스타일 → Tailwind 클래스
  - 모놀리식 컴포넌트 → 모듈별 분리

### 추가하는 것
- `src/editor/core/` — 캔버스 엔진, 레이어 합성, 히스토리
- `src/editor/tools/` — 8개 도구 클래스
- `src/editor/animation/` — 타임라인, 어니언 스킨
- `src/editor/export/` — 스프라이트 시트 내보내기
- `src/ui/editor/` — 6개 React 컴포넌트

---

## 7. 기술적 참고사항

### 7.1 FloodFill 알고리즘 (BFS)

```typescript
function floodFill(
  pixels: (string | null)[][],
  startX: number, startY: number,
  fillColor: string,
  size: number
): (string | null)[][] {
  const targetColor = pixels[startY][startX];
  if (targetColor === fillColor) return pixels;

  const newPixels = pixels.map(row => [...row]);
  const queue: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    if (x < 0 || x >= size || y < 0 || y >= size) continue;
    if (newPixels[y][x] !== targetColor) continue;

    visited.add(key);
    newPixels[y][x] = fillColor;

    queue.push([x+1, y], [x-1, y], [x, y+1], [x, y-1]);
  }
  return newPixels;
}
```

### 7.2 Bresenham 라인 알고리즘

```typescript
function bresenhamLine(
  x0: number, y0: number,
  x1: number, y1: number
): [number, number][] {
  const points: [number, number][] = [];
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;

  while (true) {
    points.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
  return points;
}
```

### 7.3 Midpoint Circle 알고리즘

```typescript
function midpointCircle(
  cx: number, cy: number, radius: number
): [number, number][] {
  const points: [number, number][] = [];
  let x = radius, y = 0, d = 1 - radius;

  while (x >= y) {
    // 8방향 대칭
    points.push(
      [cx+x, cy+y], [cx-x, cy+y], [cx+x, cy-y], [cx-x, cy-y],
      [cx+y, cy+x], [cx-y, cy+x], [cx+y, cy-x], [cx-y, cy-x]
    );
    y++;
    if (d <= 0) {
      d += 2*y + 1;
    } else {
      x--;
      d += 2*(y - x) + 1;
    }
  }
  return points;
}
```

### 7.4 픽셀 퍼펙트 알고리즘

```
연속된 3픽셀 A-B-C에서:
- A와 C가 같은 행 또는 같은 열에 있고
- B가 대각선 위치에 있으면
→ B를 제거

효과: 대각선 이동 시 "계단" 모양의 깔끔한 1px 라인 생성
```

---

## 8. 향후 확장 (Phase C2 이후)

| 기능 | 우선순위 | 설명 |
|------|---------|------|
| 커스텀 팔레트 생성 | 높음 | HSV 피커 + 저장 |
| 가구/아이템 에디터 모드 | 높음 | 캐릭터 외 에셋 타입 지원 |
| GIF 내보내기 | 중간 | 애니메이션 GIF 생성 |
| 프로젝트 목록 관리 | 높음 | 내 작품 목록 + 편집/삭제 |
| 대칭 모드 확장 | 낮음 | X축 + Y축 + XY축 |
| 클리핑 마스크 | 낮음 | 레이어 마스킹 |
| 타일 모드 | 낮음 | 심리스 타일 패턴 생성 |
| 프리미엄 기능 | 향후 | 추가 레이어, 64x64, 이펙트 필터 등 |
