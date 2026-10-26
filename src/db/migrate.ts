import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";

/**
 * مخطط قاعدة البيانات بصيغة SQL idempotent.
 *
 * لماذا؟ عند النشر على Vercel لا يمكن تشغيل `npx drizzle-kit push` من حاوية البناء
 * (لا وصول دائم لقاعدة البيانات أثناء البناء). لذلك تُنشئ المنصة جداولها تلقائيًا
 * في أول طلب خادم — مرة واحدة فقط — ثم تُبذر البيانات الأولية.
 *
 * كل الجمل `IF NOT EXISTS` فهي آمنة للتكرار ولا تمسّ أي بيانات قائمة.
 */
const DDL = `
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL,
  description text,
  icon_key text DEFAULT 'book',
  accent text DEFAULT '#1B3A6B',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  accent text DEFAULT '#C9A227',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subjects_stage_idx ON subjects(stage_id);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'student',
  status text NOT NULL DEFAULT 'active',
  phone text,
  avatar_url text,
  bio text,
  city text,
  country text,
  stage_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  user_agent text,
  ip_address text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES users(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  summary text,
  description text,
  cover_url text,
  level text NOT NULL DEFAULT 'beginner',
  status text NOT NULL DEFAULT 'published',
  is_featured boolean NOT NULL DEFAULT false,
  is_free boolean NOT NULL DEFAULT true,
  price integer NOT NULL DEFAULT 0,
  duration_minutes integer NOT NULL DEFAULT 0,
  learning_outcomes jsonb DEFAULT '[]'::jsonb,
  requirements jsonb DEFAULT '[]'::jsonb,
  rating_sum integer NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS courses_slug_idx ON courses(slug);
CREATE INDEX IF NOT EXISTS courses_stage_idx ON courses(stage_id);
CREATE INDEX IF NOT EXISTS courses_subject_idx ON courses(subject_id);

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  type text NOT NULL DEFAULT 'article',
  summary text,
  content text,
  video_url text,
  attachment_url text,
  duration_minutes integer NOT NULL DEFAULT 10,
  sort_order integer NOT NULL DEFAULT 0,
  is_free_preview boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lessons_course_idx ON lessons(course_id);

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  progress_percent integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'in_progress',
  last_lesson_id uuid,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_course_idx ON enrollments(user_id, course_id);
CREATE INDEX IF NOT EXISTS enrollments_course_idx ON enrollments(course_id);

CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  seconds_spent integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_user_lesson_idx ON lesson_progress(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS lesson_progress_course_idx ON lesson_progress(course_id);

CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  time_limit_minutes integer NOT NULL DEFAULT 10,
  passing_percent integer NOT NULL DEFAULT 60,
  attempts_allowed integer NOT NULL DEFAULT 3,
  shuffle_questions boolean NOT NULL DEFAULT false,
  show_explanations boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quizzes_course_idx ON quizzes(course_id);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'single',
  text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_indexes jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation text,
  points integer NOT NULL DEFAULT 1,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS questions_quiz_idx ON questions(quiz_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  percent integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_seconds integer NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_idx ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS quiz_attempts_quiz_user_idx ON quiz_attempts(quiz_id, user_id);

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  code text NOT NULL,
  grade integer NOT NULL DEFAULT 0,
  issued_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS certificates_code_idx ON certificates(code);
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_course_idx ON certificates(user_id, course_id);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  stage_id uuid,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  country text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id text,
  meta jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating integer NOT NULL DEFAULT 5,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_reviews_user_course_idx ON course_reviews(user_id, course_id);

-- ترقية القواعد القائمة: إضافة عمود الدولة (مصر، السعودية، الأردن، الإمارات)
ALTER TABLE users ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS country text;

-- تهيئة رجعية: تعيين الدولة من المدينة للحسابات القديمة (الدول المدعومة فقط)
UPDATE users SET country = CASE
  WHEN city IN ('القاهرة','الجيزة','الإسكندرية','المنصورة','أسيوط','طنطا','بورسعيد') THEN 'EG'
  WHEN city IN ('الرياض','جدة','الدمام','مكة','المدينة','الخبر','أبها') THEN 'SA'
  WHEN city IN ('عمان','الزرقاء','إربد','العقبة','السلط') THEN 'JO'
  WHEN city IN ('دبي','أبوظبي','الشارقة','عجمان','الفجيرة') THEN 'AE'
  ELSE country END
WHERE country IS NULL;

CREATE INDEX IF NOT EXISTS users_country_idx ON users(country);
`;

let schemaReady = false;

/** إنشاء الجداول والفهارس إن لم تكن موجودة (آمن للتكرار) */
export async function ensureSchema(): Promise<boolean> {
  if (schemaReady) return true;
  if (!isDatabaseConfigured) return false;
  try {
    await db.execute(sql.raw(DDL));
    schemaReady = true;
    return true;
  } catch (error) {
    console.error("[db:schema] تعذّر التأكد من مخطط قاعدة البيانات:", (error as Error).message);
    return false;
  }
}

export function isSchemaReady(): boolean {
  return schemaReady;
}
