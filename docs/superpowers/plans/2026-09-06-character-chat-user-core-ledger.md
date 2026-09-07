# SDD ledger — plan: docs/superpowers/plans/2026-09-06-character-chat-user-core.md

Spec: docs/superpowers/specs/2026-09-06-character-chat-mvp-design.md (읽음)
Branch: feat/user-core (base 635e176)
Workspace: .superpowers/sdd/2026-09-06-character-chat-user-core

## Pre-flight scan

### 파일·인터페이스를 공유하는 태스크 쌍

| 생산 | 소비 | 무엇을 | 결과 |
|---|---|---|---|
| T1 `lib/env.ts` `required/optional` | T4 seed, T8 route, T10 page | 환경변수 읽기 | 일치 |
| T1 `app/page.tsx` (자리만) | T10 `app/page.tsx` (채움) | 같은 파일 | 일치 — 계획이 명시 |
| T1 `.gitignore` | (컨트롤러가 이미 생성) | 무시 목록 | **충돌** — 아래 R1 |
| T2 `labelOf` | T6 `codeTable` | 번호 → 이름 | 일치 |
| T2 `codeOf` | (이 계획에 소비자 없음) | 이름 → 번호 | **충돌** — 아래 R2 |
| T3 `Character`/`CharacterPack` | T5, T8, T10 | 팩 타입 | 일치 |
| T3 `resolveMedia`/`mediaBase` | T10 Feed·ListView | 번호 → 주소 | 일치 |
| T4 `db()` | T5, T8, T10 page | service_role 클라이언트 | 일치 |
| T5 `checkRateLimit` | T8 | IP 버킷 | 일치 |
| T5 `fail` | T8 | 에러 응답 | 일치 (`ok`는 T5만 씀 — 정상) |
| T6 `buildSystemPrompt` | T8 | 프롬프트 조립 | 일치 |
| T7 `createCodeReader` | T10 Feed | 번호 뽑기 | 일치 |
| T8 `Turn` 타입 | T9 history, T10 Feed·HistoryDrawer | 대화 한 턴 | **충돌** — 아래 R3 |
| T8 `parseChatBody` | T8 테스트 | 본문 검증 | 일치 |
| T9 `loadHistory`/`saveHistory`/`historyKey` | T10 Feed | localStorage | 일치 |
| T9 `readSSE` | T10 Feed | SSE 델타 | 일치 |

### 태스크 자체 정합성

| 태스크 | 자기 텍스트가 자기와 맞는가 | 결과 |
|---|---|---|
| T1 | 만드는 파일 = 테스트가 부르는 모듈 | 일치 |
| T2 | 테스트가 `ADULT_70` 70개를 요구, 구현은 원본 복사 지시 | 일치 |
| T3 | 테스트 픽스처의 팩 필드 = `CharacterPack` 정의 | 일치 |
| T4 | 시드 JSON 필드 = 마이그레이션 컬럼 | 일치 |
| T5 | 복사해 오는 원본이 실재 (deev `lib/casting/rateLimit.ts` 확인함) | 일치 |
| T6 | 테스트가 `have:[1,2,31]`로 `'1기본 2미소 31두근'` 기대 = `codeTable` 구현 | 일치 |
| T7 | 리더 상태 기계 = 6개 테스트 케이스 | 일치 |
| T8 | `parseChatBody` 반환 = 테스트 기대 | 일치 |
| T9 | node 환경에서 `localStorage` 스텁, `ReadableStream`은 Node 24 내장 | 일치 |
| T10 | Feed 훅이 전부 조기 반환 앞에 있음 | 일치 |

### Rulings (실행 전)

- **R1 — Ruling: Task 1의 `.gitignore`에 `.superpowers/`와 `VTuber-Companion*.zip`을 반드시 유지한다.**
  이유: 계획의 `.gitignore` 내용을 그대로 쓰면 SDD 작업공간(원장·브리프·리뷰 패키지)과 30MB짜리 zip이 커밋된다.
  틀렸을 때 비용: 작업공간이 히스토리에 남아 되돌리려면 리베이스가 필요하다. 사전에 막는 쪽이 싸다.

- **R2 — Ruling: `codeOf`를 남긴다. 이 계획에는 소비자가 없다.**
  이유: `labelOf`의 짝이고 T2 테스트가 덮는다. 관리자뷰 계획의 업로드 계획표가 이것을 쓴다 —
  스펙 8절(파일명 → 번호)이 근거다. 지금 지우면 다음 계획에서 되살려야 한다.
  틀렸을 때 비용: 쓰이지 않는 export 하나. 리뷰어가 YAGNI로 걸면 이 항목을 근거로 기각한다.

- **R3 — Ruling: `Turn` 타입을 `app/api/chat/route.ts`가 아니라 `lib/pack.ts`에 둔다.**
  이유: 계획대로면 클라이언트 컴포넌트(`Feed.tsx`, `HistoryDrawer.tsx`)와 `lib/history.ts`가
  라우트 모듈에서 타입을 가져온다. `import type`이라 컴파일에서 지워지긴 하지만,
  누군가 `type`을 빠뜨리는 순간 서버 전용 모듈(`lib/supabase.ts` → service_role 키)이
  클라이언트 번들 그래프에 들어간다. 타입은 `lib/`에 두고 라우트가 가져다 쓴다.
  적용: T3에서 `lib/pack.ts`에 `Turn`을 정의하고, T8·T9·T10은 `@/lib/pack`에서 가져온다.
  틀렸을 때 비용: 없음에 가깝다. import 경로 한 줄 차이다.

---

## 진행

Task 1: complete (commits 635e176..3f29e15, review clean)
Task 1: minor (deferred): tsconfig.json 의 exclude 에 VTuber-Companion* 추가 — 브리프에 없던 범위 변경. 정당하나, 이후 tsconfig 를 건드리는 태스크가 이 exclude 를 지우지 않게 할 것
Task 1: minor (deferred): .gitignore 끝 빈 줄 하나 추가 — 무해
Task 2: review ❌ — ADULT_70 63번 손상. 컨트롤러가 배열 대조로 확증(codes-audit.json): 70개 중 1개 불일치, BASIC_50 50개는 정확. 리뷰어 주장이 사실이었음
Task 2: fix round 1/5 (1 addressed, 0 open — ADULT_70 63번 복원; commits 3ba2e4d..1e1d8b4)
Task 2: complete (commits 3f29e15..1e1d8b4, review clean). 컨트롤러 재확증: ADULT_70 70/70 일치, BASIC_50 50개 정확
Task 2: note — 근본 원인은 브리프가 지시한 sed 추출이 아니라 손 전사였다(구현자 자백). 길이 검증은 통과하고 내용 오류만 남는 실패 방식. 이후 목록을 옮기는 태스크에는 "내용으로 대조하라"를 명시할 것
Task 3: complete (commits 1e1d8b4..60392ae, review clean). R3 적용 확인 — Turn 이 lib/pack.ts 에 있음
Task 4: Ruling — 실제 Supabase 프로젝트와 .env.local 이 없으므로 브리프 Step 5(npm run seed 실제 실행)는 이번에 검증할 수 없다. 파일 산출물(마이그레이션·lib/supabase.ts·시드 스크립트·hosi.json)까지 만들고, 살아있는 적재는 사람이 Supabase 프로젝트를 만든 뒤로 미룬다. 대신 자격 증명 없이 확인 가능한 것(스크립트 파싱, JSON 유효성, haveMotion ⊆ have 가드가 실제로 동작하는지)을 검증한다.
  이유: 자격 증명은 사람만 발급할 수 있고, 그것을 기다리면 나머지 6개 태스크가 전부 멈춘다. Task 5·8·10 은 DB 접근을 코드로 감싸므로 스키마 파일만 있으면 진행된다.
  틀렸을 때 비용: 마이그레이션 SQL 이나 시드 스크립트에 실행 시점 오류가 남아 있을 수 있다. 사람이 처음 적재할 때 드러나고, 그 자리에서 고치면 된다.
Task 4: complete (commits 60392ae..c847515, review clean). 시드 가드 발동 증거 실물 확인, 스크래치 미커밋 확인
Task 4: minor (deferred): scripts/seed.mjs 의 .env.local 파서가 따옴표를 벗기지 않고 값 내부 '=' 를 그대로 둔다. 계획 원문 그대로이고 현재 형식에는 문제없음
Task 5: Ruling — 브리프 Step 6(npm run dev + curl /api/characters)은 Supabase 자격 증명이 없어 실행할 수 없다. Task 4 판정과 같은 이유로, 라우트가 빌드되는지(npm run build)와 타입·테스트로 대체 검증한다.
  틀렸을 때 비용: 라우트의 런타임 오류가 사람이 처음 붙일 때 드러난다. 조회 로직이 열 줄 남짓이라 위험이 작다.
Task 5: complete (commits c847515..3cfb14e, review clean). 컨트롤러가 rateLimit.ts 원본 대비 diff -q 로 동일 확인
Task 5: minor (deferred): app/api/characters/route.ts 의 pack 을 런타임 검사 없이 캐스팅. 계획 원문 그대로. 팩 형태 검증이 필요해지면 그때 넣을 것
Task 6: complete (commits 3cfb14e..779c6fc, review clean). 리뷰어가 브리프와 바이트 단위 대조 — 프롬프트 한국어 문구 무결
Task 6: minor (deferred): 빈 background 분기와 have 중복/빈 배열에 테스트 없음. 한 줄 가드라 위험 낮음
Task 7: review ❌ — Critical(빈/공백 첫 청크가 리더를 조기에 잠금) + Important(스트림 종료 시 버퍼에 남은 숫자 유실). 둘 다 계획 원문이 지시한 코드에서 비롯됨
Task 7: Ruling — 둘 다 고친다. 계획보다 스펙이 우선이고, 스펙 6절은 "파싱 실패가 화면을 비우면 안 된다"를 요구하는데 두 결함 모두 그 요구를 어긴다.
  (a) 대기 조건을 /^\s*\d{0,3}$/ 로 바꾼다 — 인터페이스 변화 없음, 순수 개선.
  (b) flush(): string 을 추가한다. 스트림이 끝났는데 버퍼에 뭔가 남아 있으면 그것을 텍스트로 돌려준다. Task 10 이 readSSE 종료 후 한 번 부른다.
  이유: (b)를 넣지 않으면 모델이 "31" 만 뱉고 끝나는 응답에서 대사가 통째로 사라진다. 계획의 push-only 인터페이스는 이 경우를 생각하지 않았다.
  틀렸을 때 비용: 메서드 하나와 Task 10 의 호출 한 줄. 되돌리기 쉽다.
Task 7: fix round 1/5 (2 addressed, 0 open — 대기 조건 \d{0,3}, flush() 추가; commits cac8709..b70ead9)
Task 7: complete (commits 779c6fc..b70ead9, review clean). 재검토가 7개 시퀀스를 손으로 추적해 넓힌 조건이 새 함정을 만들지 않았음을 확인
Task 7: minor (deferred): 모듈 상단 주석에 flush() 설명이 없음
Task 8: Ruling — 브리프 Step 5(curl 로 실제 한 턴)는 Supabase·DGX 자격 증명이 없어 실행 불가. build/typecheck/vitest 로 대체. Task 4·5 판정과 같은 이유
Task 8: 계획 결함 확인 — Next.js App Router 는 route.ts 에서 핸들러 외 named export 를 금지한다. 컨트롤러가 npm run build 로 직접 재현(.next/types 검사에서 parseChatBody 가 never 에 배정 불가). 계획이 parseChatBody/ChatBody 를 route.ts 에 두라고 지시한 것이 원인
Task 8: Ruling — 본문 검증을 lib/chatBody.ts 로 옮긴다. 라우트는 그것을 가져다 쓰고, 테스트는 @/lib/chatBody 에서 가져온다.
  이유: 빌드를 되살리는 가장 작은 변경이고, R3 과 같은 이유로 더 낫다 — 검증 로직을 라우트(서비스 롤 키를 읽는 모듈)에서 떼어내면 테스트가 그 모듈을 건드리지 않는다. tsconfig 를 느슨하게 푸는 대안은 프로젝트 전체의 타입 안전을 낮추므로 기각.
  틀렸을 때 비용: 파일 하나가 는다. 되돌리기 쉽다.
Task 8: fix round 1/5 (빌드 결함 해소 — parseChatBody 를 lib/chatBody.ts 로; commits 66722c6..cf5759c). 컨트롤러가 npm run build 통과를 직접 확인
Task 8: complete (commits b70ead9..cf5759c, review clean)
Task 8: minor (deferred) **최종 리뷰에서 반드시 판정할 것**: history 각 항목의 content 에 길이 상한이 없다. 개수만 12턴으로 자른다. 클라이언트가 12턴 × 수 MB 를 보내면 그대로 DGX 요청 본문에 실린다. 계정이 없고 IP 당 분당 20회 제한뿐이라 GPU 한 대에 부하를 증폭시킬 수 있다. 고치는 비용은 map 안에서 content 를 MAX_MESSAGE 로 자르는 두 줄
Task 8: minor (deferred): 클라이언트가 assistant 턴을 위조해 캐릭터를 유도할 수 있다. 계정도 서버 세션도 없는 설계에서는 정상 — 문서화된 수용
Task 9: review — Important: readSSE 가 루프 종료 시 buf 에 남은 미완성 줄을 버린다. 서버가 마지막 쓰기를 개행 없이 끝내면 응답 끝머리가 조용히 사라진다
Task 9: Ruling — 고친다. Task 7 의 flush 와 같은 부류이고, 이 모듈의 존재 이유가 "대화를 잃지 않는다"이다. 실제 발생 확률은 낮다(정상적인 vLLM 은 모든 이벤트를 \n\n 로 끝내고 마지막에 [DONE] 을 보낸다) 하지만 고치는 비용이 몇 줄이고, 실패했을 때 아무 표시 없이 마지막 말이 잘린다.
  틀렸을 때 비용: 실행되지 않는 코드 몇 줄. 사실상 없다.
Task 9: note — 저장 40턴과 모델 컨텍스트 12턴의 차이는 의도된 것. 보관량과 컨텍스트 창은 다른 관심사
Task 9: fix round 1/5 (1 addressed, 0 open — emitLine 공유 함수 + 꼬리 줄 처리; commits 83eee4c..0636ec2)
Task 9: complete (commits cf5759c..0636ec2, review clean)
Task 9: minor (deferred): 수정 커밋 제목만 영어 — 나머지 커밋은 한국어. 계획은 커밋 메시지 언어를 규정하지 않음
Task 9: minor (deferred): 새 테스트 3개 중 2개(끊긴 줄, [DONE])는 수정 전에도 통과. 회귀 방어로는 유효하나 수정을 증명하지는 않음
Task 10: Ruling — 브리프 Step 9(브라우저로 띄워 눈으로 확인)는 Supabase·DGX 자격 증명이 없어 실행 불가. build/typecheck/vitest 로 대체하고, 시각 확인은 사람이 자격 증명을 채운 뒤로 미룬다. 자막 가독성과 스크림은 눈으로만 판단되므로 이 항목은 최종 보고에 미검증으로 남긴다
Task 10: review ❌ — Critical(모델이 가지지 않은 번호를 부르면 무대가 빈다) + Important(스트리밍 중 캐릭터를 바꾸면 이전 캐릭터의 응답이 새 캐릭터 화면을 덮어쓴다). 구현자가 먼저 우려로 올렸고 리뷰어가 독립 확증
Task 10: Ruling — 둘 다 고친다.
  (a) Critical 은 lib/media.ts 의 resolveMedia 주석이 명시한 계약("가지고 있지 않은 번호면 null 을 준다. 부르는 쪽이 직전 컷을 유지한다")을 구현이 지키지 않은 것이다. 계약을 어긴 쪽이 틀렸다. 해결되는 번호만 setCode 한다.
  (b) Important 는 응답 콜백이 어느 캐릭터의 요청이었는지 확인하지 않아서 생긴다. 리스트 선택을 busy 로 막는 대신, 요청에 세대 토큰을 붙여 캐릭터가 바뀌었으면 화면 갱신을 버린다 — 유저가 스트리밍 중에도 자유롭게 넘길 수 있어야 한다.
  틀렸을 때 비용: (a) 는 조건 하나, (b) 는 ref 하나. 둘 다 되돌리기 쉽다.
Task 10: minor (deferred): 좌상단 리스트 버튼과 우측 기록 버튼이 같은 ☰ 글리프. 기록 쪽에는 라벨이 붙어 있어 구분은 되지만 한 번은 손볼 자리
Task 10: fix round 1/5 (2 addressed, 0 open — 해결되는 번호만 수용, 세대 토큰; commits 83520d7..1acf42f)
Task 10: complete (commits 0636ec2..1acf42f, review clean)
Task 10: minor (deferred): 스와이프 전환은 여전히 busy 로 막히는데 리스트 선택은 막지 않는다. 두 경로의 정책이 다르다
Task 10: minor (deferred): 스트림 완료 전에 캐릭터를 떠났다 돌아오면 방금 보낸 유저 메시지가 화면에서 잠시 사라진다(저장 전 로컬 기록을 다시 읽기 때문). 저장 후에는 복구됨
Task 10: 미검증 — 시각 확인(자막 가독성, 스크림, 가로 스크롤 없음)은 자격 증명이 없어 수행하지 못했다. 사람이 Supabase/DGX 를 연결한 뒤 확인해야 한다

## 최종 브랜치 리뷰 (opus, 635e176..1acf42f)

Verdict: changes requested. 개별 태스크 리뷰가 볼 수 없던 결함 4건.
- Ruling: 4건 모두 고친다. 이유는 각각 아래.
  M1 페르소나 유출 — page.tsx 가 pack 전체를 클라이언트 컴포넌트에 넘기고 /api/characters 가 인증 없이 같은 것을 준다. characterInfo·background·loreBooks 는 서버 전용인데 RSC 페이로드와 HTML 에 실린다. 스펙 3절("시스템 프롬프트는 서버에만")의 정면 위반이고, 이 아키텍처를 고른 유일한 이유가 이것이다.
  M2 코드표가 클라이언트 번들에 실리고 성인 레이블이 화면에 그려진다 — Caption 의 코드 칩은 내가 목업에서 넣고 계획에 옮긴 것이지 스펙 7-A 의 화면 구성에는 없다. 19+ 대화 중 "63 · 정상위 사정 후" 가 무대 위에 뜬다.
  M3 유저 메시지가 매 턴 두 번 전송된다 — Feed 가 새 메시지를 포함한 nextTurns 를 history 로 보내고, 라우트가 같은 메시지를 다시 붙인다. 계획의 두 태스크에 나뉘어 있어 어느 태스크 리뷰도 볼 수 없었다.
  M4 history 항목 content 에 상한이 없다 — 앞서 minor 로 미뤘으나 최종 리뷰가 차단으로 격상. GPU 한 대에 계정 없는 서비스라 동의한다.
  틀렸을 때 비용: M1·M2 는 화면에 덜 나오는 것뿐이고 되돌리기 쉽다. M3 는 프롬프트가 한 줄 짧아진다. M4 는 아주 긴 기록이 잘린다.
- 함께 고치는 것(같은 부류의 유실 결함, 비용 낮음): ListView 가 미디어 규칙을 손으로 재구현 → resolveMedia 사용, firstMedia.n 이 have 에 없을 때 have[0] 로 폴백, sse.ts 의 TextDecoder 최종 flush
- 미루는 것: /api/characters 호출자 없음(삭제할지 붙일지는 관리자 계획에서), 클라이언트 중단 시 상류 취소, pack 런타임 검증, 나머지 minor 전부
최종 수정 파동: 7건 전부 ADDRESSED (commit ab49364). 재검토가 projection 완전성·중복 턴·상한 순서·폴백 경로를 손으로 추적해 확인
최종 상태: 16 commits (635e176..ab49364), 61 tests, typecheck·build 통과
