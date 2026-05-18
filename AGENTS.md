## Project Configuration

- **Language**: TypeScript
- **Package Manager**: yarn
- **Add-ons**: tailwindcss, mcp
- **Runtime validation**: Zod (parse at boundaries — see below)

---

## Parse, don't cast

External data (API responses, `JSON.parse`, webhooks) is **unknown** until validated. Do not use `as SomeType` on it.

- Use **[Zod](https://zod.dev)** — default validator for this project (ecosystem, `safeParse`, inferred types).
- Define schemas in [`$lib/server/`](src/lib/server/) next to the integration (e.g. [`usos-schemas.ts`](src/lib/server/usos-schemas.ts)).
- Use `schema.safeParse(value)` (or shared helpers like `parseJsonBody`) and handle failures explicitly.
- Infer types with `z.infer<typeof schema>` when the schema is the source of truth.

References: [Parse, don't cast](https://typescript.odone.me/parse-dont-cast/), [Zod vs alternatives (2026)](https://www.pkgpulse.com/guides/zod-v4-vs-arktype-vs-typebox-vs-valibot-2026).

## Boolean coercion

When you need a `boolean` from a value, use `Boolean(x)`. Do not use `!!x`.

```ts
// good
const hasToken = Boolean(sessionId);

// bad
const hasToken = !!sessionId;
```

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available Svelte MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
