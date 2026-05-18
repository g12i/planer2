import { env } from "$env/dynamic/private";
import type { UsosUserProfile } from "$lib/server/usos-types";

export class AccessDeniedError extends Error {
  constructor() {
    super("access_denied");
    this.name = "AccessDeniedError";
  }
}

export function assertUserAccess(profile: UsosUserProfile): void {
  const allowedStudentNumbers = new Set(
    env.ALLOWED_STUDENT_NUMBER?.trim().split(",") ?? [],
  );

  const isStaff =
    typeof profile.staffStatus === "number" && profile.staffStatus >= 1;

  const isAllowedStudent =
    typeof profile.studentNumber === "string" &&
    allowedStudentNumbers.has(profile.studentNumber);

  if (!isStaff && !isAllowedStudent) {
    throw new AccessDeniedError();
  }
}
