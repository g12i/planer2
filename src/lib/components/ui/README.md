# UI primitives (`$lib/components/ui`)

## Role model

[`button.svelte`](./button.svelte) is the reference layout for Bits-backed primitives. Copy its structure when adding wrappers (inputs, dialogs, etc.) unless a component forces something different.

## Pattern checklist

1. **Bits UI** — Import the primitive from `bits-ui`; wrap `.Root` (or the documented parts). Before non-trivial wiring, fetch the relevant [`/llms.txt`](https://www.bits-ui.com/docs/llms.txt) docs (project Cursor rule: `.cursor/rules/bits-ui-docs.mdc`).
2. **`<script lang="ts" module>`** — Export `*Variants` from **`cva`** only when there are **actual variants** (variant/size axes). If the component only has a base class with no variant config, inline the class string in the template (or export a plain `const` if shared externally). See `button.svelte` (has variants → `cva`) vs `radio-group.svelte` (no variants → plain strings).
3. **`cn()`** — Merge variant classes with caller overrides via [`$lib/utils/cn.ts`](../utils/cn.ts) (`clsx` + `tailwind-merge`). Avoid raw string concatenation for Tailwind utilities.
4. **`VariantProps<typeof …Variants>`** — Extend props so `variant` / future axes stay typed together with DOM props.
5. **Props typing** — `Omit<SvelteHTMLElements['button'], 'class' | 'children'>` (or the right element) plus `{ children: Snippet }` and optional `class?: string`, then `{...rest}` onto the Bits primitive with merged `class`.
6. **Reactiveness** — Use **`$derived(cn(…))`** when merged classes depend on props.

## Class override policy

UI primitives **do not expose** `class`, `inputClass`, `contentClass`, `contentProps`, or similar styling escape hatches — unless there is a proven, in-use need. Callers should not override internal classes; if a primitive's look needs adjusting, change the primitive itself. Exception: a component's **root element** may accept `class?: string` (merged via `cn`) when layout context genuinely varies (e.g. width/margin at the call site).

## Scope

- **Buttons:** typed as native **buttons** only for now (`href` links → extend pattern or use Bits directly).
- **Design tokens** — Prefer theme utilities (`bg-accent`, `border-border-input`, …) from [`layout.css`](../../../routes/layout.css); keep primitives visually aligned.
