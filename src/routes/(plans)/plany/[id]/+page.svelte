<script lang="ts">
	import { getContext } from "svelte";
	import { parseDate } from "@internationalized/date";

	import TabsContent from "$lib/components/ui/tabs-content.svelte";
	import {
		formatIsoDayLabel,
		getWeekends,
		type WeekendPair,
	} from "$lib/date-ranges";
	import {
		PLAN_DETAIL_KEY,
		type PlanDetailContextValue,
	} from "$lib/plan-detail-context";
	import type { PlanDetailSemester } from "$lib/plan-types";

	const TIME_SLOTS = [
		{ label: "Pasmo poranne", time: "8:30 – 12:30" },
		{ label: "Pasmo popołudniowe", time: "13:00 – 17:00" },
	] as const;

	const planDetail = getContext<PlanDetailContextValue>(PLAN_DETAIL_KEY);
	const semesters = $derived(planDetail.semesters);

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
								<div
									class="grid grid-cols-[10rem_1fr_1fr] items-start gap-x-4 gap-y-2"
								>
									<p class="text-sm">{formatIsoDayLabel(dayIso)}</p>
									{#each TIME_SLOTS as slot (slot.label)}
										<div class="flex flex-col gap-1">
											<p class="text-xs">
												{slot.label}
												<br />
												{slot.time}
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
