import { z } from "zod";

export const planSharingAddSchema = z.object({
  usos_user_id: z.string().min(1),
});

export const planSharingRemoveSchema = z.object({
  user_id: z.uuid(),
});

export const planSharingMemberSchema = z.object({
  user_id: z.uuid(),
  usos_user_id: z.string().min(1),
  role: z.string().min(1),
  created_at: z.string(),
});

export const planSharingListSchema = z.object({
  members: z.array(planSharingMemberSchema),
});
