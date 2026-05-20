<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import { Searcher } from "fast-fuzzy";
  import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import PlusIcon from "phosphor-svelte/lib/PlusIcon";

  import { page } from "$app/state";
  import AppShell from "$lib/components/app-shell/app-shell.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import MenuItem from "$lib/components/ui/menu-item.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";
  import Skeleton from "$lib/components/ui/skeleton.svelte";
  import { lecturerAvailabilityQueries } from "$lib/lecturer-availability-queries";
  import type { LecturerAvailabilityListItem } from "$lib/lecturer-availability-types";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  let query = $state("");

  const listQuery = createQuery(() => lecturerAvailabilityQueries.list());

  const lecturers = $derived(listQuery.data ?? []);

  const searcher = $derived(
    new Searcher(lecturers, {
      keySelector: (lecturer: LecturerAvailabilityListItem) => [
        lecturer.name,
        lecturer.usos_id,
      ],
      threshold: 0.7,
    }),
  );

  const filtered = $derived(query.trim() ? searcher.search(query) : lecturers);

  const activeUsosId = $derived(page.params.usos_id);

  const listSkeletonCount = 3;
</script>

{#if data.user}
  <AppShell user={data.user} title="Dostępność prowadzących">
    {#snippet sidebar()}
      <div class="shrink-0 space-y-3 border-border-card border-b px-4 py-2">
        <Input
          type="search"
          placeholder="Szukaj prowadzącego..."
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
          aria-label="Lista prowadzących"
        >
          {#if listQuery.isPending}
            {#each Array.from({ length: listSkeletonCount }, (_, index) => index) as index (index)}
              <li class="px-3 py-2">
                <Skeleton class="h-5 w-full" />
              </li>
            {/each}
          {:else}
            {#each filtered as lecturer (lecturer.usos_id)}
              <li>
                <MenuItem
                  href="/dostepnosc-prowadzacych/{encodeURIComponent(
                    lecturer.usos_id,
                  )}"
                  active={activeUsosId === lecturer.usos_id}
                >
                  {lecturer.name}
                </MenuItem>
              </li>
            {/each}
            {#if filtered.length === 0}
              <li class="px-3 py-2 text-xs text-foreground-alt">
                {lecturers.length === 0 ? "Brak zapisów" : "Brak wyników"}
              </li>
            {/if}
          {/if}
        </ul>
      </ScrollArea>

      <div class="shrink-0 border-border-card border-t p-3">
        <Button
          href="/dostepnosc-prowadzacych/nowy"
          variant="primary"
          class="w-full"
        >
          <PlusIcon class="size-4" weight="bold" />
          Dodaj dostępność
        </Button>
      </div>
    {/snippet}
    {@render children()}
  </AppShell>
{:else}
  {@render children()}
{/if}
