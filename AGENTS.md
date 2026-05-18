## Project Configuration

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Add-ons**: tailwindcss, mcp
- **Runtime validation**: Zod (parse at boundaries — see below)

## Communication (caveman)

Default agent replies: **caveman full** — terse, no filler; technical substance exact.

- Off: user says `stop caveman` or `normal mode`.
- Code, commits, PR bodies: normal prose (not caveman).
- Commit messages: caveman-commit skill when asked.

---

## Parse, don't cast

External data (API responses, `JSON.parse`, webhooks, Redis) **unknown** until validated. No `as SomeType`.

- **[Zod](https://zod.dev)** — default validator (`safeParse`, inferred types).
- Schemas in [`$lib/server/`](src/lib/server/) per integration (e.g. [`usos-schemas.ts`](src/lib/server/usos-schemas.ts) + [`usos-types.ts`](src/lib/server/usos-types.ts)).
- `schema.safeParse(value)` or integration helpers like `parseJsonBody`; handle failures explicitly.

Refs: [Parse, don't cast](https://typescript.odone.me/parse-dont-cast/), [Zod vs alternatives (2026)](https://www.pkgpulse.com/guides/zod-v4-vs-arktype-vs-typebox-vs-valibot-2026).

### Schemas + types file split

Per integration, split Zod + TS types:

| File | Contents |
|------|----------|
| `*-schemas.ts` | `z.object(…)` schemas, `.parse` / `safeParse` helpers — **no exported types** |
| `*-types.ts` | `export type Foo = z.infer<typeof fooSchema>` — import schemas only, define types here |

Examples: [`auth-schemas.ts`](src/lib/server/auth-schemas.ts) + [`auth-types.ts`](src/lib/server/auth-types.ts); [`usos-schemas.ts`](src/lib/server/usos-schemas.ts) + [`usos-types.ts`](src/lib/server/usos-types.ts).

- `*-types.ts`: `import type { fooSchema }` — schemas only in type positions (`typeof` in `z.infer`).
- Impl imports schemas from `*-schemas`, types from `*-types`.
- No type re-exports from schemas file; no hand-written duplicate interfaces.
- Writes + decrypted blobs: `schema.parse(…)`; Redis reads: `safeParse` → warn + `null` if corrupt/missing; USOS HTTP `parseJsonBody`.

## Boolean coercion

Need `boolean` from value → `Boolean(x)`. Not `!!x`.

```ts
// good
const hasToken = Boolean(sessionId);

// bad
const hasToken = !!sessionId;
```

---

## Supabase

Planner data lives in Supabase (project `planer2`). **Server-only** — no `@supabase/ssr`, no `PUBLIC_*` Supabase env vars, no browser client.

- **Client**: [`supabase.ts`](src/lib/server/supabase.ts) — `getSupabase()` with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `$env/static/private`.
- **Security**: RLS enabled on all `public` tables, **zero policies**; `REVOKE` from `anon` / `authenticated`. Only `service_role` (your server) can read/write. App-layer checks via session + `plan_ownership` before mutations.
- **Types**: [`database-types.ts`](src/lib/server/database-types.ts) — generated (`pnpm gen:db-types`), biome-ignored. Do not hand-edit. Table row types come from here, not Zod.
- **JSONB only**: [`planner-schemas.ts`](src/lib/server/planner-schemas.ts) + [`planner-types.ts`](src/lib/server/planner-types.ts) — Zod for `subject.activities`, `semester_day_layout.slots`; use `parseSubjectActivities` / `parseDaySlots` at boundaries.
- **Migrations**: [`supabase/migrations/`](supabase/migrations/) — source of truth for schema; apply via Supabase MCP or CLI.

### Auth vs Postgres

USOS OAuth stays in Redis (sessions, encrypted tokens, OAuth pending). Postgres `users` is identity for FKs only: `id` + `usos_user_id` ([`users.ts`](src/lib/server/users.ts)).

- **`displayName`**: from USOS at login, stored in **Redis session** (`sessionRecordSchema`), not in `users`.
- Do not re-add Redis `user:{id}` or `user:by-usos:*` blobs.

---

## UI primitives (Bits UI)

Role-model wrapper: [`src/lib/components/ui/button.svelte`](src/lib/components/ui/button.svelte). Match it when adding new Bits-backed components (`cva` + `cn`, `<script module>` exports, `VariantProps`, Snippet children).

Full checklist: [`src/lib/components/ui/README.md`](src/lib/components/ui/README.md).

---

Svelte MCP server: Svelte 5 + SvelteKit docs. Tool usage:

## Available Svelte MCP Tools:

### 1. list-sections

FIRST — discover doc sections. Returns titles, use_cases, paths.
Svelte/SvelteKit questions → use at chat start.

### 2. get-documentation

Full doc content for section(s). Single or multiple.
After list-sections: check use_cases, fetch ALL relevant sections.

### 3. svelte-autofixer

Svelte code issues + suggestions.
MUST run before sending Svelte code to user. Repeat until clean.

### 4. playground-link

Svelte Playground link from code.
After code done: ask user first. NEVER if code written to project files.
