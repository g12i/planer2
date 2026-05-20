<script lang="ts">
  import { page } from "$app/state";
  import { Searcher } from "fast-fuzzy";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";
  import { createQuery } from "@tanstack/svelte-query";

  import AppShell from "$lib/components/app-shell/app-shell.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import Tooltip from "$lib/components/ui/tooltip.svelte";
  import { planQueries } from "$lib/plan-queries";
  import type { PlanListItem } from "$lib/plan-types";
  import type { LayoutProps } from "./$types";
  import { MagnifyingGlassIcon } from "phosphor-svelte";
  import MenuItem from "$lib/components/ui/menu-item.svelte";

  let { data, children }: LayoutProps = $props();

  let query = $state("");

  const listQuery = createQuery(() => planQueries.list());

  const plans = $derived(listQuery.data ?? []);

  const searcher = $derived(
    new Searcher(plans, {
      keySelector: (plan: PlanListItem) => [
        plan.name ?? "",
        plan.programme_name ?? "",
        plan.programme_code ?? "",
      ],
      threshold: 0.7,
    }),
  );

  const filtered = $derived(query.trim() ? searcher.search(query) : plans);

  const listSkeletonCount = 3;

  function planLabel(plan: PlanListItem): string {
    return plan.name ?? plan.programme_code ?? "Plan bez nazwy";
  }

  const isPlanDetail = $derived.by(() => {
    const path = page.url.pathname;
    return /^\/plany\/[^/]+$/.test(path) && path !== "/plany/nowy";
  });
</script>

{#if data.user}
  {#if isPlanDetail}
    {@render children()}
  {:else}
    <AppShell user={data.user} title="Plany">
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
          <ul
            class="space-y-0.5 px-2 py-2"
            aria-busy={listQuery.isPending}
            aria-label="Lista planów"
          >
            {#if listQuery.isPending}
              {#each Array.from({ length: listSkeletonCount }, (_, index) => index) as index (index)}
                <li class="px-3 py-2">
                  <Skeleton class="h-5 w-full" />
                </li>
              {/each}
            {:else}
              {#each filtered as plan (plan.id)}
                <li>
                  <MenuItem
                    href="/plany/{plan.id}"
                    class="w-full justify-start text-left font-normal"
                  >
                    <span class="truncate">{planLabel(plan)}</span>
                  </MenuItem>
                </li>
              {/each}
              {#if filtered.length === 0}
                <li class="px-3 py-2 text-xs text-foreground-alt">
                  {plans.length === 0 ? "Brak planów" : "Brak wyników"}
                </li>
              {/if}
            {/if}
          </ul>
        </ScrollArea>

        <div class="shrink-0 border-border-card border-t p-3">
          <Button href="/plany/nowy" variant="primary" class="w-full" size="sm">
            <PlusIcon weight="bold" />
            Nowy plan
          </Button>
        </div>
      {/snippet}
      {@render children()}
    </AppShell>
  {/if}
{:else}
  {@render children()}
{/if}
