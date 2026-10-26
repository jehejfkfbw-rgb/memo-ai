import { and, asc, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "@/db";
import {
  announcements, certificates, contactMessages, courses, enrollments,
  lessons, questions, quizAttempts, quizzes, stages, subjects, users,
} from "@/db/schema";
import { ApiError, hashPassword } from "@/lib/auth";
import { isUuid, slugify, uniqueSlug } from "@/lib/utils";
import { SUPPORTED_COUNTRY_CODES, type CountryCode } from "@/lib/countries";

const countryEnum = z.enum(SUPPORTED_COUNTRY_CODES as unknown as [CountryCode, ...CountryCode[]], {
  errorMap: () => ({ message: "الدولة غير مدعومة — المسموح: مصر، السعودية، الأردن، الإمارات" }),
});

/* -------------------------------- المخططات -------------------------------- */

const optionalStr = (max: number) => z.string().trim().max(max).optional().or(z.literal("")).nullable();
const strArray = z.array(z.string().trim().min(1).max(200)).max(20).default([]);

export const entitySchemas = {
  users: {
    create: z.object({
      fullName: z.string().trim().min(3).max(80),
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(8).max(72),
      role: z.enum(["student", "teacher", "admin"]).default("student"),
      status: z.enum(["active", "suspended"]).default("active"),
      phone: optionalStr(20),
      city: optionalStr(60),
      bio: optionalStr(400),
      country: countryEnum,
      stageId: z.string().uuid().optional().or(z.literal("")).nullable(),
    }),
    update: z.object({
      fullName: z.string().trim().min(3).max(80).optional(),
      email: z.string().trim().toLowerCase().email().optional(),
      password: z.string().min(8).max(72).optional().or(z.literal("")),
      role: z.enum(["student", "teacher", "admin"]).optional(),
      status: z.enum(["active", "suspended"]).optional(),
      isActive: z.boolean().optional(),
      phone: optionalStr(20),
      city: optionalStr(60),
      bio: optionalStr(400),
      country: countryEnum.optional(),
      stageId: z.string().uuid().optional().or(z.literal("")).nullable(),
    }),
  },
  stages: {
    create: z.object({
      name: z.string().trim().min(2).max(80),
      nameEn: z.string().trim().min(2).max(80),
      slug: optionalStr(120),
      description: optionalStr(400),
      iconKey: z.string().trim().max(30).optional().default("book"),
      accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "صيغة اللون غير صحيحة").optional().default("#1B3A6B"),
      sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
      isActive: z.boolean().optional().default(true),
    }),
    update: z.object({
      name: z.string().trim().min(2).max(80).optional(),
      nameEn: z.string().trim().min(2).max(80).optional(),
      description: optionalStr(400),
      iconKey: z.string().trim().max(30).optional(),
      accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "صيغة اللون غير صحيحة").optional(),
      sortOrder: z.coerce.number().int().min(0).max(999).optional(),
      isActive: z.boolean().optional(),
    }),
  },
  subjects: {
    create: z.object({
      stageId: z.string().uuid(),
      name: z.string().trim().min(2).max(80),
      slug: optionalStr(120),
      description: optionalStr(400),
      accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "صيغة اللون غير صحيحة").optional().default("#C9A227"),
      sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
      isActive: z.boolean().optional().default(true),
    }),
    update: z.object({
      stageId: z.string().uuid().optional(),
      name: z.string().trim().min(2).max(80).optional(),
      description: optionalStr(400),
      accent: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      sortOrder: z.coerce.number().int().min(0).max(999).optional(),
      isActive: z.boolean().optional(),
    }),
  },
  courses: {
    create: z.object({
      title: z.string().trim().min(4).max(160),
      slug: optionalStr(180),
      stageId: z.string().uuid(),
      subjectId: z.string().uuid().optional().or(z.literal("")).nullable(),
      teacherId: z.string().uuid().optional().or(z.literal("")).nullable(),
      summary: optionalStr(300),
      description: optionalStr(4000),
      coverUrl: optionalStr(500),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional().default("beginner"),
      status: z.enum(["draft", "published", "archived"]).optional().default("published"),
      isFeatured: z.boolean().optional().default(false),
      isFree: z.boolean().optional().default(true),
      price: z.coerce.number().int().min(0).max(100000).optional().default(0),
      durationMinutes: z.coerce.number().int().min(0).max(100000).optional().default(0),
      learningOutcomes: strArray,
      requirements: strArray,
    }),
    update: z.object({
      title: z.string().trim().min(4).max(160).optional(),
      stageId: z.string().uuid().optional(),
      subjectId: z.string().uuid().optional().or(z.literal("")).nullable(),
      teacherId: z.string().uuid().optional().or(z.literal("")).nullable(),
      summary: optionalStr(300),
      description: optionalStr(4000),
      coverUrl: optionalStr(500),
      level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
      isFeatured: z.boolean().optional(),
      isFree: z.boolean().optional(),
      price: z.coerce.number().int().min(0).max(100000).optional(),
      durationMinutes: z.coerce.number().int().min(0).max(100000).optional(),
      learningOutcomes: strArray.optional(),
      requirements: strArray.optional(),
    }),
  },
  lessons: {
    create: z.object({
      courseId: z.string().uuid(),
      title: z.string().trim().min(3).max(180),
      slug: optionalStr(200),
      type: z.enum(["video", "article", "quiz", "attachment"]).optional().default("article"),
      summary: optionalStr(300),
      content: optionalStr(20000),
      videoUrl: optionalStr(500),
      attachmentUrl: optionalStr(500),
      durationMinutes: z.coerce.number().int().min(0).max(600).optional().default(10),
      sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
      isFreePreview: z.boolean().optional().default(false),
      isPublished: z.boolean().optional().default(true),
    }),
    update: z.object({
      title: z.string().trim().min(3).max(180).optional(),
      type: z.enum(["video", "article", "quiz", "attachment"]).optional(),
      summary: optionalStr(300),
      content: optionalStr(20000),
      videoUrl: optionalStr(500),
      attachmentUrl: optionalStr(500),
      durationMinutes: z.coerce.number().int().min(0).max(600).optional(),
      sortOrder: z.coerce.number().int().min(0).max(999).optional(),
      isFreePreview: z.boolean().optional(),
      isPublished: z.boolean().optional(),
    }),
  },
  quizzes: {
    create: z.object({
      courseId: z.string().uuid().optional().or(z.literal("")).nullable(),
      lessonId: z.string().uuid().optional().or(z.literal("")).nullable(),
      title: z.string().trim().min(3).max(180),
      description: optionalStr(600),
      timeLimitMinutes: z.coerce.number().int().min(1).max(300).optional().default(10),
      passingPercent: z.coerce.number().int().min(0).max(100).optional().default(60),
      attemptsAllowed: z.coerce.number().int().min(1).max(50).optional().default(3),
      shuffleQuestions: z.boolean().optional().default(false),
      showExplanations: z.boolean().optional().default(true),
      isPublished: z.boolean().optional().default(true),
      sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
    }),
    update: z.object({
      courseId: z.string().uuid().optional().or(z.literal("")).nullable(),
      lessonId: z.string().uuid().optional().or(z.literal("")).nullable(),
      title: z.string().trim().min(3).max(180).optional(),
      description: optionalStr(600),
      timeLimitMinutes: z.coerce.number().int().min(1).max(300).optional(),
      passingPercent: z.coerce.number().int().min(0).max(100).optional(),
      attemptsAllowed: z.coerce.number().int().min(1).max(50).optional(),
      shuffleQuestions: z.boolean().optional(),
      showExplanations: z.boolean().optional(),
      isPublished: z.boolean().optional(),
      sortOrder: z.coerce.number().int().min(0).max(999).optional(),
    }),
  },
  questions: {
    create: z.object({
      quizId: z.string().uuid(),
      type: z.enum(["single", "multiple", "truefalse"]).optional().default("single"),
      text: z.string().trim().min(3).max(800),
      options: z.array(z.string().trim().min(1).max(300)).min(2).max(8),
      correctIndexes: z.array(z.number().int().min(0).max(7)).min(1).max(8),
      explanation: optionalStr(800),
      points: z.coerce.number().int().min(1).max(50).optional().default(1),
      sortOrder: z.coerce.number().int().min(0).max(999).optional().default(0),
    }),
    update: z.object({
      type: z.enum(["single", "multiple", "truefalse"]).optional(),
      text: z.string().trim().min(3).max(800).optional(),
      options: z.array(z.string().trim().min(1).max(300)).min(2).max(8).optional(),
      correctIndexes: z.array(z.number().int().min(0).max(7)).min(1).max(8).optional(),
      explanation: optionalStr(800),
      points: z.coerce.number().int().min(1).max(50).optional(),
      sortOrder: z.coerce.number().int().min(0).max(999).optional(),
    }),
  },
  enrollments: {
    create: z.object({
      userId: z.string().uuid(),
      courseId: z.string().uuid(),
      progressPercent: z.coerce.number().int().min(0).max(100).optional().default(0),
      status: z.enum(["in_progress", "completed", "dropped"]).optional().default("in_progress"),
    }),
    update: z.object({
      progressPercent: z.coerce.number().int().min(0).max(100).optional(),
      status: z.enum(["in_progress", "completed", "dropped"]).optional(),
    }),
  },
  announcements: {
    create: z.object({
      title: z.string().trim().min(3).max(160),
      body: z.string().trim().min(10).max(4000),
      audience: z.enum(["all", "students", "teachers"]).optional().default("all"),
      stageId: z.string().uuid().optional().or(z.literal("")).nullable(),
      isPublished: z.boolean().optional().default(true),
    }),
    update: z.object({
      title: z.string().trim().min(3).max(160).optional(),
      body: z.string().trim().min(10).max(4000).optional(),
      audience: z.enum(["all", "students", "teachers"]).optional(),
      stageId: z.string().uuid().optional().or(z.literal("")).nullable(),
      isPublished: z.boolean().optional(),
    }),
  },
  contactMessages: {
    create: z.object({
      name: z.string().trim().min(3).max(80),
      email: z.string().trim().toLowerCase().email(),
      subject: z.string().trim().min(3).max(120),
      message: z.string().trim().min(10).max(2000),
      country: countryEnum.optional(),
      status: z.enum(["new", "read", "replied"]).optional().default("new"),
    }),
    update: z.object({ status: z.enum(["new", "read", "replied"]), country: countryEnum.optional() }),
  },
};

export type EntityName = keyof typeof entitySchemas;

type EntityDef = {
  table: PgTable;
  pk: PgColumn;
  search?: PgColumn[];
  order?: (table: PgTable) => SQL;
  readOnly?: boolean;
  slugField?: { source: string; table: PgTable; column: PgColumn };
  beforeCreate?: (data: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  beforeUpdate?: (data: Record<string, unknown>, id: string) => Promise<Record<string, unknown>> | Record<string, unknown>;
};

export const entities: Record<EntityName, EntityDef> = {
  users: {
    table: users,
    pk: users.id,
    search: [users.fullName, users.email, users.city],
    order: () => desc(users.createdAt),
    slugField: undefined,
    beforeCreate: (data) => ({
      ...data,
      passwordHash: hashPassword(String(data.password)),
      password: undefined,
      stageId: data.stageId || null,
      country: data.country || null,
    }),
    beforeUpdate: (data) => {
      const next = { ...data };
      if (next.password) next.passwordHash = hashPassword(String(next.password));
      delete next.password;
      if (next.stageId === "") next.stageId = null;
      return next;
    },
  },
  stages: {
    table: stages, pk: stages.id, search: [stages.name, stages.nameEn],
    order: () => asc(stages.sortOrder),
    slugField: { source: "name", table: stages, column: stages.slug },
  },
  subjects: {
    table: subjects, pk: subjects.id, search: [subjects.name],
    order: () => asc(subjects.sortOrder),
    slugField: { source: "name", table: subjects, column: subjects.slug },
  },
  courses: {
    table: courses, pk: courses.id, search: [courses.title, courses.summary],
    order: () => desc(courses.createdAt),
    slugField: { source: "title", table: courses, column: courses.slug },
    beforeUpdate: (data) => ({ ...data, updatedAt: new Date(), subjectId: data.subjectId === "" ? null : data.subjectId, teacherId: data.teacherId === "" ? null : data.teacherId }),
    beforeCreate: (data) => ({ ...data, subjectId: data.subjectId || null, teacherId: data.teacherId || null }),
  },
  lessons: {
    table: lessons, pk: lessons.id, search: [lessons.title],
    order: () => asc(lessons.sortOrder),
    slugField: { source: "title", table: lessons, column: lessons.slug },
    beforeUpdate: (data) => ({ ...data, updatedAt: new Date() }),
  },
  quizzes: { table: quizzes, pk: quizzes.id, search: [quizzes.title], order: () => desc(quizzes.createdAt),
    beforeCreate: (d) => ({ ...d, courseId: d.courseId || null, lessonId: d.lessonId || null }) },
  questions: { table: questions, pk: questions.id, search: [questions.text], order: () => asc(questions.sortOrder) },
  enrollments: { table: enrollments, pk: enrollments.id, order: () => desc(enrollments.enrolledAt) },
  announcements: { table: announcements, pk: announcements.id, search: [announcements.title], order: () => desc(announcements.publishedAt) },
  contactMessages: { table: contactMessages, pk: contactMessages.id, search: [contactMessages.name, contactMessages.email, contactMessages.subject], order: () => desc(contactMessages.createdAt) },
};

/* ------------------------------- القوائم ------------------------------- */

export async function listEntity(
  name: EntityName,
  opts: { page?: number; pageSize?: number; search?: string; filters?: Record<string, string | undefined>; order?: "asc" | "desc" } = {},
) {
  const def = entities[name];
  if (!def) throw new ApiError(404, "الكيان غير معروف");
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, opts.pageSize ?? 20));

  const conditions: Array<SQL | undefined> = [];
  if (opts.search && def.search?.length) {
    conditions.push(or(...def.search.map((f) => like(sql`${f}`, `%${opts.search}%`))));
  }
  for (const [key, value] of Object.entries(opts.filters ?? {})) {
    if (!value) continue;
    const column = (def.table as unknown as Record<string, PgColumn>)[key];
    if (!column) continue;
    // حماية أعمدة uuid من القيم النصية غير الصالحة (خطأ 22P02)
    if (column.getSQLType() === "uuid" && !isUuid(value)) continue;
    if (value === "true" || value === "false") conditions.push(eq(column, value === "true") as unknown as SQL);
    else conditions.push(eq(column, value) as unknown as SQL);
  }
  const where = conditions.length ? and(...(conditions.filter(Boolean) as Array<SQL>)) : undefined;

  const [rows, totalRow] = await Promise.all([
    db.select().from(def.table).where(where).orderBy(def.order?.(def.table) ?? desc(def.pk)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ value: count() }).from(def.table).where(where),
  ]);

  return { items: await decorateRows(name, rows), total: totalRow[0]?.value ?? 0, page, pageSize };
}

export async function getEntityRow(name: EntityName, id: string) {
  const def = entities[name];
  if (!def) throw new ApiError(404, "الكيان غير معروف");
  const [row] = await db.select().from(def.table).where(eq(def.pk, id)).limit(1);
  if (!row) throw new ApiError(404, "العنصر غير موجود");
  const [decorated] = await decorateRows(name, [row]);
  return decorated;
}

export async function createEntityRow(name: EntityName, raw: Record<string, unknown>, actorId: string) {
  const def = entities[name];
  if (!def) throw new ApiError(404, "الكيان غير معروف");
  const parsed = entitySchemas[name].create.parse(raw) as Record<string, unknown>;

  let data = def.beforeCreate ? await def.beforeCreate(parsed) : parsed;
  if (name === "users") {
    const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, String(data.email))).limit(1);
    if (exists) throw new ApiError(409, "هذا البريد الإلكتروني مسجّل بالفعل");
  }
  if (def.slugField) {
    const existingSlugs = await db.select({ slug: def.slugField.column }).from(def.slugField.table);
    const base = String(data.slug || data[def.slugField.source] || "item");
    data = { ...data, slug: uniqueSlug(slugify(base), existingSlugs.map((s) => String(s.slug))) };
  }

  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  const [row] = await db.insert(def.table).values(clean).returning();
  void actorId;
  const [decorated] = await decorateRows(name, [row]);
  return decorated;
}

export async function updateEntityRow(name: EntityName, id: string, raw: Record<string, unknown>, actorId: string) {
  const def = entities[name];
  if (!def) throw new ApiError(404, "الكيان غير معروف");
  const parsed = entitySchemas[name].update.parse(raw) as Record<string, unknown>;
  if (Object.keys(parsed).length === 0) throw new ApiError(422, "لا توجد بيانات للتحديث");

  let data = def.beforeUpdate ? await def.beforeUpdate(parsed, id) : parsed;
  if (name === "users") {
    if (id === actorId && (data.role !== undefined || data.status !== undefined || data.isActive !== undefined)) {
      throw new ApiError(403, "لا يمكنك تغيير صلاحية أو حالة حسابك الحالي");
    }
    if (data.email) {
      const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, String(data.email))).limit(1);
      if (exists && exists.id !== id) throw new ApiError(409, "هذا البريد الإلكتروني مستخدم لحساب آخر");
    }
  }

  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (Object.keys(clean).length === 0) throw new ApiError(422, "لا توجد بيانات للتحديث");

  const [row] = await db.update(def.table).set(clean).where(eq(def.pk, id)).returning();
  if (!row) throw new ApiError(404, "العنصر غير موجود");
  const [decorated] = await decorateRows(name, [row]);
  return decorated;
}

export async function deleteEntityRow(name: EntityName, id: string, actorId: string) {
  const def = entities[name];
  if (!def) throw new ApiError(404, "الكيان غير معروف");
  if (name === "users" && id === actorId) throw new ApiError(403, "لا يمكنك حذف حسابك الحالي");

  if (name === "users") {
    const { sessions } = await import("@/db/schema");
    await db.delete(sessions).where(eq(sessions.userId, id));
  }

  const deleted = await db.delete(def.table).where(eq(def.pk, id)).returning();
  if (!deleted.length) throw new ApiError(404, "العنصر غير موجود");
  return true;
}

/* ------------------------------ تزيين الصفوف ------------------------------ */

type Lookups = {
  stages: Map<string, string>;
  subjects: Map<string, string>;
  courses: Map<string, { title: string; slug: string }>;
  users: Map<string, { name: string; email: string }>;
  quizzes: Map<string, string>;
  lessons: Map<string, string>;
};

async function buildLookups(): Promise<Lookups> {
  const [stageRows, subjectRows, courseRows, userRows, quizRows, lessonRows] = await Promise.all([
    db.select({ id: stages.id, name: stages.name }).from(stages),
    db.select({ id: subjects.id, name: subjects.name }).from(subjects),
    db.select({ id: courses.id, title: courses.title, slug: courses.slug }).from(courses),
    db.select({ id: users.id, name: users.fullName, email: users.email }).from(users),
    db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes),
    db.select({ id: lessons.id, title: lessons.title }).from(lessons),
  ]);
  return {
    stages: new Map(stageRows.map((r) => [r.id, r.name])),
    subjects: new Map(subjectRows.map((r) => [r.id, r.name])),
    courses: new Map(courseRows.map((r) => [r.id, { title: r.title, slug: r.slug }])),
    users: new Map(userRows.map((r) => [r.id, { name: r.name, email: r.email }])),
    quizzes: new Map(quizRows.map((r) => [r.id, r.title])),
    lessons: new Map(lessonRows.map((r) => [r.id, r.title])),
  };
}

const NEEDS_LOOKUPS: EntityName[] = [
  "users", "subjects", "courses", "lessons", "quizzes", "questions", "enrollments", "announcements",
];

async function decorateRows(name: EntityName, rows: unknown[]): Promise<Record<string, unknown>[]> {
  if (!rows.length) return [];
  const clean = rows.map((r) => {
    const copy = { ...(r as Record<string, unknown>) };
    delete copy.passwordHash;
    return copy;
  });
  if (!NEEDS_LOOKUPS.includes(name)) return clean;

  const lookups = await buildLookups();
  return clean.map((row) => {
    const extra: Record<string, unknown> = {};
    const stageId = row.stageId as string | null | undefined;
    const subjectId = row.subjectId as string | null | undefined;
    const courseId = row.courseId as string | null | undefined;
    const teacherId = row.teacherId as string | null | undefined;
    const userId = row.userId as string | null | undefined;
    const quizId = row.quizId as string | null | undefined;
    const lessonId = row.lessonId as string | null | undefined;

    if (stageId) extra.stageName = lookups.stages.get(stageId) ?? null;
    if (subjectId) extra.subjectName = lookups.subjects.get(subjectId) ?? null;
    if (courseId) extra.courseTitle = lookups.courses.get(courseId)?.title ?? null;
    if (teacherId) extra.teacherName = lookups.users.get(teacherId)?.name ?? null;
    if (userId) extra.userName = lookups.users.get(userId)?.name ?? null, extra.userEmail = lookups.users.get(userId)?.email ?? null;
    if (quizId) extra.quizTitle = lookups.quizzes.get(quizId) ?? null;
    if (lessonId) extra.lessonTitle = lookups.lessons.get(lessonId) ?? null;
    if (name === "users" && row.stageId) extra.stageName = lookups.stages.get(String(row.stageId)) ?? null;
    return { ...row, ...extra };
  });
}

/** كيانات للقراءة فقط تستخدم في لوحة الإدارة */
export const readEntities = {
  quizAttempts: { table: quizAttempts, pk: quizAttempts.id, order: () => desc(quizAttempts.submittedAt) },
  certificates: { table: certificates, pk: certificates.id, order: () => desc(certificates.issuedAt) },
} as const;

export async function listReadOnly(name: keyof typeof readEntities, opts: { page?: number; pageSize?: number } = {}) {
  const def = readEntities[name];
  if (!def) throw new ApiError(404, "الكيان غير معروف");
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.min(100, Math.max(5, opts.pageSize ?? 20));
  const [rows, totalRow] = await Promise.all([
    db.select().from(def.table).orderBy(def.order()).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ value: count() }).from(def.table),
  ]);
  const lookups = await buildLookups();
  const items = rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...row,
      quizTitle: row.quizId ? lookups.quizzes.get(String(row.quizId)) ?? null : null,
      courseTitle: row.courseId ? lookups.courses.get(String(row.courseId))?.title ?? null : null,
      userName: row.userId ? lookups.users.get(String(row.userId))?.name ?? null : null,
      userEmail: row.userId ? lookups.users.get(String(row.userId))?.email ?? null : null,
    };
  });
  return { items, total: totalRow[0]?.value ?? 0, page, pageSize };
}
