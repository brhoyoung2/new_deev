# 캐릭터챗 유저 코어 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 번호로 미디어를 부르는 세로 전체화면 캐릭터챗의 유저 측 코어 — 피드형 대화 화면과 리스트뷰가 실제 캐릭터 데이터로 도는 상태까지.

**Architecture:** Next.js 15 App Router. 브라우저 → `/api/chat`(Vercel, 팩 조회·프롬프트 조립·rate limit) → DGX vLLM SSE 스트리밍. 미디어는 브라우저가 CloudFront에 직결. 대화 기록은 localStorage에만. 계정 없음.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7, Tailwind v4, Supabase(@supabase/supabase-js), vitest, Node ≥20

**Spec:** `docs/superpowers/specs/2026-09-06-character-chat-mvp-design.md`

## Global Constraints

- 프로젝트 루트: `c:\Users\user\Downloads\code\new_deev`. 기존 `PROJECT_PLAN.md`, `TECH_STACK_AND_LIVE2D_OPTIONS.md`, `VTuber-Companion*` 파일과 폴더는 **읽지도 옮기지도 지우지도 않는다**
- Supabase 테이블 접두사는 `vt_`. 전용 프로젝트를 쓴다
- 코드 규격: `^[a-z0-9][a-z0-9_-]{0,62}$` (work_code, char_code)
- 미디어 주소: 정지 `{CDN}/{work}/{char}/{n}.webp`, 영상 `{CDN}/{work}/{char}/m/{n}.webp`
- 번호 의미: 착의 1~50, 성인 51~120. **줄 순서가 곧 번호다** — 목록 가운데에 끼워 넣지 않는다
- 서버 비밀값(`SUPABASE_SERVICE_ROLE_KEY`, `LLM_BASE_URL`)에는 `NEXT_PUBLIC_` 접두사를 붙이지 않는다
- 모든 사용자 대면 문구는 한국어
- 커밋 메시지 끝에 붙인다: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`

## 이 계획 밖

관리자뷰 6개 탭과 영상 업로더는 **별도 계획**이다. 이 계획에서 캐릭터는 시드 스크립트로 넣는다.
계정·결제·성인인증·TTS·장기기억도 이번 사이클 밖이다.

## File Structure

| 파일 | 책임 |
|---|---|
| `lib/env.ts` | 환경변수 읽기. 없으면 부팅 시점에 죽는다 |
| `lib/codes.ts` | 번호 ↔ 상황 이름 표. 순수 데이터 |
| `lib/pack.ts` | `CharacterPack` 타입 |
| `lib/media.ts` | 번호 → 주소. 영상 있으면 영상, 없으면 정지 |
| `lib/prompt.ts` | 팩 + 입력 → 시스템 프롬프트. 로어북 키워드 선택 |
| `lib/parseCode.ts` | 스트림 앞머리에서 번호 뽑기 |
| `lib/rateLimit.ts` | IP 버킷. deev에서 복사 |
| `lib/apiError.ts` | 에러 응답 규약. deev에서 복사 |
| `lib/supabase.ts` | service_role 클라이언트 |
| `lib/history.ts` | localStorage 대화 기록 |
| `app/api/characters/route.ts` | 공개 캐릭터 목록 |
| `app/api/chat/route.ts` | 대화 한 턴. SSE 프록시 |
| `app/page.tsx` | 화면 전환(피드 ↔ 리스트) |
| `components/Feed.tsx` | 대화 화면. 위로 밀어 캐릭터 전환 |
| `components/Stage.tsx` | 무대 — 미디어와 스크림 |
| `components/Caption.tsx` | 자막 두 줄 |
| `components/Composer.tsx` | 입력창 |
| `components/HistoryDrawer.tsx` | 기록 서랍 |
| `components/ListView.tsx` | 리스트뷰 |
| `supabase/migrations/0001_init.sql` | 테이블 + RLS |
| `scripts/seed.mjs` | 캐릭터 시드 |

---

### Task 1: 프로젝트 스캐폴드와 테스트 러너

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `lib/env.ts`
- Test: `tests/env.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `required(name: string): string`, `optional(name: string): string | undefined` — `lib/env.ts`에서 export

- [ ] **Step 1: git 저장소를 만들고 디렉터리를 잡는다**

```bash
cd "c:/Users/user/Downloads/code/new_deev"
git init
mkdir -p app components lib tests scripts supabase/migrations
```

- [ ] **Step 2: `package.json` 을 만든다**

```json
{
  "name": "vt-chat",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "seed": "node scripts/seed.mjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "next": "^15.1.6",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.3.3",
    "@types/node": "^22.10.5",
    "@types/react": "^19.0.7",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.7.3",
    "vitest": "^3.0.0"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 3: 설정 파일 넷을 만든다**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = { reactStrictMode: true }
export default nextConfig
```

`postcss.config.mjs`:

```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
})
```

- [ ] **Step 4: `.gitignore` 와 `.env.example` 을 만든다**

`.gitignore`:

```
node_modules/
.next/
.env.local
*.tsbuildinfo
next-env.d.ts
```

`.env.example`:

```
# Supabase — vt 전용 프로젝트
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# 미디어 CDN. 끝에 슬래시를 붙이지 않는다
NEXT_PUBLIC_CDN_BASE=https://dxxxxxxxx.cloudfront.net

# DGX vLLM — OpenAI 호환 엔드포인트. 끝에 슬래시를 붙이지 않는다
LLM_BASE_URL=
LLM_MODEL=
```

- [ ] **Step 5: 실패하는 테스트를 쓴다**

`tests/env.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { required, optional } from '@/lib/env'

describe('env', () => {
  const saved = process.env.VT_TEST_KEY

  beforeEach(() => { delete process.env.VT_TEST_KEY })
  afterEach(() => {
    if (saved === undefined) delete process.env.VT_TEST_KEY
    else process.env.VT_TEST_KEY = saved
  })

  it('값이 있으면 그대로 돌려준다', () => {
    process.env.VT_TEST_KEY = 'abc'
    expect(required('VT_TEST_KEY')).toBe('abc')
  })

  it('값이 없으면 이름을 담아 던진다', () => {
    expect(() => required('VT_TEST_KEY')).toThrow('VT_TEST_KEY')
  })

  it('빈 문자열도 없는 것으로 본다', () => {
    process.env.VT_TEST_KEY = '   '
    expect(() => required('VT_TEST_KEY')).toThrow()
  })

  it('optional 은 없으면 undefined 를 준다', () => {
    expect(optional('VT_TEST_KEY')).toBeUndefined()
  })
})
```

- [ ] **Step 6: 의존성을 설치하고 테스트가 실패하는 것을 확인한다**

```bash
npm install
npx vitest run tests/env.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/env"`

- [ ] **Step 7: `lib/env.ts` 를 만든다**

```ts
/**
 * 환경변수 읽기.
 *
 * 값이 없으면 그 자리에서 던진다. 빈 문자열로 조용히 굴러가면
 * 나중에 "왜 401이 나지"를 한참 뒤에 알게 된다.
 */
export function required(name: string): string {
  const v = process.env[name]
  if (!v || !v.trim()) {
    throw new Error(`환경변수 ${name} 가 비어 있습니다. .env.local 을 확인하세요.`)
  }
  return v.trim()
}

export function optional(name: string): string | undefined {
  const v = process.env[name]
  return v && v.trim() ? v.trim() : undefined
}
```

- [ ] **Step 8: 테스트가 통과하는지 확인한다**

```bash
npx vitest run tests/env.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 9: 앱 껍데기를 만든다**

`app/globals.css`:

```css
@import "tailwindcss";

:root { color-scheme: dark; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #16121C;
  color: #EDE6F2;
  font-family: -apple-system, "Malgun Gothic", sans-serif;
  overscroll-behavior: none;
}
```

`app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = { title: '그리드' }
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
```

`app/page.tsx` (자리만 잡는다. Task 10에서 채운다):

```tsx
export default function Home() {
  return <main style={{ padding: 24 }}>준비 중</main>
}
```

- [ ] **Step 10: 타입 검사와 빌드를 확인한다**

```bash
npm run typecheck
npm run build
```

Expected: 둘 다 통과

- [ ] **Step 11: 커밋**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: Next.js 15 스캐폴드와 vitest 설정

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 번호 코드표

**Files:**
- Create: `lib/codes.ts`
- Test: `tests/codes.test.ts`
- Read-only 참조: `c:/Users/user/Downloads/code/deev_character_gen/lib/plan/imageCodes.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `BASIC_50: readonly string[]` — 50개
  - `ADULT_70: readonly string[]` — 70개
  - `ALL_120: readonly string[]`
  - `codeOf(label: string): number | null` — 이름 → 번호(1-based). 없으면 null
  - `labelOf(code: number): string | null` — 번호 → 이름

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/codes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { BASIC_50, ADULT_70, ALL_120, codeOf, labelOf } from '@/lib/codes'

describe('codes', () => {
  it('착의 50개, 성인 70개, 합쳐 120개다', () => {
    expect(BASIC_50).toHaveLength(50)
    expect(ADULT_70).toHaveLength(70)
    expect(ALL_120).toHaveLength(120)
  })

  it('붙박은 번호가 흔들리지 않는다', () => {
    expect(labelOf(1)).toBe('기본')
    expect(labelOf(2)).toBe('미소')
    expect(labelOf(9)).toBe('경청')
    expect(labelOf(31)).toBe('두근')
    expect(labelOf(46)).toBe('기다림')
    expect(labelOf(50)).toBe('말없이기댐')
  })

  it('성인은 51번부터 시작한다', () => {
    expect(labelOf(51)).toBe(ADULT_70[0])
    expect(labelOf(120)).toBe(ADULT_70[69])
  })

  it('이름으로 번호를 찾는다', () => {
    expect(codeOf('두근')).toBe(31)
    expect(codeOf('기본')).toBe(1)
  })

  it('공백은 무시하고 찾는다', () => {
    expect(codeOf('  두근 ')).toBe(31)
  })

  it('표에 없는 이름은 null 이다 — 짐작하지 않는다', () => {
    expect(codeOf('창밖보기')).toBeNull()
    expect(codeOf('')).toBeNull()
  })

  it('범위 밖 번호는 null 이다', () => {
    expect(labelOf(0)).toBeNull()
    expect(labelOf(121)).toBeNull()
    expect(labelOf(-1)).toBeNull()
  })

  it('이름이 겹치지 않는다 — 겹치면 번호가 흔들린다', () => {
    expect(new Set(ALL_120).size).toBe(120)
  })
})
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

```bash
npx vitest run tests/codes.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/codes"`

- [ ] **Step 3: `lib/codes.ts` 를 만든다**

`BASIC_50` 은 아래 그대로 쓴다.

```ts
/**
 * 번호 ↔ 상황 이름.
 *
 * 대화 화면은 번호만 보고 그림을 찾는다:
 *   {CDN}/{work}/{char}/{n}.webp
 *
 * 그래서 번호의 뜻은 인물이 누구든, 언제 올리든 같아야 한다.
 * **줄 순서가 곧 번호다.** 가운데에 끼워 넣으면 그 아래가 전부 한 칸씩
 * 밀려서 이미 올린 그림의 뜻이 바뀐다. 더할 것은 끝에 붙인다.
 */

/** 착의 50 — 번호 1~50 */
export const BASIC_50: readonly string[] = [
  '기본', '미소', '기쁨', '슬픔', '놀람',
  '화남', '부끄러움', '당황', '경청', '끄덕임',
  '고개저음', '질문', '의문', '살짝미소', '큰미소',
  '살짝기쁨', '큰기쁨', '살짝부끄러움', '크게부끄러움', '크게당황',
  '살짝기대', '기대', '큰기대', '살짝긴장', '긴장',
  '크게긴장', '삐짐', '질투', '유혹A', '유혹B',
  '두근', '부끄러운진심', '가까이응시', '다가옴A', '다가옴B',
  '눈맞춤', '올려다봄', '가까이속삭임', '머리카락넘김', '방심',
  '잠든모습', '막일어남', '젖은머리', '취한모습', '무너지는순간',
  '기다림', '독점욕', '질투숨김', '고백', '말없이기댐',
]
```

`ADULT_70` 은 **원본에서 그대로 옮긴다.** 손으로 다시 치면 순서가 틀어지고,
순서가 틀어지면 이미 올라간 그림의 뜻이 바뀐다. 다음 명령으로 배열 리터럴을 뽑아
`lib/codes.ts` 에 `export const ADULT_70: readonly string[] = [...]` 로 붙인다:

```bash
sed -n '/export const ADULT_70/,/^]/p' \
  "c:/Users/user/Downloads/code/deev_character_gen/lib/plan/imageCodes.ts"
```

이어서 파생 값과 조회 함수를 붙인다:

```ts
export const ALL_120: readonly string[] = [...BASIC_50, ...ADULT_70]

const CODE_BY_NAME = new Map<string, number>(
  ALL_120.map((label, i) => [label, i + 1]),
)

/** 상황 이름을 번호로. 표에 없으면 null — 짐작해서 번호를 주지 않는다. */
export function codeOf(label: string): number | null {
  const key = label.trim()
  if (!key) return null
  return CODE_BY_NAME.get(key) ?? null
}

/** 번호를 상황 이름으로. 범위 밖이면 null. */
export function labelOf(code: number): string | null {
  if (!Number.isInteger(code) || code < 1 || code > ALL_120.length) return null
  return ALL_120[code - 1]
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npx vitest run tests/codes.test.ts
```

Expected: PASS (8 tests). `ADULT_70` 길이가 70이 아니면 옮기다 빠뜨린 것이다 — 다시 옮긴다.

- [ ] **Step 5: 커밋**

```bash
git add lib/codes.ts tests/codes.test.ts
git commit -m "$(cat <<'EOF'
feat: 번호 코드표 — 착의 50 + 성인 70

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 팩 타입과 미디어 해석

**Files:**
- Create: `lib/pack.ts`, `lib/media.ts`
- Test: `tests/media.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `CharacterPack` 타입 (`lib/pack.ts`)
  - `Character` 타입 — `{ workCode: string; charCode: string; pack: CharacterPack }`
  - `resolveMedia(c: Character, code: number, cdnBase: string): { url: string; motion: boolean } | null` (`lib/media.ts`)
  - `mediaBase(c: Character, cdnBase: string): string`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/media.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveMedia, mediaBase } from '@/lib/media'
import type { Character } from '@/lib/pack'

const CDN = 'https://d1.cloudfront.net'

const hosi: Character = {
  workCode: 'grid',
  charCode: 'hosi',
  pack: {
    name: '호시',
    intro: '회사 후배',
    characterInfo: '#캐릭터',
    prologue: '*불이 꺼진다*',
    background: '',
    firstMedia: null,
    loreBooks: [],
    genre: 'Romance',
    target: '남성',
    rating: 'free',
    tags: [],
    have: [1, 2, 9, 31],
    haveMotion: [1, 31],
  },
}

describe('resolveMedia', () => {
  it('영상이 있으면 영상을 준다', () => {
    expect(resolveMedia(hosi, 31, CDN)).toEqual({
      url: 'https://d1.cloudfront.net/grid/hosi/m/31.webp',
      motion: true,
    })
  })

  it('영상이 없으면 정지 이미지를 준다', () => {
    expect(resolveMedia(hosi, 9, CDN)).toEqual({
      url: 'https://d1.cloudfront.net/grid/hosi/9.webp',
      motion: false,
    })
  })

  it('가진 컷이 아니면 null 이다', () => {
    expect(resolveMedia(hosi, 46, CDN)).toBeNull()
  })

  it('영상이 하나도 없는 캐릭터도 성립한다', () => {
    const seorin: Character = {
      ...hosi,
      charCode: 'seorin',
      pack: { ...hosi.pack, have: [1], haveMotion: [] },
    }
    expect(resolveMedia(seorin, 1, CDN)).toEqual({
      url: 'https://d1.cloudfront.net/grid/seorin/1.webp',
      motion: false,
    })
  })

  it('CDN 주소 끝의 슬래시를 흘리지 않는다', () => {
    expect(mediaBase(hosi, 'https://d1.cloudfront.net/')).toBe(
      'https://d1.cloudfront.net/grid/hosi',
    )
  })
})
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

```bash
npx vitest run tests/media.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/media"`

- [ ] **Step 3: `lib/pack.ts` 를 만든다**

```ts
/** 로어북 한 항목. 키워드가 그 턴 입력에 나오면 실린다. */
export interface LoreBook {
  title: string
  keywords: string[]
  content: string
}

/** 인트로로 먼저 보여줄 컷. 없으면 null. */
export interface FirstMedia {
  kind: 'motion' | 'still'
  n: number
}

export interface CharacterPack {
  name: string
  intro: string
  characterInfo: string
  prologue: string
  background: string
  firstMedia: FirstMedia | null
  loreBooks: LoreBook[]
  genre: string
  target: string
  /** safe | free(19+) */
  rating: 'safe' | 'free'
  tags: string[]
  /** 정지 이미지가 올라간 번호 */
  have: number[]
  /** 움직이는 webp 가 올라간 번호. have 의 부분집합이다 */
  haveMotion: number[]
}

export interface Character {
  workCode: string
  charCode: string
  pack: CharacterPack
}
```

- [ ] **Step 4: `lib/media.ts` 를 만든다**

```ts
import type { Character } from './pack'

/** 이 캐릭터의 미디어 주소 앞부분. 끝에 슬래시를 붙이지 않는다. */
export function mediaBase(c: Character, cdnBase: string): string {
  return `${cdnBase.replace(/\/+$/, '')}/${c.workCode}/${c.charCode}`
}

/**
 * 번호를 주소로 바꾼다.
 *
 * 규칙은 한 줄이다 — **영상이 있으면 영상, 없으면 정지.**
 * 유저가 고를 것도, 서버가 기억할 상태도 없다.
 * 가지고 있지 않은 번호면 null 을 준다. 부르는 쪽이 직전 컷을 유지한다.
 */
export function resolveMedia(
  c: Character,
  code: number,
  cdnBase: string,
): { url: string; motion: boolean } | null {
  if (!c.pack.have.includes(code)) return null
  const base = mediaBase(c, cdnBase)
  const motion = c.pack.haveMotion.includes(code)
  return {
    url: motion ? `${base}/m/${code}.webp` : `${base}/${code}.webp`,
    motion,
  }
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

```bash
npx vitest run tests/media.test.ts
npm run typecheck
```

Expected: PASS (5 tests), 타입 검사 통과

- [ ] **Step 6: 커밋**

```bash
git add lib/pack.ts lib/media.ts tests/media.test.ts
git commit -m "$(cat <<'EOF'
feat: 캐릭터 팩 타입과 번호 → 미디어 주소 해석

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Supabase 스키마와 시드

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `lib/supabase.ts`, `scripts/seed.mjs`, `scripts/characters/hosi.json`

**Interfaces:**
- Consumes: `required` (`lib/env.ts`), `CharacterPack` (`lib/pack.ts`)
- Produces: `db()` — service_role Supabase 클라이언트를 돌려주는 함수 (`lib/supabase.ts`)

- [ ] **Step 1: 마이그레이션을 쓴다**

`supabase/migrations/0001_init.sql`:

```sql
-- 캐릭터챗 유저 코어 — 테이블과 RLS
-- 적용: Supabase 대시보드 → SQL Editor → 이 파일 전체 붙여넣기 → Run

create table if not exists vt_characters (
  id          bigint generated always as identity primary key,
  work_code   text not null,
  char_code   text not null,
  pack        jsonb not null,
  published   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint vt_characters_work_code_fmt check (work_code ~ '^[a-z0-9][a-z0-9_-]{0,62}$'),
  constraint vt_characters_char_code_fmt check (char_code ~ '^[a-z0-9][a-z0-9_-]{0,62}$'),
  constraint vt_characters_unique unique (work_code, char_code)
);

create index if not exists vt_characters_published_idx
  on vt_characters (published, sort_order);

-- 관리자 세션 — 다음 계획(관리자뷰)에서 쓴다. 지금 만들어 두면 마이그레이션이 한 번으로 끝난다.
create table if not exists vt_admin_sessions (
  token       text primary key,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists vt_admin_sessions_expiry_idx
  on vt_admin_sessions (expires_at);

-- RLS 는 켜되 정책을 두지 않는다 = anon 키로는 아무것도 못 읽는다.
-- 서버 라우트(service_role)만 읽고 쓴다.
alter table vt_characters    enable row level security;
alter table vt_admin_sessions enable row level security;
```

- [ ] **Step 2: `lib/supabase.ts` 를 만든다**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { required } from './env'

let cached: SupabaseClient | null = null

/**
 * service_role 클라이언트.
 *
 * **서버에서만 부른다.** 이 키가 브라우저로 나가면 RLS 가 무의미해진다.
 */
export function db(): SupabaseClient {
  if (cached) return cached
  cached = createClient(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } },
  )
  return cached
}
```

- [ ] **Step 3: 시드용 캐릭터 팩을 만든다**

`scripts/characters/hosi.json`:

```json
{
  "workCode": "grid",
  "charCode": "hosi",
  "sortOrder": 1,
  "published": true,
  "pack": {
    "name": "호시",
    "intro": "야근이 끝나도 굳이 같은 지하철을 타는 회사 후배. 묻기 전에는 아무 말도 안 한다.",
    "characterInfo": "#캐릭터\n이름 : 호시\n관계 : {{user}}와 같은 팀에 온 지 반년 된 후배\n말투 : 존댓말. 말끝을 흐린다. 먼저 묻지 않는다\n성격 : 조용하고 눈치가 빠르다. 속마음을 늦게 꺼낸다\n금기 : 자신이 AI임을 밝히지 않는다",
    "prologue": "*사무실 불이 하나둘 꺼진다. 남은 건 둘뿐이고, 호시는 아직 가방을 싸지 않았다.*\n호시 | …선배도 아직 안 갔네요.",
    "background": "야근이 잦은 팀. 둘만 남는 밤이 반복되면서 어색한 침묵이 익숙해졌다.",
    "firstMedia": { "kind": "motion", "n": 1 },
    "loreBooks": [
      {
        "title": "같은 지하철",
        "keywords": ["지하철", "퇴근", "집", "역"],
        "content": "호시는 집 방향이 반대인데도 {{user}}와 같은 지하철을 탄다. 들킨 적은 없다."
      }
    ],
    "genre": "Romance",
    "target": "남성",
    "rating": "free",
    "tags": ["직장후배", "존댓말", "야근", "서툰고백"],
    "have": [1, 2, 9, 12, 14, 18, 31, 36, 46],
    "haveMotion": [1, 2, 18, 31, 46]
  }
}
```

- [ ] **Step 4: 시드 스크립트를 쓴다**

`scripts/seed.mjs`:

```js
/**
 * 캐릭터 팩을 vt_characters 에 밀어 넣는다.
 *
 *   node scripts/seed.mjs            scripts/characters/*.json 전부
 *   node scripts/seed.mjs hosi       하나만
 *
 * 같은 (work_code, char_code) 가 있으면 덮어쓴다.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

for (const line of readFileSync(join(root, '.env.local'), 'utf8').split('\n')) {
  const t = line.trim()
  if (!t || t.startsWith('#') || !t.includes('=')) continue
  const i = t.indexOf('=')
  process.env[t.slice(0, i)] = t.slice(i + 1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.')
  process.exit(1)
}

const supa = createClient(url, key, { auth: { persistSession: false } })
const only = process.argv[2]
const dir = join(here, 'characters')
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .filter((f) => (only ? f === `${only}.json` : true))

if (files.length === 0) {
  console.error('넣을 캐릭터가 없습니다:', dir)
  process.exit(1)
}

for (const f of files) {
  const c = JSON.parse(readFileSync(join(dir, f), 'utf8'))

  // haveMotion 은 have 의 부분집합이어야 한다. 아니면 화면이 빈 주소를 부른다.
  const stray = c.pack.haveMotion.filter((n) => !c.pack.have.includes(n))
  if (stray.length) {
    console.error(`${f}: haveMotion 에 have 에 없는 번호가 있습니다 —`, stray)
    process.exit(1)
  }

  const { error } = await supa.from('vt_characters').upsert(
    {
      work_code: c.workCode,
      char_code: c.charCode,
      pack: c.pack,
      published: c.published ?? false,
      sort_order: c.sortOrder ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'work_code,char_code' },
  )

  if (error) {
    console.error(`${f}: 실패 —`, error.message)
    process.exit(1)
  }
  console.log(`${f}: ${c.workCode}/${c.charCode} 넣었습니다`)
}
```

- [ ] **Step 5: 실제로 넣어 본다**

먼저 Supabase 대시보드에서 `0001_init.sql` 을 실행한다(DDL 은 REST 로 못 돈다).
그다음 `.env.example` 을 `.env.local` 로 복사해 값을 채우고:

```bash
npm run seed
```

Expected: `hosi.json: grid/hosi 넣었습니다`

- [ ] **Step 6: 커밋**

```bash
git add supabase lib/supabase.ts scripts
git commit -m "$(cat <<'EOF'
feat: vt_characters 스키마와 캐릭터 시드 스크립트

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 캐릭터 목록 API

**Files:**
- Create: `lib/apiError.ts`, `lib/rateLimit.ts`, `app/api/characters/route.ts`
- Test: `tests/rateLimit.test.ts`
- Read-only 참조: `c:/Users/user/Downloads/code/deev_character_gen/lib/casting/rateLimit.ts`, `apiError.ts`

**Interfaces:**
- Consumes: `db()` (`lib/supabase.ts`), `Character` (`lib/pack.ts`)
- Produces:
  - `checkRateLimit(req: Request, key: string, limit: number): string | null` (`lib/rateLimit.ts`)
  - `fail(message: string, status?: number): Response`, `ok(data: unknown): Response` (`lib/apiError.ts`)
  - `GET /api/characters` → `{ characters: Character[] }`

- [ ] **Step 1: `lib/rateLimit.ts` 를 원본에서 옮긴다**

`c:/Users/user/Downloads/code/deev_character_gen/lib/casting/rateLimit.ts` 를 그대로 복사한다.
검증된 코드이고, 특히 위조 IP 로 버킷이 무한히 늘지 않게 막는 부분이 중요하다.

- [ ] **Step 2: 옮겨 온 것이 도는지 테스트를 쓴다**

`tests/rateLimit.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/rateLimit'

function req(ip: string): Request {
  return new Request('https://x.test/', { headers: { 'x-forwarded-for': ip } })
}

describe('checkRateLimit', () => {
  it('한도 안에서는 통과시킨다', () => {
    expect(checkRateLimit(req('1.1.1.1'), 'k1', 3)).toBeNull()
    expect(checkRateLimit(req('1.1.1.1'), 'k1', 3)).toBeNull()
    expect(checkRateLimit(req('1.1.1.1'), 'k1', 3)).toBeNull()
  })

  it('한도를 넘으면 한국어 안내를 준다', () => {
    for (let i = 0; i < 3; i++) checkRateLimit(req('2.2.2.2'), 'k2', 3)
    const msg = checkRateLimit(req('2.2.2.2'), 'k2', 3)
    expect(msg).toContain('요청이 너무 많습니다')
  })

  it('IP 가 다르면 버킷이 갈린다', () => {
    for (let i = 0; i < 5; i++) checkRateLimit(req('3.3.3.3'), 'k3', 3)
    expect(checkRateLimit(req('4.4.4.4'), 'k3', 3)).toBeNull()
  })
})
```

- [ ] **Step 3: 테스트를 돌린다**

```bash
npx vitest run tests/rateLimit.test.ts
```

Expected: PASS (3 tests). 실패하면 옮기다 빠뜨린 것이다.

- [ ] **Step 4: `lib/apiError.ts` 를 만든다**

```ts
/**
 * 응답 규약.
 *
 * 에러는 브라우저가 그대로 사람에게 보여줄 수 있는 한국어 한 문장이다.
 * 스택이나 내부 사정은 담지 않는다.
 */
export function fail(message: string, status = 400): Response {
  return Response.json({ error: message }, { status })
}

export function ok(data: unknown): Response {
  return Response.json(data)
}
```

- [ ] **Step 5: `app/api/characters/route.ts` 를 만든다**

```ts
import { db } from '@/lib/supabase'
import { fail, ok } from '@/lib/apiError'
import { checkRateLimit } from '@/lib/rateLimit'
import type { Character } from '@/lib/pack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const limited = checkRateLimit(req, 'characters', 60)
  if (limited) return fail(limited, 429)

  const { data, error } = await db()
    .from('vt_characters')
    .select('work_code, char_code, pack')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  if (error) return fail('캐릭터를 불러오지 못했습니다.', 500)

  const characters: Character[] = (data ?? []).map((r) => ({
    workCode: r.work_code as string,
    charCode: r.char_code as string,
    pack: r.pack as Character['pack'],
  }))

  return ok({ characters })
}
```

- [ ] **Step 6: 실제로 불러 본다**

```bash
npm run dev
```

다른 터미널에서:

```bash
curl -s http://localhost:3000/api/characters
```

Expected: `{"characters":[{"workCode":"grid","charCode":"hosi","pack":{…}}]}`

- [ ] **Step 7: 커밋**

```bash
git add lib/rateLimit.ts lib/apiError.ts app/api/characters tests/rateLimit.test.ts
git commit -m "$(cat <<'EOF'
feat: 캐릭터 목록 API 와 요청 제한

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 시스템 프롬프트 조립

**Files:**
- Create: `lib/prompt.ts`
- Test: `tests/prompt.test.ts`

**Interfaces:**
- Consumes: `Character`, `LoreBook` (`lib/pack.ts`), `labelOf` (`lib/codes.ts`)
- Produces:
  - `pickLore(books: LoreBook[], text: string): LoreBook[]`
  - `codeTable(have: number[]): string`
  - `buildSystemPrompt(c: Character, userText: string): string`

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/prompt.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, pickLore, codeTable } from '@/lib/prompt'
import type { Character, LoreBook } from '@/lib/pack'

const books: LoreBook[] = [
  { title: '같은 지하철', keywords: ['지하철', '퇴근'], content: '집 방향이 반대다.' },
  { title: '고양이', keywords: ['고양이'], content: '고양이를 키운다.' },
]

const c: Character = {
  workCode: 'grid',
  charCode: 'hosi',
  pack: {
    name: '호시',
    intro: '회사 후배',
    characterInfo: '#캐릭터\n이름 : 호시',
    prologue: '*불이 꺼진다*',
    background: '야근이 잦은 팀.',
    firstMedia: null,
    loreBooks: books,
    genre: 'Romance',
    target: '남성',
    rating: 'free',
    tags: [],
    have: [1, 2, 31],
    haveMotion: [31],
  },
}

describe('pickLore', () => {
  it('키워드가 나온 항목만 고른다', () => {
    const got = pickLore(books, '오늘 지하철 늦었어')
    expect(got).toHaveLength(1)
    expect(got[0].title).toBe('같은 지하철')
  })

  it('키워드가 없으면 아무것도 싣지 않는다', () => {
    expect(pickLore(books, '밥 먹었어?')).toHaveLength(0)
  })

  it('여러 항목이 걸리면 모두 고른다', () => {
    expect(pickLore(books, '지하철에서 고양이를 봤어')).toHaveLength(2)
  })
})

describe('codeTable', () => {
  it('가진 번호만 이름과 함께 늘어놓는다', () => {
    expect(codeTable([1, 2, 31])).toBe('1기본 2미소 31두근')
  })

  it('표에 없는 번호는 빼고 만든다', () => {
    expect(codeTable([1, 999])).toBe('1기본')
  })
})

describe('buildSystemPrompt', () => {
  it('캐릭터 정보와 배경을 담는다', () => {
    const p = buildSystemPrompt(c, '안녕')
    expect(p).toContain('이름 : 호시')
    expect(p).toContain('야근이 잦은 팀.')
  })

  it('가진 번호만 코드표에 싣는다 — 없는 번호를 부르면 빈 화면이 된다', () => {
    const p = buildSystemPrompt(c, '안녕')
    expect(p).toContain('1기본 2미소 31두근')
    expect(p).not.toContain('9경청')
  })

  it('번호로 시작하라는 규칙을 담는다', () => {
    expect(buildSystemPrompt(c, '안녕')).toContain('번호')
  })

  it('키워드가 나온 로어북만 싣는다', () => {
    expect(buildSystemPrompt(c, '지하철')).toContain('집 방향이 반대다.')
    expect(buildSystemPrompt(c, '안녕')).not.toContain('집 방향이 반대다.')
  })
})
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

```bash
npx vitest run tests/prompt.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/prompt"`

- [ ] **Step 3: `lib/prompt.ts` 를 만든다**

```ts
import type { Character, LoreBook } from './pack'
import { labelOf } from './codes'

/**
 * 이번 턴 입력에 키워드가 나온 로어북만 고른다.
 *
 * 전부 실으면 캐릭터가 늘수록 프롬프트가 부풀고, 정작 중요한 설정이 뒤로 밀린다.
 * 키워드가 나온 턴에만 실어 토큰을 아낀다.
 */
export function pickLore(books: LoreBook[], text: string): LoreBook[] {
  return books.filter((b) => b.keywords.some((k) => k.trim() && text.includes(k.trim())))
}

/**
 * 코드표 한 줄.
 *
 * **가진 번호만 싣는다.** 없는 번호를 모델이 부르면 화면이 빈다.
 */
export function codeTable(have: number[]): string {
  return have
    .map((n) => {
      const label = labelOf(n)
      return label ? `${n}${label.replace(/\s+/g, '')}` : null
    })
    .filter((x): x is string => x !== null)
    .join(' ')
}

export function buildSystemPrompt(c: Character, userText: string): string {
  const p = c.pack
  const lore = pickLore(p.loreBooks, userText)

  const parts: string[] = [
    '너는 아래 캐릭터를 연기한다. 캐릭터 밖으로 나가지 않는다.',
    '',
    '[캐릭터]',
    p.characterInfo,
  ]

  if (p.background.trim()) {
    parts.push('', '[배경 상황]', p.background)
  }

  parts.push(
    '',
    '[출력 규칙]',
    '- 응답은 반드시 아래 감정 코드의 번호 하나로 시작한다. 번호 뒤에 공백 하나를 두고 대사를 잇는다.',
    '  예: 31 저는… 그냥, 기다렸어요.',
    '- 목록에 없는 번호는 쓰지 않는다.',
    '- 한국어로 답한다. 한 번에 두세 문장을 넘기지 않는다.',
    '',
    '[감정 코드]',
    codeTable(p.have),
  )

  if (lore.length) {
    parts.push('', '[설정]')
    for (const b of lore) parts.push(`${b.title}: ${b.content}`)
  }

  return parts.join('\n')
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npx vitest run tests/prompt.test.ts
```

Expected: PASS (9 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/prompt.ts tests/prompt.test.ts
git commit -m "$(cat <<'EOF'
feat: 시스템 프롬프트 조립 — 코드표와 키워드 로어북

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: 스트림에서 번호 뽑기

**Files:**
- Create: `lib/parseCode.ts`
- Test: `tests/parseCode.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `createCodeReader(): { push(chunk: string): { code: number | null; text: string } }`

번호는 응답 맨 앞에 오는데, 스트리밍이라 `"3"` 과 `"1 "` 로 쪼개져 도착할 수 있다.
그래서 상태를 가진 리더가 필요하다.

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/parseCode.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createCodeReader } from '@/lib/parseCode'

describe('createCodeReader', () => {
  it('한 덩어리로 오면 번호와 대사를 가른다', () => {
    const r = createCodeReader()
    expect(r.push('31 저는… 기다렸어요.')).toEqual({
      code: 31,
      text: '저는… 기다렸어요.',
    })
  })

  it('번호가 쪼개져 와도 이어 붙여 읽는다', () => {
    const r = createCodeReader()
    expect(r.push('3')).toEqual({ code: null, text: '' })
    expect(r.push('1 저는')).toEqual({ code: 31, text: '저는' })
    expect(r.push('… 기다렸어요.')).toEqual({ code: null, text: '… 기다렸어요.' })
  })

  it('앞의 공백과 줄바꿈을 흘린다', () => {
    const r = createCodeReader()
    expect(r.push('\n  2 미소를 짓는다')).toEqual({ code: 2, text: '미소를 짓는다' })
  })

  it('번호 없이 시작하면 전부 대사로 흘린다 — 화면을 비우지 않는다', () => {
    const r = createCodeReader()
    expect(r.push('안녕하세요, 선배.')).toEqual({ code: null, text: '안녕하세요, 선배.' })
  })

  it('번호를 한 번 읽은 뒤에는 숫자를 대사로 흘린다', () => {
    const r = createCodeReader()
    r.push('9 ')
    expect(r.push('7시에 만나요')).toEqual({ code: null, text: '7시에 만나요' })
  })

  it('세 자리 번호도 읽는다', () => {
    const r = createCodeReader()
    expect(r.push('120 …')).toEqual({ code: 120, text: '…' })
  })
})
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

```bash
npx vitest run tests/parseCode.test.ts
```

Expected: FAIL — `Failed to resolve import "@/lib/parseCode"`

- [ ] **Step 3: `lib/parseCode.ts` 를 만든다**

```ts
/**
 * 스트림 앞머리에서 번호를 뽑는다.
 *
 * 응답은 "31 저는… 기다렸어요." 처럼 번호로 시작한다. 그런데 스트리밍이라
 * "3" 과 "1 저는" 으로 쪼개져 도착한다. 그래서 번호를 다 읽을 때까지
 * 앞부분을 물고 있어야 한다.
 *
 * 번호가 없으면 **전부 대사로 흘린다.** 파싱 실패가 화면을 비우면 안 된다 —
 * 부르는 쪽이 직전 컷을 그대로 두면 된다.
 */
export function createCodeReader() {
  let head = ''
  let done = false

  return {
    push(chunk: string): { code: number | null; text: string } {
      if (done) return { code: null, text: chunk }

      head += chunk

      const m = /^\s*(\d{1,3})(\s)([\s\S]*)$/.exec(head)
      if (m) {
        done = true
        return { code: Number(m[1]), text: m[3] }
      }

      // 아직 숫자를 읽는 중이면 더 기다린다.
      if (/^\s*\d{1,3}$/.test(head)) return { code: null, text: '' }

      // 숫자로 시작하지 않는다 — 번호가 없는 응답이다.
      done = true
      const text = head
      head = ''
      return { code: null, text }
    },
  }
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npx vitest run tests/parseCode.test.ts
```

Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/parseCode.ts tests/parseCode.test.ts
git commit -m "$(cat <<'EOF'
feat: 스트리밍 응답에서 번호 읽기

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: 대화 API — SSE 프록시

**Files:**
- Create: `app/api/chat/route.ts`
- Test: `tests/chatBody.test.ts`
- Modify: `lib/prompt.ts` (변경 없음 — 사용만 한다)

**Interfaces:**
- Consumes: `db()`, `buildSystemPrompt`, `checkRateLimit`, `fail`, `required`
- Produces:
  - `parseChatBody(raw: unknown): { workCode: string; charCode: string; message: string; history: Turn[] } | string` — 문자열을 돌려주면 그게 에러 메시지다
  - `type Turn = { role: 'user' | 'assistant'; content: string }`
  - `POST /api/chat` → `text/event-stream`

- [ ] **Step 1: 본문 검증 테스트를 쓴다**

`tests/chatBody.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseChatBody } from '@/app/api/chat/route'

describe('parseChatBody', () => {
  it('제대로 된 본문을 통과시킨다', () => {
    const got = parseChatBody({
      workCode: 'grid',
      charCode: 'hosi',
      message: '안녕',
      history: [{ role: 'user', content: '이전' }],
    })
    expect(got).toEqual({
      workCode: 'grid',
      charCode: 'hosi',
      message: '안녕',
      history: [{ role: 'user', content: '이전' }],
    })
  })

  it('history 가 없으면 빈 배열로 채운다', () => {
    const got = parseChatBody({ workCode: 'grid', charCode: 'hosi', message: '안녕' })
    expect(typeof got).not.toBe('string')
    expect((got as { history: unknown[] }).history).toEqual([])
  })

  it('빈 메시지는 막는다', () => {
    expect(parseChatBody({ workCode: 'grid', charCode: 'hosi', message: '  ' }))
      .toBe('메시지를 입력해주세요.')
  })

  it('너무 긴 메시지는 막는다', () => {
    const long = 'ㄱ'.repeat(2001)
    expect(parseChatBody({ workCode: 'grid', charCode: 'hosi', message: long }))
      .toContain('너무 깁니다')
  })

  it('코드 형식이 틀리면 막는다', () => {
    expect(parseChatBody({ workCode: 'GRID', charCode: 'hosi', message: '안녕' }))
      .toBe('잘못된 요청입니다.')
  })

  it('기록은 최근 12턴만 남긴다 — 프롬프트가 부풀지 않게', () => {
    const history = Array.from({ length: 30 }, (_, i) => ({
      role: 'user' as const,
      content: String(i),
    }))
    const got = parseChatBody({ workCode: 'grid', charCode: 'hosi', message: '안녕', history })
    expect((got as { history: unknown[] }).history).toHaveLength(12)
    expect((got as { history: { content: string }[] }).history[0].content).toBe('18')
  })

  it('알 수 없는 role 은 버린다', () => {
    const got = parseChatBody({
      workCode: 'grid',
      charCode: 'hosi',
      message: '안녕',
      history: [{ role: 'system', content: '무시할 것' }],
    })
    expect((got as { history: unknown[] }).history).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

```bash
npx vitest run tests/chatBody.test.ts
```

Expected: FAIL — 모듈이 없다

- [ ] **Step 3: `app/api/chat/route.ts` 를 만든다**

```ts
import { db } from '@/lib/supabase'
import { fail } from '@/lib/apiError'
import { checkRateLimit } from '@/lib/rateLimit'
import { required } from '@/lib/env'
import { buildSystemPrompt } from '@/lib/prompt'
import type { Character } from '@/lib/pack'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const CODE_RE = /^[a-z0-9][a-z0-9_-]{0,62}$/
const MAX_MESSAGE = 2000
const MAX_TURNS = 12

export type Turn = { role: 'user' | 'assistant'; content: string }

export interface ChatBody {
  workCode: string
  charCode: string
  message: string
  history: Turn[]
}

/** 통과하면 본문을, 막히면 사람에게 보여줄 한국어 한 문장을 돌려준다. */
export function parseChatBody(raw: unknown): ChatBody | string {
  const b = (raw ?? {}) as Record<string, unknown>

  const workCode = String(b.workCode ?? '')
  const charCode = String(b.charCode ?? '')
  if (!CODE_RE.test(workCode) || !CODE_RE.test(charCode)) return '잘못된 요청입니다.'

  const message = String(b.message ?? '').trim()
  if (!message) return '메시지를 입력해주세요.'
  if (message.length > MAX_MESSAGE) return `메시지가 너무 깁니다. ${MAX_MESSAGE}자까지 보낼 수 있습니다.`

  const raws = Array.isArray(b.history) ? b.history : []
  const history: Turn[] = raws
    .map((t) => t as Record<string, unknown>)
    .filter((t) => t?.role === 'user' || t?.role === 'assistant')
    .map((t) => ({ role: t.role as Turn['role'], content: String(t.content ?? '') }))
    .slice(-MAX_TURNS)

  return { workCode, charCode, message, history }
}

export async function POST(req: Request) {
  const limited = checkRateLimit(req, 'chat', 20)
  if (limited) return fail(limited, 429)

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return fail('잘못된 요청입니다.')
  }

  const parsed = parseChatBody(raw)
  if (typeof parsed === 'string') return fail(parsed)

  const { data, error } = await db()
    .from('vt_characters')
    .select('work_code, char_code, pack')
    .eq('work_code', parsed.workCode)
    .eq('char_code', parsed.charCode)
    .eq('published', true)
    .maybeSingle()

  if (error) return fail('캐릭터를 불러오지 못했습니다.', 500)
  if (!data) return fail('없는 캐릭터입니다.', 404)

  const character: Character = {
    workCode: data.work_code as string,
    charCode: data.char_code as string,
    pack: data.pack as Character['pack'],
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt(character, parsed.message) },
    ...parsed.history,
    { role: 'user', content: parsed.message },
  ]

  let upstream: Response
  try {
    upstream = await fetch(`${required('LLM_BASE_URL').replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: required('LLM_MODEL'),
        messages,
        stream: true,
        temperature: 0.9,
        max_tokens: 400,
      }),
    })
  } catch {
    // DGX 가 내려갔거나 터널이 끊겼다. 사람에게는 캐릭터의 말로 알린다.
    return fail('캐릭터가 잠시 자리를 비웠어요. 곧 돌아옵니다.', 503)
  }

  if (!upstream.ok || !upstream.body) {
    return fail('캐릭터가 잠시 자리를 비웠어요. 곧 돌아옵니다.', 503)
  }

  // 위쪽 SSE 를 그대로 흘려보낸다. 번호를 가르는 것은 브라우저가 한다 —
  // 서버가 버퍼링하면 첫 글자가 늦어져 기다리는 느낌이 커진다.
  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 4: 테스트가 통과하는지 확인한다**

```bash
npx vitest run tests/chatBody.test.ts
npm run typecheck
```

Expected: PASS (7 tests), 타입 검사 통과

- [ ] **Step 5: 실제로 한 턴을 돌려 본다**

`.env.local` 에 `LLM_BASE_URL`, `LLM_MODEL` 을 채우고 `npm run dev` 를 띄운 뒤:

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"workCode":"grid","charCode":"hosi","message":"아직 안 갔어?"}'
```

Expected: `data: {...}` 줄이 흘러나오고, 첫 델타의 내용이 번호로 시작한다.
DGX 가 꺼져 있으면 `{"error":"캐릭터가 잠시 자리를 비웠어요. 곧 돌아옵니다."}` 가 나오면 정상이다.

- [ ] **Step 6: 커밋**

```bash
git add app/api/chat tests/chatBody.test.ts
git commit -m "$(cat <<'EOF'
feat: 대화 API — 팩 조회, 프롬프트 조립, SSE 프록시

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: 대화 기록과 SSE 읽기

**Files:**
- Create: `lib/history.ts`, `lib/sse.ts`
- Test: `tests/history.test.ts`, `tests/sse.test.ts`

**Interfaces:**
- Consumes: `Turn` (`app/api/chat/route.ts`)
- Produces:
  - `loadHistory(key: string): Turn[]`, `saveHistory(key: string, turns: Turn[]): void`, `historyKey(workCode: string, charCode: string): string` (`lib/history.ts`)
  - `readSSE(body: ReadableStream<Uint8Array>, onDelta: (text: string) => void): Promise<void>` (`lib/sse.ts`)

- [ ] **Step 1: 실패하는 테스트를 쓴다**

`tests/history.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadHistory, saveHistory, historyKey } from '@/lib/history'

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})

describe('history', () => {
  it('키에 작품과 캐릭터가 들어간다', () => {
    expect(historyKey('grid', 'hosi')).toBe('vt.history.grid.hosi')
  })

  it('넣은 것을 그대로 읽는다', () => {
    saveHistory('k', [{ role: 'user', content: '안녕' }])
    expect(loadHistory('k')).toEqual([{ role: 'user', content: '안녕' }])
  })

  it('없으면 빈 배열이다', () => {
    expect(loadHistory('없는키')).toEqual([])
  })

  it('망가진 값이 있어도 죽지 않는다', () => {
    localStorage.setItem('k', '{{{')
    expect(loadHistory('k')).toEqual([])
  })

  it('최근 40턴만 남긴다 — 무한히 자라지 않게', () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      role: 'user' as const,
      content: String(i),
    }))
    saveHistory('k', many)
    const got = loadHistory('k')
    expect(got).toHaveLength(40)
    expect(got[0].content).toBe('60')
  })
})
```

`tests/sse.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readSSE } from '@/lib/sse'

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream({
    start(c) {
      for (const s of chunks) c.enqueue(enc.encode(s))
      c.close()
    },
  })
}

describe('readSSE', () => {
  it('델타를 순서대로 넘긴다', async () => {
    const got: string[] = []
    await readSSE(
      streamOf([
        'data: {"choices":[{"delta":{"content":"31 "}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"저는"}}]}\n\n',
        'data: [DONE]\n\n',
      ]),
      (t) => got.push(t),
    )
    expect(got).toEqual(['31 ', '저는'])
  })

  it('줄이 쪼개져 와도 이어 읽는다', async () => {
    const got: string[] = []
    await readSSE(
      streamOf(['data: {"choices":[{"delta":{"con', 'tent":"안녕"}}]}\n\n']),
      (t) => got.push(t),
    )
    expect(got).toEqual(['안녕'])
  })

  it('내용 없는 델타는 넘기지 않는다', async () => {
    const got: string[] = []
    await readSSE(
      streamOf(['data: {"choices":[{"delta":{}}]}\n\n', 'data: [DONE]\n\n']),
      (t) => got.push(t),
    )
    expect(got).toEqual([])
  })

  it('깨진 줄은 건너뛴다 — 한 줄 때문에 대화가 끊기지 않는다', async () => {
    const got: string[] = []
    await readSSE(
      streamOf(['data: {깨짐\n\n', 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n']),
      (t) => got.push(t),
    )
    expect(got).toEqual(['ok'])
  })
})
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인한다**

```bash
npx vitest run tests/history.test.ts tests/sse.test.ts
```

Expected: FAIL — 두 모듈 모두 없다

- [ ] **Step 3: `lib/history.ts` 를 만든다**

```ts
import type { Turn } from '@/app/api/chat/route'

/** 브라우저에만 남는다. 기기를 바꾸면 사라진다 — 1차에는 계정이 없다. */
const MAX_KEEP = 40

export function historyKey(workCode: string, charCode: string): string {
  return `vt.history.${workCode}.${charCode}`
}

export function loadHistory(key: string): Turn[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (t) => t && (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string',
    )
  } catch {
    // 사생활 보호 모드거나 값이 망가졌다. 대화는 계속돼야 한다.
    return []
  }
}

export function saveHistory(key: string, turns: Turn[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(turns.slice(-MAX_KEEP)))
  } catch {
    /* 저장 못 해도 대화는 계속된다 */
  }
}
```

- [ ] **Step 4: `lib/sse.ts` 를 만든다**

```ts
/**
 * OpenAI 호환 SSE 를 읽어 델타 문자열만 넘긴다.
 *
 * 청크는 줄 가운데에서 잘려 도착한다. 그래서 개행이 나올 때까지 물고 있는다.
 * 깨진 줄 하나 때문에 대화가 끊기면 안 되므로 건너뛴다.
 */
export async function readSSE(
  body: ReadableStream<Uint8Array>,
  onDelta: (text: string) => void,
): Promise<void> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })

    let nl: number
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim()
      buf = buf.slice(nl + 1)

      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (!payload || payload === '[DONE]') continue

      try {
        const j = JSON.parse(payload)
        const text = j?.choices?.[0]?.delta?.content
        if (typeof text === 'string' && text) onDelta(text)
      } catch {
        continue
      }
    }
  }
}
```

- [ ] **Step 5: 테스트가 통과하는지 확인한다**

```bash
npx vitest run
```

Expected: 전체 PASS

- [ ] **Step 6: 커밋**

```bash
git add lib/history.ts lib/sse.ts tests/history.test.ts tests/sse.test.ts
git commit -m "$(cat <<'EOF'
feat: 대화 기록 저장과 SSE 읽기

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: 화면 — 피드와 리스트뷰

**Files:**
- Create: `components/Stage.tsx`, `components/Caption.tsx`, `components/Composer.tsx`, `components/HistoryDrawer.tsx`, `components/ListView.tsx`, `components/Feed.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Character`, `resolveMedia`, `createCodeReader`, `readSSE`, `loadHistory`, `saveHistory`, `historyKey`, `Turn`
- Produces: 없음 (끝단)

- [ ] **Step 1: `components/Stage.tsx` 를 만든다**

```tsx
'use client'

/**
 * 무대 — 미디어가 배경이 아니라 화면 그 자체다.
 *
 * 위아래 스크림은 장식이 아니라 글자 가독성을 위한 필수 장치다.
 * 밝은 컷에서도 흰 자막이 읽혀야 한다.
 */
export function Stage({ url }: { url: string | null }) {
  return (
    <div className="absolute inset-0 bg-[#2A2130]">
      {url && (
        // 움직이는 webp 와 정지 webp 를 같은 태그로 그린다 — 부르는 쪽은 차이를 모른다.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-black/90 via-black/55 to-transparent" />
    </div>
  )
}
```

- [ ] **Step 2: `components/Caption.tsx` 를 만든다**

```tsx
'use client'

/**
 * 자막 — 말풍선 스레드가 아니다.
 *
 * 지금 대사 한 줄만 크게, 직전 대사는 흐리게 한 줄. 스크롤되지 않는다.
 * 나중에 음성을 켜면 이 자리가 그대로 음성 자막이 된다.
 */
export function Caption({
  prev,
  now,
  label,
}: {
  prev: string | null
  now: string
  label: string | null
}) {
  return (
    <div className="px-5 pb-3">
      {prev && (
        <p className="m-0 mb-2 text-[13px] leading-relaxed text-[#EEE4F0]/40 line-clamp-1">
          {prev}
        </p>
      )}
      {label && (
        <div className="mb-2 font-mono text-[11px] tracking-wide text-[#E4846B]">{label}</div>
      )}
      <p className="m-0 text-[21px] leading-relaxed text-[#FFF8F4] [text-shadow:0_1px_14px_rgba(8,4,12,0.9)] text-balance">
        {now}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: `components/Composer.tsx` 를 만든다**

```tsx
'use client'

import { useState } from 'react'

export function Composer({
  disabled,
  onSend,
}: {
  disabled: boolean
  onSend: (text: string) => void
}) {
  const [text, setText] = useState('')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || disabled) return
    setText('')
    onSend(t)
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 px-4 pb-5">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={disabled ? '기다리는 중…' : '메시지'}
        disabled={disabled}
        className="flex-1 rounded-full border border-white/20 bg-black/55 px-4 py-2.5 text-[13px] text-white placeholder:text-white/45 outline-none backdrop-blur focus:border-[#E4846B] disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled}
        aria-label="보내기"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#E4846B] text-[15px] text-[#1B1017] disabled:opacity-50"
      >
        ↑
      </button>
    </form>
  )
}
```

- [ ] **Step 4: `components/HistoryDrawer.tsx` 를 만든다**

```tsx
'use client'

import type { Turn } from '@/app/api/chat/route'

/**
 * 기록 서랍.
 *
 * 기본 화면에 로그를 깔면 몰입이 사라지고 자막이 설 자리도 없다.
 * 그래서 접어 두고 눌러서 연다.
 */
export function HistoryDrawer({
  open,
  turns,
  onClose,
}: {
  open: boolean
  turns: Turn[]
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#16121C]/97 backdrop-blur">
      <div className="flex items-center border-b border-white/10 px-4 py-3">
        <span className="flex-1 text-[14px] font-medium">대화 기록</span>
        <button onClick={onClose} aria-label="닫기" className="text-[18px] text-white/70">
          ✕
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {turns.length === 0 && <p className="text-[13px] text-white/45">아직 나눈 말이 없어요.</p>}
        {turns.map((t, i) => (
          <div
            key={i}
            className={
              t.role === 'user'
                ? 'ml-auto max-w-[84%] rounded-xl rounded-br bg-[#2E2739] px-3 py-2 text-[13px]'
                : 'mr-auto max-w-[84%] rounded-xl rounded-bl bg-[#221C2B] px-3 py-2 text-[13px]'
            }
          >
            {t.content}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: `components/ListView.tsx` 를 만든다**

```tsx
'use client'

import type { Character } from '@/lib/pack'
import { mediaBase } from '@/lib/media'

export function ListView({
  characters,
  cdnBase,
  activeIndex,
  onPick,
  onClose,
}: {
  characters: Character[]
  cdnBase: string
  activeIndex: number
  onPick: (index: number) => void
  onClose: () => void
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-[#16121C]">
      <div className="flex items-baseline gap-3 border-b border-white/10 px-4 py-3">
        <h1 className="m-0 flex-1 text-[17px] font-bold">오늘 누구와</h1>
        <span className="font-mono text-[10px] text-white/50">{characters.length}명</span>
        <button onClick={onClose} aria-label="닫기" className="text-[18px] text-white/70">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {characters.map((c, i) => {
          const thumbN = c.pack.have[0]
          const motion = c.pack.haveMotion.includes(thumbN)
          const thumb = `${mediaBase(c, cdnBase)}/${motion ? 'm/' : ''}${thumbN}.webp`

          return (
            <button
              key={`${c.workCode}/${c.charCode}`}
              onClick={() => onPick(i)}
              className={`grid w-full grid-cols-[62px_minmax(0,1fr)] items-center gap-3 rounded-xl bg-[#221C2B] p-2 text-left ${
                i === activeIndex ? 'outline outline-1 outline-[#E4846B]' : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb} alt="" className="h-[82px] w-full rounded-md object-cover" />
              <div className="min-w-0">
                <h2 className="m-0 mb-1 text-[14px] font-medium">{c.pack.name}</h2>
                <p className="m-0 line-clamp-2 text-[11px] leading-snug text-white/55">
                  {c.pack.intro}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.pack.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded bg-[#16121C] px-1.5 py-0.5 font-mono text-[9px] text-white/50">
                      {t}
                    </span>
                  ))}
                  <span className="rounded bg-[#16121C] px-1.5 py-0.5 font-mono text-[9px] text-white/50">
                    {c.pack.haveMotion.length > 0 ? `영상 ${c.pack.haveMotion.length}` : '정지만'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: `components/Feed.tsx` 를 만든다**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import type { Character } from '@/lib/pack'
import type { Turn } from '@/app/api/chat/route'
import { resolveMedia } from '@/lib/media'
import { labelOf } from '@/lib/codes'
import { createCodeReader } from '@/lib/parseCode'
import { readSSE } from '@/lib/sse'
import { loadHistory, saveHistory, historyKey } from '@/lib/history'
import { Stage } from './Stage'
import { Caption } from './Caption'
import { Composer } from './Composer'
import { HistoryDrawer } from './HistoryDrawer'
import { ListView } from './ListView'

export function Feed({ characters, cdnBase }: { characters: Character[]; cdnBase: string }) {
  const [index, setIndex] = useState(0)
  const [listOpen, setListOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [now, setNow] = useState('')
  const [prev, setPrev] = useState<string | null>(null)
  const [code, setCode] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const touchStartY = useRef<number | null>(null)

  const c = characters[index]

  // 캐릭터가 바뀌면 그 캐릭터의 기록과 프롤로그로 갈아 끼운다.
  useEffect(() => {
    if (!c) return
    const saved = loadHistory(historyKey(c.workCode, c.charCode))
    setTurns(saved)
    setPrev(null)
    const last = [...saved].reverse().find((t) => t.role === 'assistant')
    setNow(last ? last.content : c.pack.prologue)
    setCode(c.pack.firstMedia ? c.pack.firstMedia.n : (c.pack.have[0] ?? null))
  }, [c])

  if (!c) {
    return <main className="grid h-dvh place-items-center text-[13px] text-white/50">캐릭터가 없습니다.</main>
  }

  const media = code !== null ? resolveMedia(c, code, cdnBase) : null

  async function send(text: string) {
    setBusy(true)
    setPrev(now)
    setNow('')

    const nextTurns: Turn[] = [...turns, { role: 'user', content: text }]
    setTurns(nextTurns)

    const reader = createCodeReader()
    let answer = ''

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workCode: c.workCode,
          charCode: c.charCode,
          message: text,
          history: nextTurns.slice(-12),
        }),
      })

      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({ error: '잠시 뒤 다시 시도해주세요.' }))
        setNow(j.error ?? '잠시 뒤 다시 시도해주세요.')
        setBusy(false)
        return
      }

      await readSSE(res.body, (delta) => {
        const got = reader.push(delta)
        // 번호를 못 읽으면 직전 컷을 그대로 둔다 — 화면을 비우지 않는다.
        if (got.code !== null) setCode(got.code)
        if (got.text) {
          answer += got.text
          setNow(answer)
        }
      })
    } catch {
      setNow('연결이 끊겼어요. 잠시 뒤 다시 시도해주세요.')
      setBusy(false)
      return
    }

    const done: Turn[] = [...nextTurns, { role: 'assistant', content: answer }]
    setTurns(done)
    saveHistory(historyKey(c.workCode, c.charCode), done)
    setBusy(false)
  }

  return (
    <main
      className="relative h-dvh w-full overflow-hidden"
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY
      }}
      onTouchEnd={(e) => {
        const start = touchStartY.current
        touchStartY.current = null
        if (start === null || busy) return
        const dy = start - e.changedTouches[0].clientY
        // 위로 밀면 다음 캐릭터. 리스트로 돌아가지 않는다.
        if (dy > 70) setIndex((i) => (i + 1) % characters.length)
        else if (dy < -70) setIndex((i) => (i - 1 + characters.length) % characters.length)
      }}
    >
      <Stage url={media?.url ?? null} />

      <div className="absolute inset-0 flex flex-col">
        <div className="flex items-center gap-2.5 px-4 pt-8">
          <button
            onClick={() => setListOpen(true)}
            aria-label="캐릭터 목록"
            className="grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-black/50 text-[12px] backdrop-blur"
          >
            ☰
          </button>
          <span className="text-[14px] font-medium">{c.pack.name}</span>
        </div>

        <div className="mt-auto">
          <Caption prev={prev} now={now} label={code !== null ? `${code} · ${labelOf(code) ?? ''}` : null} />
          <Composer disabled={busy} onSend={send} />
        </div>
      </div>

      <div className="absolute bottom-44 right-3 flex flex-col items-center gap-1">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="대화 기록"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/50 text-[14px] backdrop-blur"
        >
          ☰
        </button>
        <span className="font-mono text-[8px] text-white/55">기록</span>
      </div>

      {characters.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 text-center font-mono text-[8px] tracking-widest text-white/30">
          ▲ 위로 밀면 다음 캐릭터
        </div>
      )}

      <HistoryDrawer open={drawerOpen} turns={turns} onClose={() => setDrawerOpen(false)} />

      {listOpen && (
        <ListView
          characters={characters}
          cdnBase={cdnBase}
          activeIndex={index}
          onPick={(i) => {
            setIndex(i)
            setListOpen(false)
          }}
          onClose={() => setListOpen(false)}
        />
      )}
    </main>
  )
}
```

- [ ] **Step 7: `app/page.tsx` 를 채운다**

```tsx
import { db } from '@/lib/supabase'
import { required } from '@/lib/env'
import { Feed } from '@/components/Feed'
import type { Character } from '@/lib/pack'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data } = await db()
    .from('vt_characters')
    .select('work_code, char_code, pack')
    .eq('published', true)
    .order('sort_order', { ascending: true })

  const characters: Character[] = (data ?? []).map((r) => ({
    workCode: r.work_code as string,
    charCode: r.char_code as string,
    pack: r.pack as Character['pack'],
  }))

  return <Feed characters={characters} cdnBase={required('NEXT_PUBLIC_CDN_BASE')} />
}
```

- [ ] **Step 8: 전체 검사를 돌린다**

```bash
npm run typecheck
npx vitest run
npm run build
```

Expected: 전부 통과

- [ ] **Step 9: 실제로 띄워서 눈으로 본다**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 을 열고 개발자도구의 모바일 뷰(390×844)로 확인한다:

- 열자마자 호시가 전체화면으로 뜨고 프롤로그가 자막으로 보인다
- 밝은 컷에서도 자막이 읽힌다 (스크림이 도는가)
- 메시지를 보내면 번호에 따라 무대가 갈리고 글자가 흘러 들어온다
- 좌상단 `☰` → 리스트뷰, 카드를 고르면 그 캐릭터로 바뀐다
- 우측 `☰` → 기록 서랍
- 가로 스크롤이 생기지 않는다

- [ ] **Step 10: 커밋**

```bash
git add components app/page.tsx
git commit -m "$(cat <<'EOF'
feat: 피드형 대화 화면과 리스트뷰

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

**스펙 대응:**

| 스펙 절 | 담당 |
|---|---|
| 3. 시스템 경계 (복사할 것) | Task 5 (`rateLimit`, `apiError`), Task 1 (`env`) |
| 4. 데이터 모델 | Task 3 (타입), Task 4 (테이블·시드) |
| 5. 미디어 주소 규칙 | Task 2 (코드표), Task 3 (`resolveMedia`) |
| 6. 대화 한 턴 | Task 6 (프롬프트), Task 7 (번호), Task 8 (API), Task 9 (SSE·기록) |
| 7-A. 대화 화면 | Task 10 |
| 7-B. 리스트뷰 | Task 10 |
| 7-C. 관리자 6개 탭 | **별도 계획** |
| 8. 업로드 | **별도 계획** |
| 10. 검증 | 순수 함수는 Task 2·3·6·7·9에서, 화면은 Task 10 Step 9에서 눈으로 |

`vt_admin_sessions` 는 Task 4에서 미리 만든다 — 마이그레이션을 두 번 돌리지 않기 위해서다.

**남은 것:** 없음. 이 계획의 모든 단계에 실제 코드가 들어 있고, 뒤 태스크가 쓰는 이름은
앞 태스크의 Interfaces 블록에 정의돼 있다.
