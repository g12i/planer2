<script lang="ts">
  import { page } from "$app/state";
  import { Searcher } from "fast-fuzzy";
  import MagnifyingGlassIcon from "phosphor-svelte/lib/MagnifyingGlassIcon";
  import { setContext } from "svelte";
  import { createMutation, createQuery, useQueryClient } from "@tanstack/svelte-query";
  import type { PlanDetail, PlanDetailSubject } from "$lib/plan-types";

  import PlanSubjectSidebar from "./plan-subject-sidebar.svelte";
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
  import { updatePlanNameMutationOptions } from "$lib/plan-mutations";
  import { invalidateScheduleConflicts } from "$lib/schedule-conflict-queries";
  import type { LayoutProps } from "./$types";

  let { data, children }: LayoutProps = $props();

  const planId = $derived(page.params.id ?? "");
  const queryClient = useQueryClient();

  $effect(() => {
    if (!planId) {
      return;
    }
    void invalidateScheduleConflicts(queryClient, planId);
  });

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

  const isSearching = $derived(Boolean(subjectQuery.trim()));

  const subjectSearcher = $derived(
    new Searcher(activeSemester?.subjects ?? [], {
      keySelector: (subject: PlanDetailSubject) => [
        subject.module_name,
        subject.module_code ?? "",
        ...subject.groups.flatMap((group) => [
          group.activity_kind,
          group.label ?? "",
        ]),
      ],
      threshold: 0.7,
    }),
  );

  const filteredSubjects = $derived(
    isSearching
      ? subjectSearcher.search(subjectQuery)
      : (activeSemester?.subjects ?? []),
  );

  const planTitle = $derived(plan?.name ?? plan?.programme_code ?? "Plan");

  const renameMutation = createMutation(() =>
    updatePlanNameMutationOptions(queryClient, planId),
  );

  let titleEl = $state<HTMLHeadingElement | null>(null);

  function handleTitleBlur() {
    if (!titleEl) return;
    const text = titleEl.textContent?.trim() ?? "";
    if (text && text !== planTitle) {
      renameMutation.mutate({ name: text });
    } else {
      titleEl.textContent = planTitle;
    }
  }

  function handleTitleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      titleEl?.blur();
    }
    if (e.key === "Escape") {
      if (titleEl) titleEl.textContent = planTitle;
      titleEl?.blur();
    }
  }

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
      <AppShell user={data.user}>
        {#snippet title()}
          <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
          <h1
            bind:this={titleEl}
            class="cursor-text truncate rounded-sm px-1 text-sm font-semibold text-foreground outline-none ring-ring focus:ring-1"
            contenteditable="true"
            role="textbox"
            onblur={handleTitleBlur}
            onkeydown={handleTitleKeydown}
          >{planTitle}</h1>
        {/snippet}
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
              {:else if filteredSubjects.length === 0}
                <p class="px-4 py-2 text-xs text-foreground-alt">Brak wyników</p>
              {:else}
                <PlanSubjectSidebar
                  subjects={filteredSubjects}
                  planId={planId}
                />
              {/if}
            </ScrollArea>
          </div>
        {/snippet}

        {@render children()}
      </AppShell>
    </Tabs>
  {/if}
{/if}
