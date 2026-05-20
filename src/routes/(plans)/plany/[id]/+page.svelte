<script lang="ts">
	import { page } from "$app/state";
	import { getContext } from "svelte";
	import { parseDate } from "@internationalized/date";
	import { createMutation, useQueryClient } from "@tanstack/svelte-query";
	import ArrowUUpLeftIcon from "phosphor-svelte/lib/ArrowUUpLeftIcon";
	import ClockIcon from "phosphor-svelte/lib/ClockIcon";

	import TabsContent from "$lib/components/ui/tabs-content.svelte";
	import Button from "$lib/components/ui/button.svelte";
	import Tooltip from "$lib/components/ui/tooltip.svelte";
	import { deleteDayLayoutMutationOptions } from "$lib/plan-mutations";
	import {
		formatIsoDayLabel,
		getWeekends,
		type WeekendPair,
	} from "$lib/date-ranges";
	import {
		PLAN_DETAIL_KEY,
		type PlanDetailContextValue,
	} from "$lib/plan-detail-context";
	import type { DayLayoutSlot, PlanDetailSemester } from "$lib/plan-types";

	import CustomHoursDialog from "./custom-hours-dialog.svelte";
	import {
		getDaySlots,
		hasCustomDayLayout,
	} from "./plan-day-slots";

	const planDetail = getContext<PlanDetailContextValue>(PLAN_DETAIL_KEY);
	const semesters = $derived(planDetail.semesters);
	const planId = $derived(page.params.id ?? "");
	const queryClient = useQueryClient();

	const deleteDayLayoutMutation = createMutation(() =>
		deleteDayLayoutMutationOptions(queryClient, planId),
	);

	let hoursDialogOpen = $state(false);
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
													size="icon"
													class="size-8 shrink-0"
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
														size="icon"
														class="size-8 shrink-0"
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
										<div class="flex flex-col gap-1">
											<p class="text-xs tabular-nums">
												{slot.start} – {slot.end}
											</p>
											<div class="min-h-16"></div>
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
