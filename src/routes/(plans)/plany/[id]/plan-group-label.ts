import type { PlanDetailSubjectGroup } from "$lib/plan-types";

export function formatGroupTitle(
	group: PlanDetailSubjectGroup,
	subjectGroups: PlanDetailSubjectGroup[],
): string {
	if (group.label) {
		return group.label;
	}

	const sameKind = subjectGroups.filter(
		(g) => g.activity_kind === group.activity_kind,
	);
	const showIndex = group.group_index > 1 || sameKind.length > 1;
	return showIndex
		? `${group.activity_kind}, gr. ${group.group_index}`
		: group.activity_kind;
}

export function formatActivityKindLine(
	group: PlanDetailSubjectGroup,
	subjectGroups: PlanDetailSubjectGroup[],
): string {
	const sameKind = subjectGroups.filter(
		(g) => g.activity_kind === group.activity_kind,
	);
	const showIndex = group.group_index > 1 || sameKind.length > 1;
	return showIndex
		? `${group.activity_kind}, gr. ${group.group_index}`
		: group.activity_kind;
}

export function shouldShowGroupLabel(
	group: PlanDetailSubjectGroup,
	subjectGroups: PlanDetailSubjectGroup[],
): boolean {
	if (group.label) {
		return true;
	}

	const sameKind = subjectGroups.filter(
		(g) => g.activity_kind === group.activity_kind,
	);
	return sameKind.length > 1 || group.group_index > 1;
}
