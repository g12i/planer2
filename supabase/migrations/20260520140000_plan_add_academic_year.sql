ALTER TABLE plan ADD COLUMN academic_year smallint;
UPDATE plan SET academic_year = 2026;
ALTER TABLE plan ALTER COLUMN academic_year SET NOT NULL;
