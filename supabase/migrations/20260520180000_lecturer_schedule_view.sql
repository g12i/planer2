-- Cross-plan lecturer schedule lookup: partial index + flattened view

CREATE INDEX idx_plan_semester_subject_group_lecturer_usos_id
  ON public.plan_semester_subject_group (lecturer_usos_id)
  WHERE lecturer_usos_id IS NOT NULL;

CREATE INDEX idx_plan_academic_year
  ON public.plan (academic_year);

CREATE VIEW public.lecturer_schedule_entries AS
SELECT
  pse.id            AS entry_id,
  pse.start_date_time,
  pse.end_date_time,
  g.lecturer_usos_id,
  g.id              AS group_id,
  ps.plan_id,
  p.academic_year
FROM public.plan_schedule_entry pse
JOIN public.plan_semester_subject_group g
  ON g.id = pse.plan_semester_subject_group_id
JOIN public.plan_semester_subject s
  ON s.id = g.plan_semester_subject_id
JOIN public.plan_semester ps
  ON ps.id = s.plan_semester_id
JOIN public.plan p
  ON p.id = ps.plan_id
WHERE g.lecturer_usos_id IS NOT NULL;

REVOKE ALL ON public.lecturer_schedule_entries FROM anon, authenticated;
