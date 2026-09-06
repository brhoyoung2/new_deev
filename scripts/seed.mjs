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

let envFile
try {
  envFile = readFileSync(join(root, '.env.local'), 'utf8')
} catch (e) {
  if (e.code === 'ENOENT') {
    console.error(
      '.env.local 이 없습니다. .env.example 을 .env.local 로 복사한 뒤 값을 채우세요.',
    )
    process.exit(1)
  }
  throw e
}

for (const line of envFile.split('\n')) {
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
