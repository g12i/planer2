<script lang="ts">
  import { Collapsible } from "bits-ui";
  import CaretDownIcon from "phosphor-svelte/lib/CaretDownIcon";
  import type { PlanDetailSubject } from "$lib/plan-types";

  import { formatGroupTitle } from "./plan-group-label";

  type Props = {
    subjects: PlanDetailSubject[];
    isSearching: boolean;
  };

  let { subjects, isSearching }: Props = $props();
</script>

{#if isSearching}
  <ul class="space-y-2 px-2 py-2">
    {#each subjects as subject (subject.id)}
      <li>
        <p class="px-3 py-1 text-sm font-medium">{subject.module_name}</p>
        {#if subject.groups.length === 0}
          <p
            class="border-border-card ml-3 border-l py-1 pl-3 text-xs text-foreground-alt"
          >
            Brak grup
          </p>
        {:else}
          <ul class="border-border-card ml-3 space-y-0.5 border-l py-1 pl-3">
            {#each subject.groups as group (group.id)}
              <li
                class="flex items-center gap-3 py-1 pr-3 text-xs text-foreground-alt"
              >
                <span class="min-w-0 flex-1 truncate"
                  >{formatGroupTitle(group, subject.groups)}</span
                >
                <span class="shrink-0 tabular-nums">· {group.hours_total}h</span
                >
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
{:else}
  <ul class="space-y-0.5 px-2 py-2">
    {#each subjects as subject (subject.id)}
      <li>
        <Collapsible.Root>
          <Collapsible.Trigger
            class="cursor-default rounded-md px-3 py-2 text-left text-sm hover:bg-muted/50 group flex w-full items-center gap-2"
            aria-label="Rozwiń grupy zajęć"
          >
            {#snippet child({ props })}
              <button type="button" {...props}>
                <span class="min-w-0 flex-1 truncate"
                  >{subject.module_name}</span
                >
                <CaretDownIcon
                  class="size-4 shrink-0 text-foreground-alt transition-transform duration-200 group-aria-expanded:rotate-180"
                  weight="bold"
                  aria-hidden="true"
                />
              </button>
            {/snippet}
          </Collapsible.Trigger>
          <Collapsible.Content class="overflow-hidden">
            {#if subject.groups.length === 0}
              <p
                class="border-border-card ml-3 border-l py-1 pl-3 text-xs text-foreground-alt"
              >
                Brak grup
              </p>
            {:else}
              <ul
                class="border-border-card ml-3 space-y-0.5 border-l py-1 pl-3"
              >
                {#each subject.groups as group (group.id)}
                  <li
                    class="flex items-center gap-3 py-1 pr-3 text-xs text-foreground-alt"
                  >
                    <span class="min-w-0 flex-1 truncate"
                      >{formatGroupTitle(group, subject.groups)}</span
                    >
                    <span class="shrink-0 tabular-nums"
                      >· {group.hours_total}h</span
                    >
                  </li>
                {/each}
              </ul>
            {/if}
          </Collapsible.Content>
        </Collapsible.Root>
      </li>
    {/each}
  </ul>
{/if}
