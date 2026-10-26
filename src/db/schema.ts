import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/*  NEBRAS — نموذج البيانات                                             */
/* ------------------------------------------------------------------ */

export const ROLES = ["student", "teacher", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUS = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const COURSE_STATUS = ["draft", "published", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUS)[number];

export const COURSE_LEVEL = ["beginner", "intermediate", "advanced"] as const;
export type CourseLevel = (typeof COURSE_LEVEL)[number];

export const LESSON_TYPE = ["video", "article", "quiz", "attachment"] as const;
export type LessonType = (typeof LESSON_TYPE)[number];

export const QUESTION_TYPE = ["single", "multiple", "truefalse"] as const;
export type QuestionType = (typeof QUESTION_TYPE)[number];

/** المستخدمون — طلاب ومعلمون ومدراء */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("student"),
    status: text("status").notNull().default("active"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    city: text("city"),
    /** الدولة — محصورة في الدول المدعومة: مصر، السعودية، الأردن، الإمارات */
    country: text("country"),
    stageId: uuid("stage_id"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/** الجلسات — رموز قابلة للإلغاء مخزّنة بصيغة مشفّرة */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_hash_idx").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

/** المراحل التعليمية: ابتدائية، إعدادية، ثانوية، جامعية... */
export const stages = pgTable("stages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  nameEn: text("name_en").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  iconKey: text("icon_key").default("book"),
  accent: text("accent").default("#1B3A6B"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** المواد الدراسية */
export const subjects = pgTable(
  "subjects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    accent: text("accent").default("#C9A227"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("subjects_stage_idx").on(t.stageId)],
);

/** الكورسات / المقررات */
export const courses = pgTable(
  "courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stageId: uuid("stage_id")
      .notNull()
      .references(() => stages.id, { onDelete: "cascade" }),
    subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
    teacherId: uuid("teacher_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary"),
    description: text("description"),
    coverUrl: text("cover_url"),
    level: text("level").notNull().default("beginner"),
    status: text("status").notNull().default("published"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isFree: boolean("is_free").notNull().default(true),
    price: integer("price").notNull().default(0),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    learningOutcomes: jsonb("learning_outcomes").$type<string[]>().default([]),
    requirements: jsonb("requirements").$type<string[]>().default([]),
    ratingSum: integer("rating_sum").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("courses_slug_idx").on(t.slug),
    index("courses_stage_idx").on(t.stageId),
    index("courses_subject_idx").on(t.subjectId),
  ],
);

/** الدروس داخل الكورس */
export const lessons = pgTable(
  "lessons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    type: text("type").notNull().default("article"),
    summary: text("summary"),
    content: text("content"),
    videoUrl: text("video_url"),
    attachmentUrl: text("attachment_url"),
    durationMinutes: integer("duration_minutes").notNull().default(10),
    sortOrder: integer("sort_order").notNull().default(0),
    isFreePreview: boolean("is_free_preview").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("lessons_course_idx").on(t.courseId)],
);

/** التسجيل في الكورسات */
export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    progressPercent: integer("progress_percent").notNull().default(0),
    status: text("status").notNull().default("active"),
    lastLessonId: uuid("last_lesson_id"),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("enrollments_user_course_idx").on(t.userId, t.courseId),
    index("enrollments_course_idx").on(t.courseId),
  ],
);

/** تقدّم الطالب في كل درس */
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    secondsSpent: integer("seconds_spent").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("lesson_progress_user_lesson_idx").on(t.userId, t.lessonId),
    index("lesson_progress_course_idx").on(t.courseId),
  ],
);

/** الاختبارات */
export const quizzes = pgTable(
  "quizzes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    timeLimitMinutes: integer("time_limit_minutes").notNull().default(10),
    passingPercent: integer("passing_percent").notNull().default(60),
    attemptsAllowed: integer("attempts_allowed").notNull().default(3),
    shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
    showExplanations: boolean("show_explanations").notNull().default(true),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("quizzes_course_idx").on(t.courseId)],
);

/** الأسئلة */
export const questions = pgTable(
  "questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("single"),
    text: text("text").notNull(),
    options: jsonb("options").$type<string[]>().notNull().default([]),
    correctIndexes: jsonb("correct_indexes").$type<number[]>().notNull().default([]),
    explanation: text("explanation"),
    points: integer("points").notNull().default(1),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("questions_quiz_idx").on(t.quizId)],
);

/** محاولات الاختبار */
export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull().default(0),
    totalPoints: integer("total_points").notNull().default(0),
    percent: integer("percent").notNull().default(0),
    passed: boolean("passed").notNull().default(false),
    answers: jsonb("answers").$type<Record<string, number[]>>().notNull().default({}),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (t) => [
    index("quiz_attempts_user_idx").on(t.userId),
    index("quiz_attempts_quiz_user_idx").on(t.quizId, t.userId),
  ],
);

/** الشهادات */
export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    grade: integer("grade").notNull().default(0),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("certificates_code_idx").on(t.code), uniqueIndex("certificates_user_course_idx").on(t.userId, t.courseId)],
);

/** الإعلانات */
export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  audience: text("audience").notNull().default("all"),
  stageId: uuid("stage_id"),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** رسائل التواصل */
export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  country: text("country"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** سجلّ التدقيق الأمني والإداري */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entity: text("entity"),
    entityId: text("entity_id"),
    meta: jsonb("meta").$type<Record<string, unknown>>().default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_created_idx").on(t.createdAt)],
);

/** إعدادات المنصة (مفتاح/قيمة) */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** تقييم الطلاب للكورسات */
export const courseReviews = pgTable(
  "course_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull().default(5),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("course_reviews_user_course_idx").on(t.userId, t.courseId)],
);

/* ------------------------------------------------------------------ */
/*  أنواع TypeScript                                                    */
/* ------------------------------------------------------------------ */
export type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;
export type Stage = typeof stages.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
