import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { getSupabase } from "$lib/server/supabase";
import { parseSubjectActivities } from "$lib/server/planner-schemas";
import type { SubjectActivity } from "$lib/server/planner-types";

type SubjectRow = {
  id: string;
  module_code: string | null;
  module_name: string;
  semester_number: number;
  catalog_id: string | null;
  activities: SubjectActivity[];
};

type Semester = {
  number: number;
  subjects: SubjectRow[];
};

export const load: PageServerLoad = async ({ params }) => {
  const supabase = getSupabase();

  const { data: programme, error: progErr } = await supabase
    .from("catalog_programme")
    .select("id, code, name, semester_count")
    .eq("code", params.code)
    .single();

  if (progErr || !programme) {
    error(404, `Programme not found: ${params.code}`);
  }

  const { data: subjects, error: subErr } = await supabase
    .from("catalog_subject")
    .select(
      "id, module_code, module_name, semester_number, catalog_id, activities",
    )
    .eq("catalog_programme_id", programme.id)
    .order("semester_number")
    .order("module_name");

  if (subErr) {
    throw new Error(`Failed to load subjects: ${subErr.message}`);
  }

  const parsed: SubjectRow[] = subjects.map((s) => {
    const result = parseSubjectActivities(s.activities);
    return {
      id: s.id,
      module_code: s.module_code,
      module_name: s.module_name,
      semester_number: s.semester_number,
      catalog_id: s.catalog_id,
      activities: result.success ? result.data : [],
    };
  });

  const semesterMap = new Map<number, SubjectRow[]>();
  for (const subject of parsed) {
    const list = semesterMap.get(subject.semester_number);
    if (list) {
      list.push(subject);
    } else {
      semesterMap.set(subject.semester_number, [subject]);
    }
  }

  const semesters: Semester[] = Array.from(semesterMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([number, subjects]) => ({ number, subjects }));

  return { programme, semesters };
};
