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

### Imports (no barrel re-exports)

Import from the module that **defines** the symbol. Do not re-export types, classes, or helpers from unrelated files (e.g. `auth.ts` must not `export { createUserId } from "./users"`).

| Need | Import from |
|------|-------------|
| `AuthUser`, session/OAuth types | [`auth-types.ts`](src/lib/server/auth-types.ts) |
| `createUserId`, `resolveUser` | [`users.ts`](src/lib/server/users.ts) |
| `AccessDeniedError`, `assertUserAccess` | [`access-guard.ts`](src/lib/server/access-guard.ts) |
| `UsosOAuthTokens`, `UsosUserProfile`, … | [`usos-types.ts`](src/lib/server/usos-types.ts) |
| `CatalogSyncSummary`, scraped types | [`catalog-types.ts`](src/lib/server/catalog-types.ts) |
| `syncCatalog`, scrape helpers | [`catalog-sync.ts`](src/lib/server/catalog-sync.ts), [`catalog-scraper.ts`](src/lib/server/catalog-scraper.ts) |
| Sessions, OAuth flow | [`auth.ts`](src/lib/server/auth.ts) — only what that file exports |
| USOS HTTP helpers | [`usos-oauth.ts`](src/lib/server/usos-oauth.ts) — functions/constants only |

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
- **Primary keys**: always **UUID v7** for new row `id` values (time-ordered). Generate in app code with `v7()` from [`uuid`](https://www.npmjs.com/package/uuid) — see [`users.ts`](src/lib/server/users.ts). Do not rely on `gen_random_uuid()` (v4) for inserts. New migrations: prefer `id uuid PRIMARY KEY` without a v4 default; supply v7 on insert.

### Database structure

Two **decoupled** domains in `public` — no FKs between `catalog_*` and `plan_*`. User plans copy snapshot fields from catalog when created; afterwards they diverge.

**Reference catalog** (Informator scrape → [`catalog-sync.ts`](src/lib/server/catalog-sync.ts)):

| Table | Purpose | Notable columns |
|-------|---------|-----------------|
| `catalog_programme` | Niestacjonarne programme variant | `code` (unique, e.g. `W1-N1KO19.2025`), `name` (area + label), `semester_count` |
| `catalog_subject` | Modules per semester | `catalog_programme_id`, `semester_number`, `module_code`, `module_name`, `catalog_id`, `activities` (JSONB) |

Unique: `catalog_subject (catalog_programme_id, module_code, semester_number)` where `module_code` is set.

**User plans** (app mutations after session + `plan_ownership` check):

| Table | Purpose |
|-------|---------|
| `users` | Identity FK target (`id`, `usos_user_id`) |
| `plan` | Plan header; snapshot `programme_code`, `programme_name` (no catalog FK) |
| `plan_ownership` | `plan_id` + `user_id` + `role` |
| `plan_semester` | `plan_id`, `number`, `start_date`, `end_date` (`date`, nullable in DB; set on create) |
| `plan_semester_subject` | Module snapshot: `module_code`, `module_name` |
| `plan_semester_subject_group` | `activity_kind`, `hours_total`, `group_index`, optional `lecturer_usos_id` (USOS staff id; display name resolved via USOS `user`; no FK to `lecturer_availability`), optional `room_usos_id` (USOS room id; display number resolved via USOS `geo/room`) |
| `plan_semester_day_layout` | `date`, `slots` (JSONB — validate with `parseDaySlots`) |
| `plan_schedule_entry` | Concrete slot for a group (`start_date_time`, `end_date_time`) |

**Other**: `lecturer_availability` keyed by `usos_id` (referenced from `plan_semester_subject_group`).

**JSONB validation**: `catalog_subject.activities` → [`planner-schemas.ts`](src/lib/server/planner-schemas.ts) (`parseSubjectActivities`); `plan_semester_day_layout.slots` → `parseDaySlots`.

### Auth vs Postgres

USOS OAuth stays in Redis (sessions, encrypted tokens, OAuth pending). Postgres `users` is identity for FKs only: `id` + `usos_user_id` ([`users.ts`](src/lib/server/users.ts)).

- **`displayName`**: from USOS at login, stored in **Redis session** (`sessionRecordSchema`), not in `users`.
- Do not re-add Redis `user:{id}` or `user:by-usos:*` blobs.

---

## UI primitives (Bits UI)

Role-model wrapper: [`src/lib/components/ui/button.svelte`](src/lib/components/ui/button.svelte). Match it when adding new Bits-backed components (`cva` + `cn`, `<script module>` exports, `VariantProps`, Snippet children).

Full checklist: [`src/lib/components/ui/README.md`](src/lib/components/ui/README.md).

### Dates and calendars

Stack: **[Bits UI](https://www.bits-ui.com/docs/components/date-picker)** date primitives + **[`@internationalized/date`](https://react-spectrum.adobe.com/internationalized/date/)** for calendar math. Docs: [Date Picker](https://www.bits-ui.com/docs/components/date-picker), [Date Range Picker](https://www.bits-ui.com/docs/components/date-range-picker); project rule [`.cursor/rules/bits-ui-docs.mdc`](.cursor/rules/bits-ui-docs.mdc) points at `/llms.txt` before non-trivial wiring.

#### UI wrappers (this repo)

| Component | File | Bits primitive | `bind:value` type | Use when |
|-----------|------|----------------|-------------------|----------|
| Single date | [`date-picker.svelte`](src/lib/components/ui/date-picker.svelte) | `DatePicker.*` | `DateValue \| undefined` | One calendar day (plan semester bounds, etc.) |
| Range | [`date-range-picker.svelte`](src/lib/components/ui/date-range-picker.svelte) | `DateRangePicker.*` | `DateRange \| undefined` (`{ start?, end? }`) | Pick start+end in one control (lecturer unavailable dates) |

Shared defaults on both: `locale="pl-PL"`, `granularity="day"`, `weekdayFormat="short"`, `fixedWeeks={true}`. Optional `label` prop; styling lives **inside** the primitive (bordered input row + popover calendar). Pages only add layout (`flex`, `gap`, `max-w`) — no Tailwind on picker internals.

**Component tree** (single-date; range is the same with `DateRangePicker` and two `Input type="start"|"end"`):

```
wrapper `div` (layout group — `DatePicker.Root` has no `class` prop)
└── *.Root bind:value
    ├── *.Label (optional)
    ├── div (bordered field: segments + trigger)
    │   ├── *.Input → segments → *.Segment per part
    │   └── *.Trigger → calendar icon
    └── *.Content
        └── *.Calendar
            ├── *.Header → PrevButton, Heading, NextButton
            └── Grid → HeadCell weekdays, Body → Cell → Day
```

**Bits UI quirk:** `DatePicker.Root` typings omit `class`; put layout classes on a **wrapper `div`**. `DateRangePicker.Root` accepts `class` (merged via `cn`); that wrapper still exposes optional `class?: string` for width at call sites (e.g. lecturer page).

#### Boundary: picker ↔ API ↔ Postgres

| Layer | Format | Notes |
|-------|--------|--------|
| Component state | `DateValue` / `DateRange` | From `@internationalized/date` + `bits-ui`; never send raw to API |
| HTTP / Zod | `yyyy-MM-dd` strings | `isoDateSchema` regex in feature `*-schemas.ts` (see [`plan-schemas.ts`](src/lib/plan-schemas.ts), [`lecturer-availability-schemas.ts`](src/lib/lecturer-availability-schemas.ts)) |
| Ordering | `parseDate(iso).compare(…)` | Use in `.refine()` for `end >= start`, not string compare |
| Postgres `plan_semester` | `date` columns `start_date`, `end_date` | ISO date strings on insert; nullable in schema but required on plan create |

Convert picker → API:

```ts
import { dateValueToIso } from "$lib/date-ranges";
// dateValueToIso(startDate) → "2026-09-01"
```

[`date-ranges.ts`](src/lib/date-ranges.ts) also has `groupConsecutiveIsoDates` / `formatIsoDateRange` for lecturer chips. Expanding a `DateRange` to per-day ISO strings: loop `CalendarDate` with `.add({ days: 1 })` (see [`dostepnosc-prowadzacych/[usos_id]/+page.svelte`](src/routes/dostepnosc-prowadzacych/[usos_id]/+page.svelte) `expandDateRange`).

#### Plan create + semester dates

Feature modules: [`plan-schemas.ts`](src/lib/plan-schemas.ts) + [`plan-types.ts`](src/lib/plan-types.ts), [`plan-queries.ts`](src/lib/plan-queries.ts), [`plan-mutations.ts`](src/lib/plan-mutations.ts), [`POST /api/plans`](src/routes/api/plans/+server.ts), form [`(plans)/nowy/+page.svelte`](src/routes/(plans)/nowy/+page.svelte).

- `planCreateSchema`: mandatory `start_date`, `end_date`; shared client + server validation.
- On create, **same** `start_date` / `end_date` copied onto **every** selected `plan_semester` row (not per-semester ranges yet).
- Partial insert rollback: delete `plan` row → `ON DELETE CASCADE` cleans children (no Supabase JS transaction; RPC deferred).

#### Adding a new date field

1. Pick `date-picker` vs `date-range-picker`.
2. `$state<DateValue | undefined>` (or `DateRange`) in page; `dateValueToIso` before `safeParse`.
3. Add `isoDateSchema` + `.refine` for range order in the feature `*-schemas.ts`.
4. Persist ISO strings to Postgres `date` / `timestamptz` as appropriate.

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
