<script lang="ts">
  import { getContext } from "svelte";
  import CheckIcon from "phosphor-svelte/lib/CheckIcon";
  import SlidersHorizontalIcon from "phosphor-svelte/lib/SlidersHorizontalIcon";
  import SquareIcon from "phosphor-svelte/lib/SquareIcon";
  import type { PlanDetailSubject } from "$lib/plan-types";

  import { activityCardColor, dotColor } from "$lib/activity-card-hue";
  import { cardColors } from "$lib/card-colors.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Tooltip from "$lib/components/ui/tooltip.svelte";
  import {
    PLAN_DETAIL_KEY,
    type PlanDetailContextValue,
  } from "$lib/plan-detail-context";
  import { formatGroupTitle } from "./plan-group-label";
  import { remainingGroupHours } from "./plan-group-hours";
  import {
    PLAN_GROUP_DRAG_TYPE,
    type PlanGroupDragPayload,
  } from "./plan-day-slots";
  import { dragState } from "./plan-drag-state.svelte";
  import SubjectGroupsDialog from "./subject-groups-dialog.svelte";

  type Props = {
    subjects: PlanDetailSubject[];
    planId: string;
  };

  let { subjects, planId }: Props = $props();

  const planDetail = getContext<PlanDetailContextValue>(PLAN_DETAIL_KEY);
  const scheduleEntries = $derived(
    planDetail.activeSemester?.schedule_entries ?? [],
  );

  let settingsOpen = $state(false);
  let settingsSubject = $state<PlanDetailSubject | null>(null);
  let draggingGroupId = $state<string | null>(null);

  function openSettings(subject: PlanDetailSubject) {
    settingsSubject = subject;
    settingsOpen = true;
  }

  function onGroupDragStart(
    event: DragEvent,
    subject: PlanDetailSubject,
    group: PlanDetailSubject["groups"][number],
  ) {
    if (
      remainingGroupHours(group.hours_total, group.id, scheduleEntries) <= 0
    ) {
      event.preventDefault();
      return;
    }

    const payload: PlanGroupDragPayload = {
      groupId: group.id,
      subjectName: subject.module_name,
    };
    event.dataTransfer?.setData(PLAN_GROUP_DRAG_TYPE, JSON.stringify(payload));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy";
    }
    draggingGroupId = group.id;
    dragState.groupId = group.id;
  }

  function onGroupDragEnd() {
    draggingGroupId = null;
    dragState.groupId = null;
  }
</script>

{#snippet groupList(subject: PlanDetailSubject)}
  {#if subject.groups.length === 0}
    <p
      class="border-border-card ml-3 border-l py-1 pl-3 text-xs text-foreground-alt"
    >
      Brak grup
    </p>
  {:else}
    <ul class="border-border-card ml-3 space-y-0.5 border-l py-1 pl-3">
      {#each subject.groups as group (group.id)}
        {@const remaining = remainingGroupHours(
          group.hours_total,
          group.id,
          scheduleEntries,
        )}
        {@const color = activityCardColor({
          subjectName: subject.module_name,
          activityKind: group.activity_kind,
          groupIndex: group.group_index,
        })}
        <li
          draggable={remaining > 0}
          class="flex items-center gap-2 py-1 pr-3 text-xs {remaining > 0
            ? 'cursor-grab active:cursor-grabbing'
            : ''} {draggingGroupId === group.id ? 'opacity-50' : ''}"
          ondragstart={(event) => onGroupDragStart(event, subject, group)}
          ondragend={onGroupDragEnd}
        >
          {#if cardColors.enabled}
            <SquareIcon
              weight="fill"
              class="size-2 shrink-0"
              color={dotColor(color)}
            />
          {/if}
          <span class="min-w-0 flex-1 truncate"
            >{formatGroupTitle(group, subject.groups)}</span
          >
          {#if remaining <= 0}
            <CheckIcon
              class="size-3.5 shrink-0 text-muted-foreground"
              weight="bold"
              aria-label="Wszystkie godziny zaplanowane"
            />
          {:else}
            <span class="shrink-0 text-foreground-alt"
              >{remaining}/{group.hours_total}</span
            >
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
{/snippet}

<ul class="space-y-2 px-2 py-2">
  {#each subjects as subject (subject.id)}
    <li>
      <div class="flex items-center gap-1 px-3 py-1">
        <p class="min-w-0 flex-1 truncate text-sm font-medium">
          {subject.module_name}
        </p>
        <Tooltip label="Ustawienia grup zajęć">
          {#snippet trigger(props)}
            <Button
              {...props}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Ustawienia grup zajęć"
              onclick={() => openSettings(subject)}
            >
              <SlidersHorizontalIcon />
            </Button>
          {/snippet}
        </Tooltip>
      </div>
      {@render groupList(subject)}
    </li>
  {/each}
</ul>

{#if settingsOpen && settingsSubject}
  <SubjectGroupsDialog
    bind:open={settingsOpen}
    {planId}
    subject={settingsSubject}
  />
{/if}
