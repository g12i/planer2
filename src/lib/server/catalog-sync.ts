import { v7 as uuidv7 } from "uuid";
import { scrapeCatalogBundles } from "$lib/server/catalog-scraper";
import type {
  CatalogSyncSummary,
  ScrapedProgrammeBundle,
  ScrapedSubject,
} from "$lib/server/catalog-types";
import { getSupabase } from "$lib/server/supabase";

const LOG_PREFIX = "[catalog-sync]";

function newRowId(): string {
  return uuidv7();
}

function subjectKey(semesterNumber: number, moduleCode: string): string {
  return `${semesterNumber}:${moduleCode}`;
}

function rowToSubjectPayload(subject: ScrapedSubject) {
  return {
    semester_number: subject.semesterNumber,
    module_code: subject.moduleCode,
    module_name: subject.moduleName,
    catalog_id: subject.catalogId,
    activities: subject.activities,
  };
}

async function syncSubjectsForProgramme(
  catalogProgrammeId: string,
  programmeCode: string,
  subjects: ScrapedSubject[],
): Promise<{ subjectsWritten: number }> {
  const supabase = getSupabase();

  const { data: existing, error: fetchError } = await supabase
    .from("catalog_subject")
    .select("id, semester_number, module_code")
    .eq("catalog_programme_id", catalogProgrammeId);

  if (fetchError) {
    throw new Error(
      `Failed to load subjects for ${programmeCode}: ${fetchError.message}`,
    );
  }

  const existingByKey = new Map<string, string>();
  for (const row of existing ?? []) {
    if (row.module_code) {
      existingByKey.set(
        subjectKey(row.semester_number, row.module_code),
        row.id,
      );
    }
  }

  const scrapedKeys = new Set<string>();
  let subjectsWritten = 0;
  let subjectsInserted = 0;
  let subjectsUpdated = 0;

  for (const subject of subjects) {
    const key = subjectKey(subject.semesterNumber, subject.moduleCode);
    scrapedKeys.add(key);
    const payload = rowToSubjectPayload(subject);
    const existingId = existingByKey.get(key);

    if (existingId) {
      const { error: updateError } = await supabase
        .from("catalog_subject")
        .update(payload)
        .eq("id", existingId);

      if (updateError) {
        throw new Error(
          `Failed to update subject ${subject.moduleCode} for ${programmeCode}: ${updateError.message}`,
        );
      }
      subjectsUpdated += 1;
    } else {
      const { error: insertError } = await supabase
        .from("catalog_subject")
        .insert({
          id: newRowId(),
          catalog_programme_id: catalogProgrammeId,
          ...payload,
        });

      if (insertError) {
        throw new Error(
          `Failed to insert subject ${subject.moduleCode} for ${programmeCode}: ${insertError.message}`,
        );
      }
      subjectsInserted += 1;
    }

    subjectsWritten += 1;
  }

  const orphanIds = (existing ?? [])
    .filter(
      (row) =>
        row.module_code &&
        !scrapedKeys.has(subjectKey(row.semester_number, row.module_code)),
    )
    .map((row) => row.id);

  if (orphanIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("catalog_subject")
      .delete()
      .in("id", orphanIds);

    if (deleteError) {
      throw new Error(
        `Failed to delete orphan subjects for ${programmeCode}: ${deleteError.message}`,
      );
    }
  }

  console.log(
    `${LOG_PREFIX} ${programmeCode}: ${subjectsInserted} inserted, ${subjectsUpdated} updated, ${orphanIds.length} deleted (${subjectsWritten} total)`,
  );

  return { subjectsWritten };
}

async function upsertProgrammeBundle(
  bundle: ScrapedProgrammeBundle,
): Promise<{ subjectsWritten: number }> {
  const supabase = getSupabase();
  const { programme, subjects } = bundle;

  const programmePayload = {
    name: programme.name,
    semester_count: programme.semesterCount,
  };

  const { data: existing, error: fetchError } = await supabase
    .from("catalog_programme")
    .select("id")
    .eq("code", programme.code)
    .maybeSingle();

  if (fetchError) {
    throw new Error(
      `Failed to load catalog_programme ${programme.code}: ${fetchError.message}`,
    );
  }

  let row: { id: string };

  if (existing) {
    const { data: updated, error: updateError } = await supabase
      .from("catalog_programme")
      .update(programmePayload)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (updateError || !updated) {
      throw new Error(
        `Failed to update catalog_programme ${programme.code}: ${updateError?.message ?? "no row"}`,
      );
    }
    row = updated;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("catalog_programme")
      .insert({
        id: newRowId(),
        code: programme.code,
        ...programmePayload,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      throw new Error(
        `Failed to insert catalog_programme ${programme.code}: ${insertError?.message ?? "no row"}`,
      );
    }
    row = inserted;
  }

  console.log(
    `${LOG_PREFIX} upserted programme ${programme.code} (${row.id}), syncing ${subjects.length} subjects`,
  );

  const { subjectsWritten } = await syncSubjectsForProgramme(
    row.id,
    programme.code,
    subjects,
  );

  return { subjectsWritten };
}

export async function syncCatalog(): Promise<CatalogSyncSummary> {
  console.log(`${LOG_PREFIX} scrape start`);

  let programmesTotal = 0;
  let programmesUpserted = 0;
  let subjectsInserted = 0;
  const errors: string[] = [];

  try {
    for await (const bundle of scrapeCatalogBundles(errors)) {
      programmesTotal += 1;
      try {
        const result = await upsertProgrammeBundle(bundle);
        programmesUpserted += 1;
        subjectsInserted += result.subjectsWritten;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown sync error";
        console.error(
          `${LOG_PREFIX} ${bundle.programme.code} failed: ${message}`,
        );
        errors.push(`${bundle.programme.code}: ${message}`);
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown scrape error";
    console.error(`${LOG_PREFIX} scrape aborted: ${message}`);
    errors.push(`scrape: ${message}`);
  }

  const summary = {
    programmesUpserted,
    subjectsInserted,
    programmesTotal,
    errors,
  };

  console.log(`${LOG_PREFIX} finished`, JSON.stringify(summary));
  return summary;
}
