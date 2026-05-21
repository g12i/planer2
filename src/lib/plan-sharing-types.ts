import type { z } from "zod";
import type {
	planSharingAddSchema,
	planSharingListSchema,
	planSharingMemberSchema,
	planSharingRemoveSchema,
} from "$lib/plan-sharing-schemas";

export type PlanSharingAdd = z.infer<typeof planSharingAddSchema>;
export type PlanSharingRemove = z.infer<typeof planSharingRemoveSchema>;
export type PlanSharingMember = z.infer<typeof planSharingMemberSchema>;
export type PlanSharingList = z.infer<typeof planSharingListSchema>;
