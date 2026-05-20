<script lang="ts">
  import { Searcher } from "fast-fuzzy";
  import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";

  import { page } from "$app/state";
  import AppShell from "$lib/components/app-shell/app-shell.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import MenuItem from "$lib/components/ui/menu-item.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let query = $state("");

  type Programme = (typeof data.programmes)[number];

  const searcher = $derived(
    new Searcher(data.programmes, {
      keySelector: (p: Programme) => [p.code, p.name],
      threshold: 0.7,
    }),
  );

  const filtered = $derived(
    query.trim() ? searcher.search(query) : data.programmes,
  );

  const activeCode = $derived(page.params.code);
</script>

{#if data.user}
  <AppShell user={data.user}>
    {#snippet title()}
      <h1 class="truncate text-sm font-semibold text-foreground">Katalog</h1>
    {/snippet}
    {#snippet sidebar()}
      <div class="shrink-0 space-y-3 border-border-card border-b px-4 py-2">
        <Input
          type="search"
          placeholder="Szukaj programu..."
          class="w-full"
          value={query}
          oninput={(e) => {
            query = e.currentTarget.value;
          }}
          size="sm"
        >
          {#snippet left()}
            <MagnifyingGlassIcon class="size-4 text-foreground-alt" />
          {/snippet}
        </Input>
      </div>

      <ScrollArea>
        <ul class="space-y-0.5 px-2 py-2">
          {#each filtered as programme (programme.id)}
            <li>
              <MenuItem
                href="/katalog/{programme.code}"
                active={activeCode === programme.code}
              >
                {programme.name}
              </MenuItem>
            </li>
          {/each}
          {#if filtered.length === 0}
            <li class="px-3 py-2 text-xs text-foreground-alt">Brak wyników</li>
          {/if}
        </ul>
      </ScrollArea>
    {/snippet}
    {@render children()}
  </AppShell>
{:else}
  {@render children()}
{/if}
