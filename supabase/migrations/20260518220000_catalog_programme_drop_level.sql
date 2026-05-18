-- catalog_programme: single display name (Informator link label), no separate level

UPDATE public.catalog_programme
SET name = trim(both from name || coalesce(', ' || nullif(trim(level), ''), ''))
WHERE level IS NOT NULL AND trim(level) <> '';

ALTER TABLE public.catalog_programme DROP COLUMN level;
