<script lang="ts">
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
  import { theme } from "$lib/theme.svelte";
  import ListIcon from "phosphor-svelte/lib/ListIcon";
  import SlidersHorizontalIcon from "phosphor-svelte/lib/SlidersHorizontalIcon";
  import TrashIcon from "phosphor-svelte/lib/TrashIcon";

  import { formatGroupTitle } from "./plan-group-label";

  type Props = {
    subjectName: string;
    group: PlanDetailSubjectGroup;
    groups: PlanDetailSubjectGroup[];
    dragging: boolean;
    ondragstart: (event: DragEvent) => void;
    ondragend: () => void;
    onremove: () => void;
  };

  let {
    subjectName,
    group,
    groups,
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
</script>

<div
  role="button"
  tabindex={-1}
  draggable="true"
  aria-label="Przenieś {subjectName}"
  class="flex cursor-grab items-start gap-1 rounded-md border px-2 py-1 text-xs active:cursor-grabbing {cardColors.enabled
    ? 'border-transparent'
    : 'border-border-card bg-muted/40'} {dragging ? 'opacity-50' : ''}"
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
      {formatGroupTitle(group, groups)}
    </p>
  </div>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="shrink-0" onpointerdown={(event) => event.stopPropagation()}>
    <DropdownMenu
      contentProps={{ side: "bottom", align: "end", sideOffset: 4 }}
    >
      {#snippet trigger(props)}
        <Button
          variant="ghost"
          size="icon-sm"
          class="size-6"
          {...props}
          aria-label="Opcje wpisu"
        >
          <SlidersHorizontalIcon />
        </Button>
      {/snippet}
      {#snippet content()}
        <DropdownMenuItem onSelect={onremove}>
          {#snippet icon()}
            <TrashIcon />
          {/snippet}
          Usuń
        </DropdownMenuItem>
      {/snippet}
    </DropdownMenu>
  </div>
</div>
