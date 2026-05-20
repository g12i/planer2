<script lang="ts">
  import { page } from "$app/state";
  import { Searcher } from "fast-fuzzy";
  import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import { setContext } from "svelte";
  import { createQuery } from "@tanstack/svelte-query";
  import type { PlanDetail, PlanDetailSubject } from "$lib/plan-types";

  import AppShell from "$lib/components/app-shell/app-shell.svelte";
  import Input from "$lib/components/ui/input.svelte";
  import ScrollArea from "$lib/components/ui/scroll-area.svelte";
  import Tabs from "$lib/components/ui/tabs.svelte";
  import TabsList from "$lib/components/ui/tabs-list.svelte";
  import TabsTrigger from "$lib/components/ui/tabs-trigger.svelte";
  import {
    PLAN_DETAIL_KEY,
    type PlanDetailContextValue,
  } from "$lib/plan-detail-context";
  import { planQueries } from "$lib/plan-queries";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  const planId = $derived(page.params.id ?? "");

  const detailQuery = createQuery(() => ({
    ...planQueries.detail(planId),
    enabled: Boolean(planId),
  }));

  const plan = $derived(detailQuery.data);
  const semesters = $derived(plan?.semesters ?? []);

  let activeSemesterId = $state("");
  let subjectQuery = $state("");

  $effect(() => {
    const items = semesters;
    if (items.length === 0) {
      return;
    }
    if (!items.some((semester) => semester.id === activeSemesterId)) {
      activeSemesterId = items[0].id;
    }
  });

  $effect(() => {
    activeSemesterId;
    subjectQuery = "";
  });

  const activeSemester = $derived(
    semesters.find((semester) => semester.id === activeSemesterId),
  );

  const subjectSearcher = $derived(
    new Searcher(activeSemester?.subjects ?? [], {
      keySelector: (subject: PlanDetailSubject) => [
        subject.module_name,
        subject.module_code ?? "",
      ],
      threshold: 0.7,
    }),
  );

  const filteredSubjects = $derived(
    subjectQuery.trim()
      ? subjectSearcher.search(subjectQuery)
      : (activeSemester?.subjects ?? []),
  );

  const planTitle = $derived(plan?.name ?? plan?.programme_code ?? "Plan");

  setContext(PLAN_DETAIL_KEY, {
    get plan(): PlanDetail {
      return plan as PlanDetail;
    },
    get semesters() {
      return semesters;
    },
    get activeSemesterId() {
      return activeSemesterId;
    },
    get activeSemester() {
      return activeSemester;
    },
  } satisfies PlanDetailContextValue);
</script>

{#if data.user}
  {#if detailQuery.isPending}
    <p class="p-6 text-sm">Ładowanie planu…</p>
  {:else if detailQuery.isError}
    <p role="alert" class="p-6 text-sm">Nie udało się pobrać planu.</p>
  {:else if plan}
    <Tabs bind:value={activeSemesterId}>
      <AppShell user={data.user} title={planTitle}>
        {#snippet toolbar()}
          {#if semesters.length > 0}
            <TabsList>
              {#each semesters as semester (semester.id)}
                <TabsTrigger value={semester.id}>
                  Semestr {semester.number}
                </TabsTrigger>
              {/each}
            </TabsList>
          {/if}
        {/snippet}

        {#snippet sidebar()}
          <div class="flex min-h-0 flex-1 flex-col">
            <div
              class="shrink-0 space-y-3 border-border-card border-b px-4 py-2"
            >
              <Input
                type="search"
                placeholder="Szukaj przedmiotów..."
                class="w-full"
                value={subjectQuery}
                oninput={(e) => {
                  subjectQuery = e.currentTarget.value;
                }}
                size="sm"
              >
                {#snippet left()}
                  <MagnifyingGlassIcon class="size-4 text-foreground-alt" />
                {/snippet}
              </Input>
            </div>

            <ScrollArea>
              {#if !activeSemester}
                <p class="px-4 py-2 text-sm text-foreground-alt">
                  Wybierz semestr
                </p>
              {:else if activeSemester.subjects.length === 0}
                <p class="px-4 py-2 text-sm text-foreground-alt">
                  Brak przedmiotów
                </p>
              {:else}
                <ul class="space-y-0.5 px-2 py-2">
                  {#each filteredSubjects as subject (subject.id)}
                    <li class="px-3 py-2 text-sm">{subject.module_name}</li>
                  {/each}
                  {#if filteredSubjects.length === 0}
                    <li class="px-3 py-2 text-xs text-foreground-alt">
                      Brak wyników
                    </li>
                  {/if}
                </ul>
              {/if}
            </ScrollArea>
          </div>
        {/snippet}

        {@render children()}
      </AppShell>
    </Tabs>
  {/if}
{/if}
