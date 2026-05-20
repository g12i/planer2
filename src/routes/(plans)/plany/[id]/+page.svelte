<script lang="ts">
  import { page } from "$app/state";
  import { getContext } from "svelte";
  import { parseDate } from "@internationalized/date";
  import {
    createMutation,
    createQuery,
    useQueryClient,
  } from "@tanstack/svelte-query";
  import ArrowUUpLeftIcon from "phosphor-svelte/lib/ArrowUUpLeftIcon";
  import CalendarCheckIcon from "phosphor-svelte/lib/CalendarCheckIcon";
  import ClockIcon from "phosphor-svelte/lib/ClockIcon";

  import TabsContent from "$lib/components/ui/tabs-content.svelte";
  import Button from "$lib/components/ui/button.svelte";
  import Tooltip from "$lib/components/ui/tooltip.svelte";
  import {
    createScheduleEntryMutationOptions,
    deleteDayLayoutMutationOptions,
    deleteScheduleEntryMutationOptions,
    updateScheduleEntryMutationOptions,
  } from "$lib/plan-mutations";
  import {
    formatIsoDayLabel,
    getWeekends,
    type WeekendPair,
  } from "$lib/date-ranges";
  import { holidayQueries } from "$lib/holiday-queries";
  import {
    PLAN_DETAIL_KEY,
    type PlanDetailContextValue,
  } from "$lib/plan-detail-context";
  import type {
    DayLayoutSlot,
    PlanDetailSemester,
    PlanDetailSubject,
    PlanDetailSubjectGroup,
    ScheduleEntry,
  } from "$lib/plan-types";

  import CustomHoursDialog from "./custom-hours-dialog.svelte";
  import { dragState } from "./plan-drag-state.svelte";
  import ScheduleEntryCard from "./schedule-entry-card.svelte";
  import {
    acceptsScheduleDrag,
    buildSlotTimestamp,
    entryMatchesSlot,
    getDaySlots,
    hasCustomDayLayout,
    PLAN_ENTRY_DRAG_TYPE,
    PLAN_GROUP_DRAG_TYPE,
    parsePlanGroupDragPayload,
    parsePlanScheduleEntryDragPayload,
    scheduleDragDropEffect,
  } from "./plan-day-slots";

  const planDetail = getContext<PlanDetailContextValue>(PLAN_DETAIL_KEY);
  const semesters = $derived(planDetail.semesters);
  const planId = $derived(page.params.id ?? "");
  const queryClient = useQueryClient();

  const holidayRange = $derived.by(() => {
    const withDates = semesters.filter(
      (semester) => semester.start_date && semester.end_date,
    );
    if (withDates.length === 0) {
      return null;
    }

    const starts = withDates.map((semester) => semester.start_date!);
    const ends = withDates.map((semester) => semester.end_date!);
    return {
      from: starts.sort()[0],
      to: ends.sort().at(-1)!,
    };
  });

  const holidaysQuery = createQuery(() => ({
    ...holidayQueries.forRange(
      holidayRange?.from ?? "",
      holidayRange?.to ?? "",
    ),
    enabled: Boolean(holidayRange),
  }));

  const holidays = $derived(holidaysQuery.data);

  const deleteDayLayoutMutation = createMutation(() =>
    deleteDayLayoutMutationOptions(queryClient, planId),
  );
  const createScheduleEntryMutation = createMutation(() =>
    createScheduleEntryMutationOptions(queryClient, planId),
  );
  const deleteScheduleEntryMutation = createMutation(() =>
    deleteScheduleEntryMutationOptions(queryClient, planId),
  );
  const updateScheduleEntryMutation = createMutation(() =>
    updateScheduleEntryMutationOptions(queryClient, planId),
  );

  let hoursDialogOpen = $state(false);
  let dropTargetKey = $state<string | null>(null);
  let dropConflict = $state(false);
  let draggingEntryId = $state<string | null>(null);
  let hoursDialogDate = $state("");
  let hoursDialogSemesterId = $state("");
  let hoursDialogInitialSlots = $state<DayLayoutSlot[]>([]);

  function getWeekendDays(
    semester: PlanDetailSemester,
  ): { weekend: WeekendPair; days: string[] }[] {
    if (!semester.start_date || !semester.end_date) {
      return [];
    }

    const end = parseDate(semester.end_date);
    return getWeekends(semester.start_date, semester.end_date).map(
      (weekend) => {
        const days = [weekend.saturday];
        if (parseDate(weekend.sunday).compare(end) <= 0) {
          days.push(weekend.sunday);
        }
        return { weekend, days };
      },
    );
  }

  function openHoursDialog(semester: PlanDetailSemester, dayIso: string) {
    hoursDialogDate = dayIso;
    hoursDialogSemesterId = semester.id;
    hoursDialogInitialSlots = getDaySlots(semester, dayIso);
    hoursDialogOpen = true;
  }

  async function restoreDefaults(semester: PlanDetailSemester, dayIso: string) {
    await deleteDayLayoutMutation.mutateAsync({
      date: dayIso,
      plan_semester_id: semester.id,
    });

    if (
      hoursDialogOpen &&
      hoursDialogDate === dayIso &&
      hoursDialogSemesterId === semester.id
    ) {
      hoursDialogOpen = false;
    }
  }

  function gridColumns(slotCount: number): string {
    return `10rem repeat(${slotCount}, minmax(0, 1fr))`;
  }

  function slotDropKey(dayIso: string, slotIndex: number): string {
    return `${dayIso}:${slotIndex}`;
  }

  function findGroupContext(
    semester: PlanDetailSemester,
    groupId: string,
  ): { subject: PlanDetailSubject; group: PlanDetailSubjectGroup } | null {
    for (const subject of semester.subjects) {
      const group = subject.groups.find((entry) => entry.id === groupId);
      if (group) {
        return { subject, group };
      }
    }
    return null;
  }

  function entriesForSlot(
    semester: PlanDetailSemester,
    dayIso: string,
    slot: DayLayoutSlot,
  ): ScheduleEntry[] {
    return semester.schedule_entries.filter((entry) =>
      entryMatchesSlot(entry.start_date_time, dayIso, slot),
    );
  }

  function isSlotConflict(
    semester: PlanDetailSemester,
    dayIso: string,
    slot: DayLayoutSlot,
  ): boolean {
    const gid = dragState.groupId;
    if (!gid) return false;
    return semester.schedule_entries.some(
      (e) =>
        e.plan_semester_subject_group_id === gid &&
        entryMatchesSlot(e.start_date_time, dayIso, slot),
    );
  }

  function applySlotDragOver(
    event: DragEvent,
    dropKey: string,
    semester: PlanDetailSemester,
    dayIso: string,
    slot: DayLayoutSlot,
  ) {
    const transfer = event.dataTransfer;
    if (!transfer || !acceptsScheduleDrag(transfer.types)) {
      return;
    }
    event.preventDefault();
    const conflict = isSlotConflict(semester, dayIso, slot);
    if (conflict) {
      transfer.dropEffect = "none";
    } else {
      const effect = scheduleDragDropEffect(transfer.types);
      if (effect !== "none") {
        transfer.dropEffect = effect;
      }
    }
    dropTargetKey = dropKey;
    dropConflict = conflict;
  }

  function onSlotDragEnter(
    event: DragEvent,
    dropKey: string,
    semester: PlanDetailSemester,
    dayIso: string,
    slot: DayLayoutSlot,
  ) {
    applySlotDragOver(event, dropKey, semester, dayIso, slot);
  }

  function onSlotDragOver(
    event: DragEvent,
    dropKey: string,
    semester: PlanDetailSemester,
    dayIso: string,
    slot: DayLayoutSlot,
  ) {
    applySlotDragOver(event, dropKey, semester, dayIso, slot);
  }

  function onEntryDragStart(event: DragEvent, entry: ScheduleEntry) {
    const payload = {
      entryId: entry.id,
      groupId: entry.plan_semester_subject_group_id,
    };
    const serialized = JSON.stringify(payload);
    if (event.dataTransfer) {
      event.dataTransfer.setData(PLAN_ENTRY_DRAG_TYPE, serialized);
      // Fallback for browsers that omit custom types during dragover.
      event.dataTransfer.setData("text/plain", serialized);
      event.dataTransfer.effectAllowed = "move";
    }
    draggingEntryId = entry.id;
  }

  function onEntryDragEnd() {
    draggingEntryId = null;
  }

  function onSlotDragLeave(event: DragEvent, dropKey: string) {
    const related = event.relatedTarget;
    if (
      related instanceof Node &&
      event.currentTarget instanceof Node &&
      event.currentTarget.contains(related)
    ) {
      return;
    }
    if (dropTargetKey === dropKey) {
      dropTargetKey = null;
      dropConflict = false;
    }
  }

  async function onSlotDrop(
    event: DragEvent,
    semester: PlanDetailSemester,
    dayIso: string,
    slot: DayLayoutSlot,
  ) {
    event.preventDefault();
    dropTargetKey = null;
    dropConflict = false;

    const startDateTime = buildSlotTimestamp(dayIso, slot.start);
    const endDateTime = buildSlotTimestamp(dayIso, slot.end);

    const entryRaw =
      event.dataTransfer?.getData(PLAN_ENTRY_DRAG_TYPE) ||
      event.dataTransfer?.getData("text/plain");
    const entryPayload = entryRaw
      ? parsePlanScheduleEntryDragPayload(entryRaw)
      : null;
    if (entryPayload) {
      const existing = semester.schedule_entries.find(
        (entry) => entry.id === entryPayload.entryId,
      );
      if (
        existing &&
        existing.start_date_time === startDateTime &&
        existing.end_date_time === endDateTime
      ) {
        return;
      }

      await updateScheduleEntryMutation.mutateAsync({
        id: entryPayload.entryId,
        start_date_time: startDateTime,
        end_date_time: endDateTime,
      });
      return;
    }

    const groupRaw = event.dataTransfer?.getData(PLAN_GROUP_DRAG_TYPE);
    if (!groupRaw) {
      return;
    }

    const payload = parsePlanGroupDragPayload(groupRaw);
    if (!payload) {
      return;
    }

    const alreadyPlaced = semester.schedule_entries.some(
      (e) =>
        e.plan_semester_subject_group_id === payload.groupId &&
        entryMatchesSlot(e.start_date_time, dayIso, slot),
    );

    if (alreadyPlaced) {
      return;
    }

    await createScheduleEntryMutation.mutateAsync({
      plan_semester_subject_group_id: payload.groupId,
      start_date_time: startDateTime,
      end_date_time: endDateTime,
    });
  }

  function removeScheduleEntry(entryId: string) {
    deleteScheduleEntryMutation.mutate({ id: entryId });
  }
</script>

{#if semesters.length === 0}
  <p class="text-sm">Brak semestrów w planie.</p>
{:else}
  {#each semesters as semester (semester.id)}
    <TabsContent value={semester.id} class="block min-h-0 flex-1">
      {#if !semester.start_date || !semester.end_date}
        <p class="text-sm">Brak dat semestru.</p>
      {:else}
        <div class="flex flex-col">
          {#each getWeekendDays(semester) as { weekend, days }}
            <section class="flex flex-col">
              {#each days as dayIso (dayIso)}
                {@const slots = getDaySlots(semester, dayIso)}
                {@const custom = hasCustomDayLayout(semester, dayIso)}
                {@const holidayName = holidays?.get(dayIso)}
                <div
                  class="grid items-start gap-x-4 gap-y-2 p-4 {holidayName
                    ? 'bg-red-50 dark:bg-red-900/25'
                    : dayIso === weekend.saturday
                      ? 'bg-black/3 dark:bg-white/4'
                      : ''}"
                  style="grid-template-columns: {gridColumns(slots.length)}"
                >
                  <div class="flex flex-col items-center gap-1 self-center">
                    <p class="text-sm w-full">{formatIsoDayLabel(dayIso)}</p>
                    <div class="flex items-center gap-1 justify-start w-full">
                      {#if holidayName}
                        <Tooltip label={holidayName}>
                          {#snippet trigger(props)}
                            <span
                              {...props}
                              class="inline-flex size-8 items-center justify-center text-red-500"
                              aria-label={holidayName}
                            >
                              <CalendarCheckIcon class="size-4" weight="fill" />
                            </span>
                          {/snippet}
                        </Tooltip>
                      {/if}
                      <Tooltip label="Niestandardowe godziny">
                        {#snippet trigger(props)}
                          <Button
                            {...props}
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Niestandardowe godziny"
                            onclick={() => openHoursDialog(semester, dayIso)}
                          >
                            <ClockIcon weight={custom ? "fill" : "regular"} />
                          </Button>
                        {/snippet}
                      </Tooltip>
                      {#if custom}
                        <Tooltip label="Przywróć domyślne">
                          {#snippet trigger(props)}
                            <Button
                              {...props}
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Przywróć domyślne"
                              loading={deleteDayLayoutMutation.isPending}
                              onclick={() => restoreDefaults(semester, dayIso)}
                            >
                              <ArrowUUpLeftIcon />
                            </Button>
                          {/snippet}
                        </Tooltip>
                      {/if}
                    </div>
                  </div>
                  {#each slots as slot, slotIndex (`${dayIso}-${slotIndex}`)}
                    {@const dropKey = slotDropKey(dayIso, slotIndex)}
                    {@const cellEntries = entriesForSlot(
                      semester,
                      dayIso,
                      slot,
                    )}
                    {@const isTarget = dropTargetKey === dropKey}
                    <div class="flex flex-col gap-1">
                      <p class="text-xs tabular-nums">
                        {slot.start} – {slot.end}
                      </p>
                      <div
                        role="region"
                        aria-label="Przedział {slot.start} – {slot.end}"
                        class="flex min-h-16 flex-col gap-1 rounded-md border border-dashed p-1 transition-[box-shadow,background-color,border-color] {isTarget &&
                        dropConflict
                          ? 'cursor-not-allowed border-destructive/40 bg-destructive/5 ring-2 ring-destructive ring-offset-1 ring-offset-background'
                          : isTarget
                            ? 'border-primary/40 bg-primary/5 ring-2 ring-primary ring-offset-1 ring-offset-background'
                            : 'border-border-card'}"
                        ondragenter={(event) =>
                          onSlotDragEnter(
                            event,
                            dropKey,
                            semester,
                            dayIso,
                            slot,
                          )}
                        ondragover={(event) =>
                          onSlotDragOver(
                            event,
                            dropKey,
                            semester,
                            dayIso,
                            slot,
                          )}
                        ondragleave={(event) => onSlotDragLeave(event, dropKey)}
                        ondrop={(event) =>
                          onSlotDrop(event, semester, dayIso, slot)}
                      >
                        {#each cellEntries as entry (entry.id)}
                          {@const groupContext = findGroupContext(
                            semester,
                            entry.plan_semester_subject_group_id,
                          )}
                          {#if groupContext}
                            <ScheduleEntryCard
                              subjectName={groupContext.subject.module_name}
                              group={groupContext.group}
                              groups={groupContext.subject.groups}
                              dragging={draggingEntryId === entry.id}
                              ondragstart={(event) =>
                                onEntryDragStart(event, entry)}
                              ondragend={onEntryDragEnd}
                              onremove={() => removeScheduleEntry(entry.id)}
                            />
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {/each}
            </section>
          {/each}
        </div>
      {/if}
    </TabsContent>
  {/each}
{/if}

{#if hoursDialogOpen && hoursDialogDate && hoursDialogSemesterId && planId}
  <CustomHoursDialog
    bind:open={hoursDialogOpen}
    {planId}
    planSemesterId={hoursDialogSemesterId}
    date={hoursDialogDate}
    initialSlots={hoursDialogInitialSlots}
  />
{/if}
