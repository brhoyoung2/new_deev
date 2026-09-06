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
