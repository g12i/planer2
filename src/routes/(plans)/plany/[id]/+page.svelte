<script lang="ts">
	import { page } from "$app/state";
	import { getContext } from "svelte";
	import { parseDate } from "@internationalized/date";
	import { createMutation, useQueryClient } from "@tanstack/svelte-query";
	import ArrowUUpLeftIcon from "phosphor-svelte/lib/ArrowUUpLeftIcon";
	import ClockIcon from "phosphor-svelte/lib/ClockIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";

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
	import { formatGroupTitle } from "./plan-group-label";
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
		return getWeekends(semester.start_date, semester.end_date).map((weekend) => {
			const days = [weekend.saturday];
			if (parseDate(weekend.sunday).compare(end) <= 0) {
				days.push(weekend.sunday);
			}
			return { weekend, days };
		});
	}

	function openHoursDialog(semester: PlanDetailSemester, dayIso: string) {
		hoursDialogDate = dayIso;
		hoursDialogSemesterId = semester.id;
		hoursDialogInitialSlots = getDaySlots(semester, dayIso);
		hoursDialogOpen = true;
	}

	async function restoreDefaults(
		semester: PlanDetailSemester,
		dayIso: string,
	) {
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

	function applySlotDragOver(event: DragEvent, dropKey: string) {
		const transfer = event.dataTransfer;
		if (!transfer || !acceptsScheduleDrag(transfer.types)) {
			return;
		}
		event.preventDefault();
		const effect = scheduleDragDropEffect(transfer.types);
		if (effect !== "none") {
			transfer.dropEffect = effect;
		}
		dropTargetKey = dropKey;
	}

	function onSlotDragEnter(event: DragEvent, dropKey: string) {
		applySlotDragOver(event, dropKey);
	}

	function onSlotDragOver(event: DragEvent, dropKey: string) {
		applySlotDragOver(event, dropKey);
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

		await createScheduleEntryMutation.mutateAsync({
			plan_semester_subject_group_id: payload.groupId,
			start_date_time: startDateTime,
			end_date_time: endDateTime,
		});
	}

	async function removeScheduleEntry(entryId: string) {
		await deleteScheduleEntryMutation.mutateAsync({ id: entryId });
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
				<div class="flex flex-col gap-8">
					{#each getWeekendDays(semester) as { weekend, days } (weekend.saturday)}
						<section class="flex flex-col gap-4">
							{#each days as dayIso (dayIso)}
								{@const slots = getDaySlots(semester, dayIso)}
								{@const custom = hasCustomDayLayout(semester, dayIso)}
								<div
									class="grid items-start gap-x-4 gap-y-2"
									style="grid-template-columns: {gridColumns(slots.length)}"
								>
									<div class="flex items-center gap-1">
										<p class="text-sm">{formatIsoDayLabel(dayIso)}</p>
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
													<ClockIcon
														class="size-4"
														weight={custom ? "fill" : "regular"}
													/>
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
														onclick={() =>
															restoreDefaults(semester, dayIso)}
													>
														<ArrowUUpLeftIcon
															class="size-4"
															weight="regular"
														/>
													</Button>
												{/snippet}
											</Tooltip>
										{/if}
									</div>
									{#each slots as slot, slotIndex (`${dayIso}-${slotIndex}`)}
										{@const dropKey = slotDropKey(dayIso, slotIndex)}
										{@const cellEntries = entriesForSlot(
											semester,
											dayIso,
											slot,
										)}
										<div class="flex flex-col gap-1">
											<p class="text-xs tabular-nums">
												{slot.start} – {slot.end}
											</p>
											<div
												role="region"
												aria-label="Przedział {slot.start} – {slot.end}"
												class="flex min-h-16 flex-col gap-1 rounded-md border border-dashed p-1 transition-[box-shadow,background-color,border-color] {dropTargetKey ===
												dropKey
													? 'border-primary/40 bg-primary/5 ring-2 ring-primary ring-offset-1 ring-offset-background'
													: 'border-border-card'}"
												ondragenter={(event) =>
													onSlotDragEnter(event, dropKey)}
												ondragover={(event) =>
													onSlotDragOver(event, dropKey)}
												ondragleave={(event) =>
													onSlotDragLeave(event, dropKey)}
												ondrop={(event) =>
													onSlotDrop(event, semester, dayIso, slot)}
											>
												{#each cellEntries as entry (entry.id)}
													{@const groupContext = findGroupContext(
														semester,
														entry.plan_semester_subject_group_id,
													)}
													{#if groupContext}
														<div
															role="button"
															tabindex={-1}
															draggable="true"
															aria-label="Przenieś {groupContext.subject.module_name}"
															class="flex cursor-grab items-start gap-1 rounded-md border border-border-card bg-muted/40 px-2 py-1 text-xs active:cursor-grabbing {draggingEntryId ===
															entry.id
																? 'opacity-50'
																: ''}"
															ondragstart={(event) =>
																onEntryDragStart(event, entry)}
															ondragend={onEntryDragEnd}
														>
															<div class="min-w-0 flex-1">
																<p class="truncate font-medium">
																	{groupContext.subject.module_name}
																</p>
																<p class="truncate text-foreground-alt">
																	{formatGroupTitle(
																		groupContext.group,
																		groupContext.subject.groups,
																	)}
																</p>
															</div>
															<Button
																type="button"
																variant="ghost"
																size="icon"
																class="size-6 shrink-0"
																aria-label="Usuń wpis"
																loading={deleteScheduleEntryMutation.isPending}
																onpointerdown={(event) =>
																	event.stopPropagation()}
																onclick={() =>
																	removeScheduleEntry(entry.id)}
															>
																<XIcon
																	class="size-3.5"
																	weight="regular"
																/>
															</Button>
														</div>
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
