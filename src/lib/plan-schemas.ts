import { parseDate } from "@internationalized/date";
import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Nieprawidłowy format daty");

export const programmeListItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  semester_count: z.number().nullable(),
});

export const planListItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  programme_code: z.string().nullable(),
  programme_name: z.string().nullable(),
});

export const planCreateSchema = z
  .object({
    programme_id: z.string().min(1, "Wybierz program studiów"),
    name: z.string().min(1, "Podaj nazwę planu"),
    start_date: isoDateSchema,
    end_date: isoDateSchema,
    semester_numbers: z
      .array(z.number().int().positive())
      .min(1, "Wybierz co najmniej jeden semestr")
      .refine((nums) => new Set(nums).size === nums.length, {
        message: "Semestry nie mogą się powtarzać",
      }),
  })
  .refine(
    (data) => parseDate(data.end_date).compare(parseDate(data.start_date)) >= 0,
    {
      message: "Data zakończenia nie może być wcześniejsza niż rozpoczęcia",
      path: ["end_date"],
    },
  );

export const planCreateResponseSchema = z.object({
  id: z.string(),
});

export const planDetailSubjectGroupSchema = z.object({
  id: z.string(),
  activity_kind: z.string(),
  hours_total: z.number(),
  group_index: z.number().int().positive(),
  label: z.string().nullable(),
  lecturer_usos_id: z.string().nullable(),
});

export const planDetailSubjectSchema = z.object({
  id: z.string(),
  module_code: z.string().nullable(),
  module_name: z.string(),
  groups: z.array(planDetailSubjectGroupSchema),
});

export const dayLayoutSlotSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
});

export const dayLayoutSchema = z.object({
  id: z.string(),
  date: isoDateSchema,
  plan_semester_id: z.string(),
  slots: z.array(dayLayoutSlotSchema),
});

export const dayLayoutUpsertSchema = z.object({
  date: isoDateSchema,
  plan_semester_id: z.string(),
  slots: z
    .array(dayLayoutSlotSchema)
    .min(1, "Dodaj co najmniej jeden przedział"),
});

export const dayLayoutDeleteSchema = z.object({
  date: isoDateSchema,
  plan_semester_id: z.string(),
});

export const planDetailSemesterSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  start_date: isoDateSchema.nullable(),
  end_date: isoDateSchema.nullable(),
  subjects: z.array(planDetailSubjectSchema),
  day_layouts: z.array(dayLayoutSchema).default([]),
});

export const planDetailSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  programme_code: z.string().nullable(),
  programme_name: z.string().nullable(),
  semesters: z.array(planDetailSemesterSchema),
});
