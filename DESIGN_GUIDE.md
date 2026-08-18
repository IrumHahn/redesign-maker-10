# 한이룸 마법사 시리즈 디자인 가이드

이 문서는 `한이룸의 상세페이지 리디자인 마법사 1.0`에서 확정한 디자인 방향을 다른 마법사 시리즈 프로젝트에 동일하게 적용하기 위한 기준입니다.

## 1. 디자인 원칙

### 제품 인상

- 프리미엄 AI SaaS보다 `커머스 실무자가 바로 쓰는 작업실`에 가깝게 만든다.
- 첫 화면은 랜딩 페이지가 아니라 실제 업무 화면이어야 한다.
- 기능 설명보다 현재 작업, 입력, 설정, 결과, 저장 상태가 먼저 보여야 한다.
- `마법사`라는 이름은 브랜드 네이밍으로만 사용하고, 판타지 장식이나 과한 연출은 쓰지 않는다.

### 화면 밀도

- 정보는 촘촘하게 배치하되 카드, 라벨, 배지, 여백으로 스캔 가능하게 만든다.
- 큰 히어로 문구, 장식용 그래픽, 그라디언트 오브젝트, 마케팅식 섹션 구성을 피한다.
- 사용자가 반복해서 쓰는 도구이므로 조용하고 안정적인 UI를 우선한다.

## 2. 브랜드 네이밍

### 기본 형식

```text
한이룸의 [업무/도메인] 마법사 [버전]
```

예시:

- 한이룸의 상세페이지 리디자인 마법사 1.0
- 한이룸의 상품 소싱 마법사 1.0
- 한이룸의 카피 개선 마법사 1.0
- 한이룸의 리뷰 분석 마법사 1.0

### UI 표기

- 사이드바 또는 앱 헤더에는 제품명을 2줄까지 허용한다.
- 내부 메뉴, 버튼, 상태 문구에는 `마법`이라는 표현을 반복하지 않는다.
- 개발 스택명, 내부 모델명, 라이브러리명은 사용자 UI에 노출하지 않는다. 예: `Next.js`, `shadcn`, `pgvector` 등.

## 3. 로고와 파비콘

전체 가이드 페이지: `/brand/logo-guidelines` (앱 내 정적 페이지). 스펙: `docs/superpowers/specs/2026-08-18-wizard-series-brand-design.md`

### 시리즈 심볼

한이룸 브랜드 안의 형제 구조: 실행학교(오렌지 사각형 + R) / 마법사 시리즈(에메랄드 사각형 + W).
같은 문법을 공유하고 색과 글자만 다르다.

- 배경: 에메랄드 `#34d399` 정사각형, 코너 반경 = 변의 22%
- 중심: 차콜 `#171a1f` W 레터마크 (SVG 패스, 폰트 비의존)
- 요소는 2개뿐. 별·문서 등 부가 픽토그램 금지
- 단색: 차콜 사각형 + 오프화이트 W (1도 인쇄 전용)
- 시리즈 앱 구분은 워드마크 텍스트로만. 앱별 색·글자 변주 금지

### 규칙

- 여백: 마크 높이의 1/4. 최소 크기 디지털 24px, 인쇄 8mm
- 금지: 비율 왜곡, 회전, 색 변경, 그림자/글로우, 저대비 배경, 테두리, W 교체, 투명도 조정

### 파일

- `src/app/icon.svg` (64x64), `src/app/apple-icon.svg` (180x180)
- `src/components/brand-mark.tsx` — `<BrandMark />`, `<BrandMark mono />`
- `public/brand/wizard-mark.svg`, `wizard-mark-mono.svg`, `wizard-lockup.svg`

### 사이드바 로고

```tsx
<BrandMark />  {/* size-9 기본 */}
```

새 시리즈 프로젝트는 위 파일 5개를 그대로 복사하고 워드마크 텍스트만 바꾼다.

## 4. 컬러 시스템

### 핵심 팔레트

| 역할 | 토큰 | 값 | 사용처 |
| --- | --- | --- | --- |
| 배경 | `background` | `#f7f8f5` | 전체 앱 배경 |
| 전경 | `foreground` | `#171a1f` | 주요 텍스트, 기본 버튼 |
| 카드 | `card` | `#ffffff` | 패널, 카드 |
| 카드 텍스트 | `card-foreground` | `#171a1f` | 카드 내부 텍스트 |
| 보조 배경 | `muted` | `#edf2ec` | 비활성 영역, 보조 패널 |
| 보조 텍스트 | `muted-foreground` | `#6b7280` | 설명, 캡션 |
| 경계선 | `border` | `#dfe4dc` | 카드, 입력창, 구분선 |
| 포커스 링 | `ring` | `rgba(47, 191, 113, 0.28)` | focus-visible |
| 주요 액센트 | emerald | `#34d399` | 연결 상태, 진행률, 강조 |
| 액센트 텍스트 | emerald dark | `#047857` | 초록 배지 텍스트 |
| 액센트 배경 | emerald soft | `#ecfdf5` | 성공/연결 배지 배경 |
| 보조 액센트 | lime | `#a3e635` | 작은 시각 보조 요소 |
| 오류 | red | `#dc2626` | 오류, 삭제, 위험 작업 |

### CSS 토큰

```css
@theme inline {
  --color-background: #f7f8f5;
  --color-foreground: #171a1f;
  --color-card: #ffffff;
  --color-card-foreground: #171a1f;
  --color-muted: #edf2ec;
  --color-muted-foreground: #6b7280;
  --color-border: #dfe4dc;
  --color-ring: rgba(47, 191, 113, 0.28);
  --font-sans: "Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", "Geist Mono Fallback", ui-monospace, monospace;
}
```

### 배경

앱 배경은 완전한 흰색이 아니라 따뜻한 그린-그레이 계열로 둔다. 아주 옅은 세로 그리드를 사용하면 작업실 느낌이 살아난다.

```css
body {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.82), rgba(247,248,245,0.96)),
    repeating-linear-gradient(90deg, rgba(23,26,31,0.025) 0 1px, transparent 1px 80px);
  color: var(--color-foreground);
  letter-spacing: 0;
}
```

## 5. 타이포그래피

### 기본

- 현재 앱은 `Geist`를 사용한다.
- 한글 비중이 높은 프로젝트는 `Pretendard`를 우선 검토해도 좋다.
- 어떤 폰트를 쓰더라도 letter spacing은 0을 기본으로 한다.
- viewport width에 따라 폰트 크기를 스케일하지 않는다.

### 크기 기준

| 용도 | 크기 | Tailwind 예시 |
| --- | --- | --- |
| 화면 제목 | 24-30px | `text-3xl max-md:text-2xl` |
| 카드 제목 | 16px | `text-base font-semibold` |
| 본문 | 13-14px | `text-sm` |
| 보조 설명 | 12px | `text-xs text-muted-foreground` |
| 배지/라벨 | 11-12px | `text-[11px]`, `text-xs font-bold` |

## 6. 레이아웃

### 기본 구조

- 데스크톱: 좌측 고정 사이드바 + 우측 작업 영역
- 모바일/좁은 화면: 사이드바를 상단 내비게이션처럼 접는다.
- 주요 화면은 보통 3단계로 구성한다.
  - `01 대시보드`
  - `02 작업 화면`
  - `03 결과 확인`

### 사이드바

- 너비: 240-264px
- 배경: `white/75` + `backdrop-blur`
- 경계선 없이 배경색만으로 구분한다
- 현재 메뉴: 차콜 배경, 오프화이트 텍스트, `rounded-2xl`
- 하단에 API 키 상태 한 줄

### 카드와 패널

> 1.5부터 부드러운 라운딩 방향으로 변경했다 (2026-08-16, 사용자 지시). 이전의 `rounded-md` 8px 이하 규칙은 폐기.

- 카드 radius는 `rounded-3xl`, 내부 블록과 입력은 `rounded-2xl`, 버튼과 칩은 `rounded-full`을 기본으로 한다.
- **경계선을 쓰지 않는다.** 구조는 흰 카드 + 아주 옅은 그림자 + 배경 색조 차이로 만든다.
- 입력 필드는 테두리 없이 `bg-muted/60` 채움으로 두고, 포커스 시 흰 배경 + 링으로 바꾼다.
- 화면 하나에 카드는 최대 2~3개. 선택 입력은 카드를 늘리지 말고 접기(Disclosure) 한 줄로 넣는다.
- 카드 그림자: `shadow-[0_1px_2px_rgba(23,26,31,0.03),0_12px_32px_-16px_rgba(23,26,31,0.12)]`

## 7. 컴포넌트 규칙

### 버튼

기본 버튼은 차콜 배경이다. 초록색은 버튼 전체보다 상태, 진행률, 선택 링에 더 많이 쓴다.

```tsx
const buttonBase =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors";
```

- Primary: `bg-foreground text-background`
- Secondary: `bg-muted text-foreground`
- Accent: `bg-emerald-50 text-emerald-800`
- Destructive: `bg-red-50 text-red-700`
- Ghost: `text-muted-foreground hover:bg-muted`

### 배지

- 연결 완료, 서버 연결, 완료 상태는 emerald soft 배지.
- 키 필요, 미설정, 대기 상태는 muted 배지.
- 배지는 항상 한 줄로 보이게 `whitespace-nowrap`를 사용한다.

### 입력창

- 테두리: `border-border`
- 배경: `bg-white`
- 높이: 기본 40px
- 설명 라벨은 `text-xs font-bold text-muted-foreground`

### 업로드 드롭존

- `border-dashed border-emerald-300 bg-white/60`
- 중앙 아이콘은 lucide 아이콘 사용
- 업로드 후 파일명은 작은 pill 형태로 표시

### 세그먼트 컨트롤

- 옵션은 2-4개까지 권장한다.
- 선택 상태는 차콜 배경 또는 emerald ring으로 표시한다.
- 모델 선택처럼 기술적 차이가 중요한 경우 내부 모델명은 작은 code 텍스트로만 표시한다.

### 프로그레스 모달

- 화면 중앙에 표시한다.
- 진행률, 경과 시간, 현재 단계, 취소 버튼을 함께 보여준다.
- 외부 API 대기 단계에서는 실패처럼 보이는 표현을 피하고 다음 표현을 쓴다.
  - `AI가 마무리 작업중.`
  - `AI가 이미지 최적화 작업을 진행중입니다.`
- 여러 장 생성 시에는 `7장 중 4번째 이미지 생성중입니다.`처럼 현재 순서를 명확히 쓴다.

### 토스트

- 오류 토스트는 자동으로 사라지지 않게 한다.
- 사용자가 복사하거나 읽을 수 있도록 우측 하단에 고정하고 닫기 버튼을 둔다.
- 성공/일반 알림은 짧게 자동 종료한다.

## 8. 아이콘

- 기본 아이콘은 `lucide-react`를 사용한다.
- 직접 SVG를 그리는 것은 브랜드 로고, 파비콘, 제품 미리보기 같은 예외에만 허용한다.
- 버튼 텍스트 앞 아이콘은 16px(`size-4`)를 기본으로 한다.
- 상태 카드나 업로드 영역의 아이콘은 20-24px를 사용한다.

## 9. UX 문구 톤

### 원칙

- 짧고 실무적으로 쓴다.
- 사용자가 다음에 해야 할 행동을 바로 알게 한다.
- 추상적인 가치 제안보다 현재 상태와 결과를 설명한다.
- 실패 메시지는 사라지지 않게 하고, 원인과 다음 행동을 함께 적는다.

### 좋은 예

- `아직 작업한 리디자인 작업이 없습니다.`
- `저장하면 대시보드의 최근 프로젝트에서 다시 열 수 있습니다.`
- `AI가 이미지 최적화 작업을 진행중입니다.`
- `접근 권한이 있는 프로젝트에서 발급한 API 키를 다시 입력해주세요.`

### 피할 표현

- `Next.js + shadcn으로 만든 앱`
- `원본 상세페이지와 요청사항을 조합해 6~8장 리디자인 결과를 생성`
- `마법처럼 완성됩니다`
- `AI가 완벽하게 분석했습니다`

## 10. 마법사 시리즈 화면 패턴

### 대시보드

- 최근 작업 목록
- 새 프로젝트 생성 CTA
- 연결 상태: API, 서버, 지식파일
- 작업이 없을 때는 빈 상태 메시지를 보여준다.

### 작업 화면

- 좌측 또는 중앙: 사용자가 제공하는 원본/요청사항
- 우측: 모델, 옵션, 채널, 지식 사용 여부
- 기술 설정은 필요할 때만 열리는 모달로 분리한다.

### 결과 화면

- 결과물을 먼저 보여준다.
- 각 결과 카드에는 개별 다운로드, 수정 요청, 모델 선택, 재생성 액션을 제공한다.
- 전체 저장/다운로드는 상단 액션으로 둔다.

## 11. 이미지 생성/AI 작업 UX

AI 작업이 오래 걸리는 제품에서는 다음 상태를 반드시 제공한다.

- 진행률
- 경과 시간
- 현재 단계
- 현재 생성 순서
- 취소 버튼
- 오래 걸릴 때 안내 문구
- 실패 시 지속되는 오류 메시지
- 성공 후 저장 또는 다운로드 경로

## 12. 새 프로젝트 적용 체크리스트

- [ ] 제품명은 `한이룸의 [도메인] 마법사 [버전]` 형식인가?
- [ ] 파비콘은 글자가 아니라 시리즈 심볼 중심인가?
- [ ] 첫 화면이 랜딩이 아니라 실제 작업 대시보드인가?
- [ ] 배경, 카드, 버튼, 배지 컬러 토큰을 동일하게 적용했는가?
- [ ] 카드 radius가 `rounded-3xl`이고 경계선 대신 그림자로 구조를 만들었는가?\n- [ ] 화면 폭이 넓어져도 콘텐츠가 늘어지지 않게 최대 폭(1240px)이 걸려 있는가?
- [ ] 불필요한 기술 스택명이 사용자 UI에 노출되지 않는가?
- [ ] 빈 상태, 로딩, 오류, 저장 상태가 모두 있는가?
- [ ] 오류 메시지는 사용자가 읽을 수 있을 만큼 유지되는가?
- [ ] 주요 액션은 차콜, 상태 강조는 emerald로 구분되는가?
- [ ] 모바일에서도 텍스트가 버튼/카드 밖으로 넘치지 않는가?

## 13. 복사용 브랜드 상수

```ts
export const HANIRUM_MAGIC_BRAND = {
  namePattern: "한이룸의 [도메인] 마법사 [버전]",
  colors: {
    background: "#f7f8f5",
    foreground: "#171a1f",
    card: "#ffffff",
    muted: "#edf2ec",
    mutedForeground: "#6b7280",
    border: "#dfe4dc",
    emerald: "#34d399",
    emeraldDark: "#047857",
    emeraldSoft: "#ecfdf5",
    lime: "#a3e635",
    destructive: "#dc2626"
  },
  radius: {
    control: "9999px",
    field: "16px",
    card: "24px",
    modal: "24px"
  },
  layout: {
    shellMaxWidth: "1240px",
    sidebarWidth: "220px"
  }
} as const;
```
