-- Prefix user plan tables with plan_ (mirrors catalog_* for Informator data)
-- Plan domain is independent of catalog_* — no FKs between them.
-- Requires: 20260518193000_catalog_programme_flatten.sql

ALTER TABLE public.plan DROP CONSTRAINT IF EXISTS plan_programme_version_id_fkey;
ALTER TABLE public.plan DROP COLUMN programme_version_id;

ALTER TABLE public.plan ADD COLUMN programme_code text;
ALTER TABLE public.plan ADD COLUMN programme_name text;
ALTER TABLE public.plan ADD COLUMN level text;

ALTER TABLE public.semester RENAME TO plan_semester;
ALTER TABLE public.semester_subject RENAME TO plan_semester_subject;
ALTER TABLE public.semester_subject_group RENAME TO plan_semester_subject_group;
ALTER TABLE public.semester_day_layout RENAME TO plan_semester_day_layout;
ALTER TABLE public.schedule_entry RENAME TO plan_schedule_entry;

ALTER TABLE public.plan_semester_subject DROP CONSTRAINT IF EXISTS semester_subject_subject_id_fkey;
ALTER TABLE public.plan_semester_subject DROP CONSTRAINT IF EXISTS semester_subject_semester_id_subject_id_key;

ALTER TABLE public.plan_semester_subject DROP COLUMN subject_id;

ALTER TABLE public.plan_semester_subject
  RENAME COLUMN semester_id TO plan_semester_id;

ALTER TABLE public.plan_semester_subject ADD COLUMN module_code text;
ALTER TABLE public.plan_semester_subject ADD COLUMN module_name text NOT NULL DEFAULT '';
ALTER TABLE public.plan_semester_subject ALTER COLUMN module_name DROP DEFAULT;
ALTER TABLE public.plan_semester_subject ADD COLUMN ects int;

CREATE UNIQUE INDEX plan_semester_subject_semester_module_key
  ON public.plan_semester_subject (plan_semester_id, module_code)
  WHERE module_code IS NOT NULL;

ALTER TABLE public.plan_semester_subject_group
  RENAME COLUMN semester_subject_id TO plan_semester_subject_id;

ALTER TABLE public.plan_semester_day_layout
  RENAME COLUMN semester_id TO plan_semester_id;

ALTER TABLE public.plan_schedule_entry
  RENAME COLUMN semester_subject_group_id TO plan_semester_subject_group_id;

ALTER INDEX idx_semester_subject_group_semester_subject_id
  RENAME TO idx_plan_semester_subject_group_plan_semester_subject_id;

ALTER INDEX idx_semester_day_layout_semester_id
  RENAME TO idx_plan_semester_day_layout_plan_semester_id;

ALTER INDEX idx_schedule_entry_semester_subject_group_id
  RENAME TO idx_plan_schedule_entry_plan_semester_subject_group_id;

ALTER TABLE public.plan_semester
  RENAME CONSTRAINT semester_plan_id_fkey
  TO plan_semester_plan_id_fkey;

ALTER TABLE public.plan_semester_subject
  RENAME CONSTRAINT semester_subject_semester_id_fkey
  TO plan_semester_subject_plan_semester_id_fkey;

ALTER TABLE public.plan_semester_subject_group
  RENAME CONSTRAINT semester_subject_group_semester_subject_id_fkey
  TO plan_semester_subject_group_plan_semester_subject_id_fkey;

ALTER TABLE public.plan_semester_subject_group
  RENAME CONSTRAINT semester_subject_group_lecturer_usos_id_fkey
  TO plan_semester_subject_group_lecturer_usos_id_fkey;

ALTER TABLE public.plan_semester_day_layout
  RENAME CONSTRAINT semester_day_layout_semester_id_fkey
  TO plan_semester_day_layout_plan_semester_id_fkey;

ALTER TABLE public.plan_schedule_entry
  RENAME CONSTRAINT schedule_entry_semester_subject_group_id_fkey
  TO plan_schedule_entry_plan_semester_subject_group_id_fkey;

ALTER TABLE public.plan_semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_semester_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_semester_subject_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_semester_day_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_schedule_entry ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.plan_semester FROM anon, authenticated;
REVOKE ALL ON TABLE public.plan_semester_subject FROM anon, authenticated;
REVOKE ALL ON TABLE public.plan_semester_subject_group FROM anon, authenticated;
REVOKE ALL ON TABLE public.plan_semester_day_layout FROM anon, authenticated;
REVOKE ALL ON TABLE public.plan_schedule_entry FROM anon, authenticated;
