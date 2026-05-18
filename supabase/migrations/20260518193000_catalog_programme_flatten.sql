-- Flatten programme + programme_version → catalog_programme; subject → catalog_subject

ALTER TABLE public.programme_version ADD COLUMN name text;
ALTER TABLE public.programme_version ADD COLUMN level text;
ALTER TABLE public.programme_version ADD COLUMN semester_count int;

DELETE FROM public.programme_version pv
WHERE NOT EXISTS (
  SELECT 1 FROM public.programme p WHERE p.id = pv.programme_id
);

UPDATE public.programme_version pv
SET name = p.name
FROM public.programme p
WHERE pv.programme_id = p.id;

ALTER TABLE public.programme_version ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.programme_version DROP COLUMN programme_id;

DROP TABLE public.programme;

ALTER TABLE public.programme_version RENAME TO catalog_programme;
ALTER TABLE public.subject RENAME TO catalog_subject;

ALTER TABLE public.catalog_programme DROP COLUMN IF EXISTS label;

ALTER TABLE public.catalog_subject RENAME COLUMN programme_version_id TO catalog_programme_id;

ALTER INDEX idx_subject_programme_version_semester
  RENAME TO idx_catalog_subject_programme_semester;

ALTER TABLE public.catalog_subject
  RENAME CONSTRAINT subject_programme_version_id_fkey
  TO catalog_subject_catalog_programme_id_fkey;

ALTER TABLE public.catalog_programme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_subject ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.catalog_programme FROM anon, authenticated;
REVOKE ALL ON TABLE public.catalog_subject FROM anon, authenticated;
