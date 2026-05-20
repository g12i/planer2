import { error, json } from "@sveltejs/kit";
import { v7 as uuidv7 } from "uuid";
import { planCreateSchema } from "$lib/plan-schemas";
import type { PlanCreateResponse } from "$lib/plan-types";
import { getSessionUser, parseSessionId } from "$lib/server/auth";
import { parseSubjectActivities } from "$lib/server/planner-schemas";
import { getSessionCookieName } from "$lib/server/session";
import { getSupabase } from "$lib/server/supabase";
import type { RequestHandler } from "./$types";

async function requireUser(cookies: {
  get: (name: string) => string | undefined;
}) {
  const sessionId = parseSessionId(cookies.get(getSessionCookieName()));
  if (!sessionId) {
    error(401, "Unauthorized");
  }

  const user = await getSessionUser(sessionId);
  if (!user) {
    error(401, "Unauthorized");
  }

  return user;
}

async function deletePlan(planId: string) {
  await getSupabase().from("plan").delete().eq("id", planId);
}

export const GET: RequestHandler = async ({ cookies }) => {
  const user = await requireUser(cookies);

  const { data: ownerships, error: ownershipError } = await getSupabase()
    .from("plan_ownership")
    .select("plan_id")
    .eq("user_id", user.id);

  if (ownershipError) {
    throw new Error(`Failed to load plan ownership: ${ownershipError.message}`);
  }

  const planIds = ownerships.map((row) => row.plan_id);
  if (planIds.length === 0) {
    return json([]);
  }

  const { data: plans, error: plansError } = await getSupabase()
    .from("plan")
    .select("id, name, programme_code, programme_name, academic_year")
    .in("id", planIds)
    .order("name");

  if (plansError) {
    throw new Error(`Failed to load plans: ${plansError.message}`);
  }

  return json(plans);
};

export const POST: RequestHandler = async ({ request, cookies }) => {
  const user = await requireUser(cookies);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Nieprawidłowe dane JSON." }, { status: 400 });
  }

  const parsed = planCreateSchema.safeParse(body);
  if (!parsed.success) {
    return json({ error: "Nieprawidłowe dane formularza." }, { status: 400 });
  }

  const {
    programme_id,
    name,
    academic_year,
    start_date,
    end_date,
    semester_numbers,
  } = parsed.data;

  const { data: programme, error: programmeError } = await getSupabase()
    .from("catalog_programme")
    .select("id, code, name, semester_count")
    .eq("id", programme_id)
    .maybeSingle();

  if (programmeError) {
    throw new Error(`Failed to load programme: ${programmeError.message}`);
  }

  if (!programme) {
    return json({ error: "Nie znaleziono programu studiów." }, { status: 404 });
  }

  if (programme.semester_count === null) {
    return json(
      { error: "Program studiów nie ma zdefiniowanej liczby semestrów." },
      { status: 400 },
    );
  }

  const semesters = [...new Set(semester_numbers)].sort((a, b) => a - b);
  const invalidSemester = semesters.some(
    (n) => n < 1 || n > programme.semester_count,
  );
  if (invalidSemester) {
    return json(
      { error: "Wybrano nieprawidłowy numer semestru." },
      { status: 400 },
    );
  }

  const { data: subjects, error: subjectsError } = await getSupabase()
    .from("catalog_subject")
    .select("module_code, module_name, semester_number, activities")
    .eq("catalog_programme_id", programme_id)
    .in("semester_number", semesters)
    .order("semester_number")
    .order("module_name");

  if (subjectsError) {
    throw new Error(`Failed to load subjects: ${subjectsError.message}`);
  }

  const planId = uuidv7();
  const supabase = getSupabase();

  const { error: planError } = await supabase.from("plan").insert({
    id: planId,
    name,
    programme_code: programme.code,
    programme_name: programme.name,
    academic_year,
  });

  if (planError) {
    return json(
      { error: `Nie udało się utworzyć planu: ${planError.message}` },
      { status: 500 },
    );
  }

  const { error: ownershipError } = await supabase
    .from("plan_ownership")
    .insert({
      plan_id: planId,
      user_id: user.id,
      role: "owner",
    });

  if (ownershipError) {
    await deletePlan(planId);
    return json(
      {
        error: `Nie udało się przypisać właściciela: ${ownershipError.message}`,
      },
      { status: 500 },
    );
  }

  const semesterIdByNumber = new Map<number, string>();
  const semesterRows = semesters.map((number) => {
    const id = uuidv7();
    semesterIdByNumber.set(number, id);
    return {
      id,
      plan_id: planId,
      number,
      start_date,
      end_date,
    };
  });

  const { error: semesterError } = await supabase
    .from("plan_semester")
    .insert(semesterRows);

  if (semesterError) {
    await deletePlan(planId);
    return json(
      { error: `Nie udało się utworzyć semestrów: ${semesterError.message}` },
      { status: 500 },
    );
  }

  const subjectRows: {
    id: string;
    plan_semester_id: string;
    module_code: string | null;
    module_name: string;
  }[] = [];

  const groupRows: {
    id: string;
    plan_semester_subject_id: string;
    activity_kind: string;
    hours_total: number;
    group_index: number;
  }[] = [];

  for (const subject of subjects) {
    const planSemesterId = semesterIdByNumber.get(subject.semester_number);
    if (!planSemesterId) {
      continue;
    }

    const subjectId = uuidv7();
    subjectRows.push({
      id: subjectId,
      plan_semester_id: planSemesterId,
      module_code: subject.module_code,
      module_name: subject.module_name,
    });

    const activitiesResult = parseSubjectActivities(subject.activities);
    if (!activitiesResult.success) {
      console.warn("Invalid catalog_subject.activities", {
        programme_id,
        module_code: subject.module_code,
        semester_number: subject.semester_number,
      });
    }
    const activities = activitiesResult.success ? activitiesResult.data : [];

    for (const activity of activities) {
      groupRows.push({
        id: uuidv7(),
        plan_semester_subject_id: subjectId,
        activity_kind: activity.kind,
        hours_total: activity.hours,
        group_index: 1,
      });
    }
  }

  if (subjectRows.length > 0) {
    const { error: subjectError } = await supabase
      .from("plan_semester_subject")
      .insert(subjectRows);

    if (subjectError) {
      await deletePlan(planId);
      return json(
        {
          error: `Nie udało się utworzyć przedmiotów: ${subjectError.message}`,
        },
        { status: 500 },
      );
    }
  }

  if (groupRows.length > 0) {
    const { error: groupError } = await supabase
      .from("plan_semester_subject_group")
      .insert(groupRows);

    if (groupError) {
      await deletePlan(planId);
      return json(
        {
          error: `Nie udało się utworzyć grup zajęć: ${groupError.message}`,
        },
        { status: 500 },
      );
    }
  }

  return json({ id: planId } satisfies PlanCreateResponse, { status: 201 });
};
