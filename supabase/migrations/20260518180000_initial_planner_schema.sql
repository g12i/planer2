-- Disable GraphQL (not used)
DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- 0. users
CREATE TABLE public.users (
  id uuid PRIMARY KEY,
  usos_user_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1. programme
CREATE TABLE public.programme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. programme_version
CREATE TABLE public.programme_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES public.programme (id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. subject
CREATE TABLE public.subject (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_version_id uuid NOT NULL REFERENCES public.programme_version (id) ON DELETE CASCADE,
  semester_number int NOT NULL CHECK (semester_number > 0),
  module_code text,
  module_name text NOT NULL,
  ects int,
  activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  catalog_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. plan
CREATE TABLE public.plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_version_id uuid NOT NULL REFERENCES public.programme_version (id) ON DELETE RESTRICT,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. plan_ownership
CREATE TABLE public.plan_ownership (
  plan_id uuid NOT NULL REFERENCES public.plan (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (plan_id, user_id)
);

-- 6. semester
CREATE TABLE public.semester (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plan (id) ON DELETE CASCADE,
  number int NOT NULL CHECK (number > 0),
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, number)
);

-- 7. semester_subject
CREATE TABLE public.semester_subject (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id uuid NOT NULL REFERENCES public.semester (id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subject (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (semester_id, subject_id)
);

-- 10. lecturer_availability
CREATE TABLE public.lecturer_availability (
  usos_id text PRIMARY KEY,
  name text NOT NULL,
  unavailable_days int[] NOT NULL DEFAULT '{}',
  preferred_days int[] NOT NULL DEFAULT '{}',
  unavailable_slots text[] NOT NULL DEFAULT '{}',
  preferred_slots text[] NOT NULL DEFAULT '{}',
  unavailable_dates date[] NOT NULL DEFAULT '{}',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. semester_subject_group
CREATE TABLE public.semester_subject_group (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_subject_id uuid NOT NULL REFERENCES public.semester_subject (id) ON DELETE CASCADE,
  activity_kind text NOT NULL,
  group_index int NOT NULL CHECK (group_index > 0),
  label text,
  hours_total int NOT NULL CHECK (hours_total >= 0),
  lecturer_usos_id text REFERENCES public.lecturer_availability (usos_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (semester_subject_id, activity_kind, group_index)
);

-- 9. semester_day_layout
CREATE TABLE public.semester_day_layout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_id uuid NOT NULL REFERENCES public.semester (id) ON DELETE CASCADE,
  date date NOT NULL,
  slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (semester_id, date)
);

-- 11. schedule_entry
CREATE TABLE public.schedule_entry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester_subject_group_id uuid NOT NULL REFERENCES public.semester_subject_group (id) ON DELETE CASCADE,
  room_usos_id text,
  start_date_time timestamptz NOT NULL,
  end_date_time timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date_time > start_date_time)
);

CREATE INDEX idx_subject_programme_version_semester
  ON public.subject (programme_version_id, semester_number);

CREATE INDEX idx_plan_ownership_user_id
  ON public.plan_ownership (user_id);

CREATE INDEX idx_schedule_entry_semester_subject_group_id
  ON public.schedule_entry (semester_subject_group_id);

CREATE INDEX idx_semester_subject_group_semester_subject_id
  ON public.semester_subject_group (semester_subject_id);

CREATE INDEX idx_semester_day_layout_semester_id
  ON public.semester_day_layout (semester_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_subject ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_subject_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_day_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lecturer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_entry ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON TABLE public.programme FROM anon, authenticated;
REVOKE ALL ON TABLE public.programme_version FROM anon, authenticated;
REVOKE ALL ON TABLE public.subject FROM anon, authenticated;
REVOKE ALL ON TABLE public.plan FROM anon, authenticated;
REVOKE ALL ON TABLE public.plan_ownership FROM anon, authenticated;
REVOKE ALL ON TABLE public.semester FROM anon, authenticated;
REVOKE ALL ON TABLE public.semester_subject FROM anon, authenticated;
REVOKE ALL ON TABLE public.semester_subject_group FROM anon, authenticated;
REVOKE ALL ON TABLE public.semester_day_layout FROM anon, authenticated;
REVOKE ALL ON TABLE public.lecturer_availability FROM anon, authenticated;
REVOKE ALL ON TABLE public.schedule_entry FROM anon, authenticated;
