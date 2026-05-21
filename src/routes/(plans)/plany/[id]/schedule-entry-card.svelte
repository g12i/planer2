<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import {
    activityCardColor,
    activityCardStyle,
    activityCardStyleDark,
  } from "$lib/activity-card-hue";
  import { cardColors } from "$lib/card-colors.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import DropdownMenu from "$lib/components/ui/dropdown-menu.svelte";
  import DropdownMenuItem from "$lib/components/ui/dropdown-menu-item.svelte";
  import type { PlanDetailSubjectGroup } from "$lib/plan-types";
  import type { ScheduleConflict } from "$lib/schedule-conflict-types";
  import { theme } from "$lib/theme.svelte";
  import { usosQueries } from "$lib/usos-queries";
  import {
    formatUsosUserDisplayName,
    formatUsosUserStoredName,
  } from "$lib/usos-users-schemas";
  import SlidersHorizontalIcon from "phosphor-svelte/lib/SlidersHorizontalIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";

  import {
    formatActivityKindLine,
    formatGroupTitle,
    shouldShowGroupLabel,
  } from "./plan-group-label";
  import { XIcon } from "phosphor-svelte";
  import WarningIcon from "phosphor-svelte/lib/WarningIcon";
  import Popover from "$lib/components/ui/popover.svelte";
  import Tooltip from "$lib/components/ui/tooltip.svelte";

  type Props = {
    subjectName: string;
    group: PlanDetailSubjectGroup;
    groups: PlanDetailSubjectGroup[];
    cumulativeHours: number;
    conflicts?: ScheduleConflict[];
    dragging: boolean;
    ondragstart: (event: DragEvent) => void;
    ondragend: () => void;
    onremove: () => void;
  };

  let {
    subjectName,
    group,
    groups,
    cumulativeHours,
    conflicts = [],
    dragging,
    ondragstart,
    ondragend,
    onremove,
  }: Props = $props();

  const color = $derived(
    activityCardColor({
      subjectName,
      activityKind: group.activity_kind,
      groupIndex: group.group_index,
    }),
  );

  const lecturerQuery = createQuery(() => ({
    ...usosQueries.user(group.lecturer_usos_id as string),
    enabled: Boolean(group.lecturer_usos_id),
  }));

  const roomQuery = createQuery(() => ({
    ...usosQueries.room(group.room_usos_id as string),
    enabled: Boolean(group.room_usos_id),
  }));

  const lecturerLine = $derived.by(() => {
    if (!group.lecturer_usos_id) {
      return " — ";
    }
    if (lecturerQuery.data) {
      return formatUsosUserStoredName(lecturerQuery.data);
    }
    if (lecturerQuery.isPending) {
      return "…";
    }
    return formatUsosUserDisplayName({ id: group.lecturer_usos_id });
  });

  const activityKindLine = $derived(formatActivityKindLine(group, groups));

  const hoursLine = $derived(`${cumulativeHours}/${group.hours_total}`);

  const groupLine = $derived.by(() => {
    if (!shouldShowGroupLabel(group, groups)) {
      return null;
    }
    return formatGroupTitle(group, groups);
  });

  const roomLine = $derived.by(() => {
    if (!group.room_usos_id) {
      return null;
    }
    if (roomQuery.data) {
      return roomQuery.data.number;
    }
    if (roomQuery.isPending) {
      return "…";
    }
    return null;
  });

  const maxConflictSeverity = $derived(
    conflicts.some((conflict) => conflict.severity === "error")
      ? "error"
      : conflicts.some((conflict) => conflict.severity === "warning")
        ? "warning"
        : null,
  );

  const conflictBorderClass = $derived.by(() => {
    if (!maxConflictSeverity) {
      return "";
    }
    if (maxConflictSeverity === "error") {
      return "border-destructive ring-1 ring-destructive/40";
    }
    return "border-amber-500 ring-1 ring-amber-500/40";
  });

  const cardBorderClass = $derived.by(() => {
    if (maxConflictSeverity) {
      return conflictBorderClass;
    }
    return cardColors.enabled
      ? "border-transparent"
      : "border-border-card bg-muted/40";
  });
</script>

<div
  role="button"
  tabindex={-1}
  draggable="true"
  aria-label="Przenieś {subjectName}"
  class="relative flex cursor-grab items-start gap-1 rounded-md border px-2 py-1 text-xs active:cursor-grabbing {cardBorderClass} {dragging
    ? 'opacity-50'
    : ''}"
  style={cardColors.enabled
    ? theme.dark
      ? activityCardStyleDark(color)
      : activityCardStyle(color)
    : undefined}
  {ondragstart}
  {ondragend}
>
  <div class="min-w-0 flex-1">
    <p class="truncate font-medium">
      {subjectName}
    </p>
    <p
      class="truncate {cardColors.enabled
        ? 'opacity-75'
        : 'text-foreground-alt'}"
    >
      {activityKindLine}
    </p>
    <p
      class="truncate {cardColors.enabled
        ? 'opacity-75'
        : 'text-foreground-alt'}"
    >
      {lecturerLine}
    </p>
    <p
      class="truncate tabular-nums {cardColors.enabled
        ? 'opacity-75'
        : 'text-foreground-alt'}"
    >
      {hoursLine}
    </p>
    {#if roomLine}
      <p
        class="truncate {cardColors.enabled
          ? 'opacity-75'
          : 'text-foreground-alt'}"
      >
        {roomLine}
      </p>
    {/if}
  </div>
  {#if maxConflictSeverity}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute bottom-0.5 right-0.5 z-10"
      onpointerdown={(event) => event.stopPropagation()}
    >
      <Popover side="top">
        {#snippet trigger(props)}
          <button
            type="button"
            {...props}
            class="inline-flex size-5 items-center justify-center border-0 bg-transparent p-0 {maxConflictSeverity ===
            'error'
              ? 'text-destructive'
              : 'text-amber-600'}"
            aria-label="Konflikty planowania"
          >
            <WarningIcon class="size-3.5" weight="fill" />
          </button>
        {/snippet}
        {#snippet content()}
          <ul class="flex flex-col gap-1">
            {#each conflicts as conflict (conflict.entry_id + conflict.message)}
              <li
                class={conflict.severity === "error"
                  ? "text-destructive"
                  : "text-amber-600"}
              >
                {conflict.message}
              </li>
            {/each}
          </ul>
        {/snippet}
      </Popover>
    </div>
  {/if}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="shrink-0" onpointerdown={(event) => event.stopPropagation()}>
    <Tooltip label="Usuń wpis">
      {#snippet trigger(props)}
        <Button
          {...props}
          variant="ghost"
          size="icon-sm"
          aria-label="Usuń wpis"
          onclick={onremove}
        >
          <XIcon />
        </Button>
      {/snippet}
    </Tooltip>
  </div>
</div>
