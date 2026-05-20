-- Scheduling stores USOS staff id only; lecturer_availability is optional prefs, not a prerequisite.
ALTER TABLE public.plan_semester_subject_group
  DROP CONSTRAINT IF EXISTS plan_semester_subject_group_lecturer_usos_id_fkey;
