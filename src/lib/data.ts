import { and, asc, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  announcements,
  certificates,
  contactMessages,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  questions,
  quizAttempts,
  quizzes,
  stages,
  subjects,
  users,
} from "@/db/schema";
import { isUuid, percentOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

/* ------------------------------- التصنيفات ------------------------------- */

export async function listStages(activeOnly = false) {
  const rows = await db
    .select()
    .from(stages)
    .where(activeOnly ? eq(stages.isActive, true) : undefined)
    .orderBy(asc(stages.sortOrder));
  return rows;
}

export async function listSubjects(stageId?: string, activeOnly = false) {
  const safeStageId = isUuid(stageId) ? stageId : undefined;
  const rows = await db
    .select()
    .from(subjects)
    .where(
      and(
        safeStageId ? eq(subjects.stageId, safeStageId) : undefined,
        activeOnly ? eq(subjects.isActive, true) : undefined,
      ),
    )
    .orderBy(asc(subjects.sortOrder));
  return rows;
}

/** المراحل مع عدد الكورسات لكل مرحلة */
export async function stagesWithCounts() {
  const rows = await db
    .select({
      stage: stages,
      courseCount: sql<number>`count(${courses.id})::int`,
    })
    .from(stages)
    .leftJoin(courses, and(eq(courses.stageId, stages.id), eq(courses.status, "published")))
    .where(eq(stages.isActive, true))
    .groupBy(stages.id)
    .orderBy(asc(stages.sortOrder));
  return rows.map((r) => ({ ...r.stage, courseCount: r.courseCount }));
}

/* -------------------------------- الكورسات -------------------------------- */

export type CourseFilters = {
  stageId?: string;
  subjectId?: string;
  search?: string;
  level?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
};

export async function listCourses(filters: CourseFilters = {}) {
  // أي معرّف غير صالح (رابط مُعدَّل يدويًا) يُتجاهل بدل أن يُسبب خطأ في قاعدة البيانات
  const stageId = isUuid(filters.stageId) ? filters.stageId : undefined;
  const subjectId = isUuid(filters.subjectId) ? filters.subjectId : undefined;
  const { search, level, featured, limit = 24, offset = 0 } = filters;
  const conditions = [
    eq(courses.status, "published"),
    stageId ? eq(courses.stageId, stageId) : undefined,
    subjectId ? eq(courses.subjectId, subjectId) : undefined,
    level ? eq(courses.level, level) : undefined,
    featured ? eq(courses.isFeatured, true) : undefined,
    search
      ? or(like(courses.title, `%${search}%`), like(sql`${courses.summary}`, `%${search}%`))
      : undefined,
  ].filter(Boolean);

  const where = and(...(conditions as []));

  const rows = await db
    .select({
      course: courses,
      stage: stages,
      subject: subjects,
      teacherName: users.fullName,
      teacherAvatar: users.avatarUrl,
      lessonCount: sql<number>`(select count(*)::int from ${lessons} where ${lessons.courseId} = ${courses.id} and ${lessons.isPublished} = true)`,
      enrolledCount: sql<number>`(select count(*)::int from ${enrollments} where ${enrollments.courseId} = ${courses.id})`,
    })
    .from(courses)
    .innerJoin(stages, eq(stages.id, courses.stageId))
    .leftJoin(subjects, eq(subjects.id, courses.subjectId))
    .leftJoin(users, eq(users.id, courses.teacherId))
    .where(where)
    .orderBy(desc(courses.isFeatured), desc(courses.createdAt))
    .limit(limit)
    .offset(offset);

  const totalRows = await db
    .select({ value: count() })
    .from(courses)
    .where(where);

  return {
    total: totalRows[0]?.value ?? 0,
    items: rows.map((r) => ({
      ...r.course,
      stage: r.stage,
      subject: r.subject,
      teacherName: r.teacherName,
      teacherAvatar: r.teacherAvatar,
      lessonCount: r.lessonCount,
      enrolledCount: r.enrolledCount,
      rating: r.course.ratingCount ? Number((r.course.ratingSum / r.course.ratingCount).toFixed(1)) : 0,
    })),
  };
}

export type CourseListItem = Awaited<ReturnType<typeof listCourses>>["items"][number];

export async function getCourseBySlug(slug: string) {
  const rows = await db
    .select({
      course: courses,
      stage: stages,
      subject: subjects,
      teacher: users,
    })
    .from(courses)
    .innerJoin(stages, eq(stages.id, courses.stageId))
    .leftJoin(subjects, eq(subjects.id, courses.subjectId))
    .leftJoin(users, eq(users.id, courses.teacherId))
    .where(isUuid(slug) ? or(eq(courses.slug, slug), eq(courses.id, slug)) : eq(courses.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCourseCurriculum(courseId: string, includeDrafts = false) {
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.courseId, courseId), includeDrafts ? undefined : eq(lessons.isPublished, true)))
    .orderBy(asc(lessons.sortOrder), asc(lessons.createdAt));

  const quizRows = await db
    .select({
      quiz: quizzes,
      questionCount: sql<number>`(select count(*)::int from ${questions} where ${questions.quizId} = ${quizzes.id})`,
    })
    .from(quizzes)
    .where(and(eq(quizzes.courseId, courseId), includeDrafts ? undefined : eq(quizzes.isPublished, true)))
    .orderBy(asc(quizzes.sortOrder));

  return { lessons: lessonRows, quizzes: quizRows.map((q) => ({ ...q.quiz, questionCount: q.questionCount })) };
}

export async function getCourseReviews(courseId: string) {
  return db
    .select({
      id: users.id,
      name: users.fullName,
      avatarUrl: users.avatarUrl,
      rating: sql<number>`coalesce((select round(avg(r.rating)) from course_reviews r where r.course_id = ${courseId} and r.user_id = ${users.id}), 0)::int`,
      comment: sql<string>`coalesce((select r.comment from course_reviews r where r.course_id = ${courseId} and r.user_id = ${users.id} limit 1), '')`,
      createdAt: sql<string>`coalesce((select to_char(r.created_at,'YYYY-MM-DD') from course_reviews r where r.course_id = ${courseId} and r.user_id = ${users.id} limit 1), '')`,
    })
    .from(users)
    .innerJoin(enrollments, and(eq(enrollments.userId, users.id), eq(enrollments.courseId, courseId)))
    .limit(6);
}

/* ------------------------------ تقدم الطالب ------------------------------ */

export async function getUserCourses(userId: string) {
  const rows = await db
    .select({
      enrollment: enrollments,
      course: courses,
      stage: stages,
      subject: subjects,
      teacherName: users.fullName,
      totalLessons: sql<number>`(select count(*)::int from ${lessons} where ${lessons.courseId} = ${courses.id} and ${lessons.isPublished} = true)`,
      completedLessons: sql<number>`(select count(*)::int from ${lessonProgress} where ${lessonProgress.courseId} = ${courses.id} and ${lessonProgress.userId} = ${userId} and ${lessonProgress.completed} = true)`,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(stages, eq(stages.id, courses.stageId))
    .leftJoin(subjects, eq(subjects.id, courses.subjectId))
    .leftJoin(users, eq(users.id, courses.teacherId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.enrolledAt));

  return rows.map((r) => {
    const total = r.totalLessons || 0;
    const done = r.completedLessons || 0;
    return {
      ...r.course,
      enrollment: r.enrollment,
      stage: r.stage,
      subject: r.subject,
      teacherName: r.teacherName,
      totalLessons: total,
      completedLessons: done,
      progress: total ? percentOf(done, total) : r.enrollment.progressPercent,
    };
  });
}

export type EnrolledCourse = Awaited<ReturnType<typeof getUserCourses>>[number];

export async function getUserStats(userId: string) {
  const [enrolledRow, completedRow, lessonsRow, attemptsRow, certsRow, minutesRow] = await Promise.all([
    db.select({ value: count() }).from(enrollments).where(eq(enrollments.userId, userId)),
    db
      .select({ value: count() })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.status, "completed"))),
    db
      .select({ value: count() })
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true))),
    db.select({ value: count(), avg: sql<number>`coalesce(round(avg(${quizAttempts.percent})),0)::int`, best: sql<number>`coalesce(max(${quizAttempts.percent}),0)::int` })
      .from(quizAttempts).where(eq(quizAttempts.userId, userId)),
    db.select({ value: count() }).from(certificates).where(eq(certificates.userId, userId)),
    db.select({ value: sql<number>`coalesce(sum(${lessonProgress.secondsSpent}),0)::int` })
      .from(lessonProgress).where(eq(lessonProgress.userId, userId)),
  ]);

  return {
    enrolled: enrolledRow[0]?.value ?? 0,
    completedCourses: completedRow[0]?.value ?? 0,
    completedLessons: lessonsRow[0]?.value ?? 0,
    quizAttempts: attemptsRow[0]?.value ?? 0,
    averageScore: attemptsRow[0]?.avg ?? 0,
    bestScore: attemptsRow[0]?.best ?? 0,
    certificates: certsRow[0]?.value ?? 0,
    studyMinutes: Math.round((minutesRow[0]?.value ?? 0) / 60),
  };
}

export async function getUserAttempts(userId: string, limit = 50) {
  return db
    .select({
      attempt: quizAttempts,
      quizTitle: quizzes.title,
      courseId: quizzes.courseId,
      courseTitle: courses.title,
    })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizzes.id, quizAttempts.quizId))
    .leftJoin(courses, eq(courses.id, quizzes.courseId))
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.submittedAt))
    .limit(limit);
}

export async function getUserCertificates(userId: string) {
  return db
    .select({ certificate: certificates, course: courses, stage: stages })
    .from(certificates)
    .innerJoin(courses, eq(courses.id, certificates.courseId))
    .innerJoin(stages, eq(stages.id, courses.stageId))
    .where(eq(certificates.userId, userId))
    .orderBy(desc(certificates.issuedAt));
}

/* -------------------------------- الإدارة -------------------------------- */

export async function adminOverview() {
  const [
    totalUsers, students, teachers, totalCourses, publishedCourses, totalLessons,
    totalQuizzes, totalEnrollments, totalAttempts, avgScore, totalMessages, newMessages,
  ] = await Promise.all([
    db.select({ v: count() }).from(users),
    db.select({ v: count() }).from(users).where(eq(users.role, "student")),
    db.select({ v: count() }).from(users).where(eq(users.role, "teacher")),
    db.select({ v: count() }).from(courses),
    db.select({ v: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ v: count() }).from(lessons),
    db.select({ v: count() }).from(quizzes),
    db.select({ v: count() }).from(enrollments),
    db.select({ v: count() }).from(quizAttempts),
    db.select({ v: sql<number>`coalesce(round(avg(${quizAttempts.percent})),0)::int` }).from(quizAttempts),
    db.select({ v: count() }).from(contactMessages),
    db.select({ v: count() }).from(contactMessages).where(eq(contactMessages.status, "new")),
  ]);

  const signups = await db
    .select({ day: sql<string>`to_char(${users.createdAt}, 'YYYY-MM-DD')`, v: count() })
    .from(users)
    .where(sql`${users.createdAt} >= now() - interval '14 days'`)
    .groupBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${users.createdAt}, 'YYYY-MM-DD')`);

  const enrollTrend = await db
    .select({ day: sql<string>`to_char(${enrollments.enrolledAt}, 'YYYY-MM-DD')`, v: count() })
    .from(enrollments)
    .where(sql`${enrollments.enrolledAt} >= now() - interval '14 days'`)
    .groupBy(sql`to_char(${enrollments.enrolledAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${enrollments.enrolledAt}, 'YYYY-MM-DD')`);

  const topCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      stage: stages.name,
      enrolled: sql<number>`count(${enrollments.id})::int`,
    })
    .from(courses)
    .innerJoin(stages, eq(stages.id, courses.stageId))
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .groupBy(courses.id, stages.name)
    .orderBy(desc(sql`count(${enrollments.id})`))
    .limit(5);

  const stageDistribution = await db
    .select({ name: stages.name, accent: stages.accent, v: sql<number>`count(${courses.id})::int` })
    .from(stages)
    .leftJoin(courses, eq(courses.stageId, stages.id))
    .groupBy(stages.id, stages.name, stages.accent)
    .orderBy(desc(sql`count(${courses.id})`));

  const recentUsers = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email, role: users.role, createdAt: users.createdAt, status: users.status })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(6);

  return {
    totals: {
      users: totalUsers[0].v,
      students: students[0].v,
      teachers: teachers[0].v,
      courses: totalCourses[0].v,
      publishedCourses: publishedCourses[0].v,
      lessons: totalLessons[0].v,
      quizzes: totalQuizzes[0].v,
      enrollments: totalEnrollments[0].v,
      attempts: totalAttempts[0].v,
      averageScore: avgScore[0].v,
      messages: totalMessages[0].v,
      newMessages: newMessages[0].v,
    },
    charts: { signups, enrollTrend, stageDistribution },
    topCourses,
    recentUsers,
  };
}

export async function listAnnouncements(publishedOnly = true, limit = 5) {
  return db
    .select({ announcement: announcements, authorName: users.fullName })
    .from(announcements)
    .leftJoin(users, eq(users.id, announcements.authorId))
    .where(publishedOnly ? eq(announcements.isPublished, true) : undefined)
    .orderBy(desc(announcements.publishedAt))
    .limit(limit);
}

export async function getLessonWithCourse(lessonId: string) {
  const rows = await db
    .select({ lesson: lessons, course: courses, stage: stages })
    .from(lessons)
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .innerJoin(stages, eq(stages.id, courses.stageId))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCompletedLessonIds(courseId: string, userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set<string>();
  const done = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.courseId, courseId), eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true)));
  return new Set(done.map((d) => d.lessonId));
}

export async function getQuizForStudent(quizId: string) {
  const quizRows = await db
    .select({ quiz: quizzes, course: courses })
    .from(quizzes)
    .leftJoin(courses, eq(courses.id, quizzes.courseId))
    .where(eq(quizzes.id, quizId))
    .limit(1);
  const row = quizRows[0];
  if (!row) return null;
  const qs = await db
    .select({ id: questions.id, type: questions.type, text: questions.text, options: questions.options, points: questions.points, sortOrder: questions.sortOrder })
    .from(questions)
    .where(eq(questions.quizId, quizId))
    .orderBy(asc(questions.sortOrder));
  return { quiz: row.quiz, course: row.course, questions: qs };
}

export async function relatedCourses(courseId: string, stageId: string, subjectId: string | null, limit = 3) {
  return db
    .select({
      id: courses.id, title: courses.title, slug: courses.slug, coverUrl: courses.coverUrl, level: courses.level, durationMinutes: courses.durationMinutes,
    })
    .from(courses)
    .where(
      and(
        eq(courses.status, "published"),
        eq(courses.stageId, stageId),
        sql`${courses.id} <> ${courseId}`,
        subjectId ? eq(courses.subjectId, subjectId) : undefined,
      ),
    )
    .limit(limit);
}

export async function userEnrollmentIds(userId: string | null, courseIds: string[]) {
  if (!userId || courseIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), inArray(enrollments.courseId, courseIds)));
  return new Set(rows.map((r) => r.courseId));
}
