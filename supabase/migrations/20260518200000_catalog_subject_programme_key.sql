-- Stable upsert key for catalog sync (preserves subject ids → semester_subject FKs)
CREATE UNIQUE INDEX catalog_subject_programme_module_semester_key
  ON public.catalog_subject (catalog_programme_id, module_code, semester_number)
  WHERE module_code IS NOT NULL;
