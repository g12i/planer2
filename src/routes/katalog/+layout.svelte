<script lang="ts">
  import { Searcher } from "fast-fuzzy";
  import { page } from "$app/state";

  import Tooltip from "$lib/components/ui/tooltip.svelte";
  import AppShell from "$lib/components/app-shell/app-shell.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
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
  <AppShell user={data.user} title="Katalog">
    {#snippet sidebar()}
      <div class="shrink-0 space-y-3 border-border-card border-b px-4 py-4">
        <h2 class="text-sm font-semibold text-foreground">Katalog programów</h2>
        <Input
          type="search"
          placeholder="Szukaj programu..."
          class="w-full"
          value={query}
          oninput={(e) => {
            query = e.currentTarget.value;
          }}
        />
      </div>

      <ScrollArea>
        <ul class="space-y-0.5 px-2 py-2">
          {#each filtered as programme (programme.id)}
            <li>
              <Tooltip label={`${programme.name} - ${programme.code}`}>
                {#snippet trigger(props)}
                  <Button
                    {...props}
                    href="/katalog/{programme.code}"
                    variant={activeCode === programme.code
                      ? "primary"
                      : "ghost"}
                    class="w-full justify-start text-left font-normal"
                  >
                    <span class="truncate">{programme.name}</span>
                  </Button>
                {/snippet}
              </Tooltip>
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
