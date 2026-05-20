ALTER TABLE public.plan_semester_subject_group
  ADD COLUMN room_usos_id text;

ALTER TABLE public.plan_schedule_entry
  DROP COLUMN room_usos_id;
