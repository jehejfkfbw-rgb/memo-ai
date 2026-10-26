import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { certificates, courses, enrollments, lessons, lessonProgress, users } from "@/db/schema";
import { ApiError, audit, requireUser } from "@/lib/auth";
import { readJson, safeRoute } from "@/lib/http";
import { certificateCode, percentOf } from "@/lib/utils";

export const dynamic = "force-dynamic";

const enrollSchema = z.object({ courseId: z.string().uuid("معرّف الكورس غير صالح") });
const progressSchema = z.object({
  lessonId: z.string().uuid(),
  completed: z.boolean().default(true),
  secondsSpent: z.number().int().min(0).max(86_400).optional(),
});

/** POST /api/learn  { action } — التسجيل في كورس أو إلغاء التسجيل أو تحديث تقدم درس */
export async function POST(req: Request) {
  return safeRoute(async () => {
    const user = await requireUser();
    const body = (await readJson<Record<string, unknown>>(req)) ?? {};
    const action = String(body.action ?? "");

    if (action === "enroll") return enroll(user.id, enrollSchema.parse(body));
    if (action === "unenroll") return unenroll(user.id, enrollSchema.parse(body));
    if (action === "progress") return saveProgress(user.id, progressSchema.parse(body));
    throw new ApiError(400, "إجراء غير معروف");
  });
}

async function enroll(userId: string, body: z.infer<typeof enrollSchema>) {
  const [course] = await db.select().from(courses).where(eq(courses.id, body.courseId)).limit(1);
  if (!course || course.status !== "published") throw new ApiError(404, "الكورس غير متاح");

  const [existing] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, course.id)))
    .limit(1);
  if (existing) {
    return Response.json({ ok: true, message: "أنت مسجّل في هذا الكورس بالفعل", data: { enrollment: existing, alreadyEnrolled: true } });
  }

  const [enrollment] = await db
    .insert(enrollments)
    .values({ userId, courseId: course.id, progressPercent: 0, status: "in_progress" })
    .returning();
  await audit("course.enroll", { userId, entity: "course", entityId: course.id });
  return Response.json({ ok: true, message: `تم تسجيلك في «${course.title}»`, data: { enrollment } }, { status: 201 });
}

async function unenroll(userId: string, body: z.infer<typeof enrollSchema>) {
  const deleted = await db
    .delete(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, body.courseId)))
    .returning({ id: enrollments.id });
  if (!deleted.length) throw new ApiError(404, "لم يتم العثور على التسجيل");
  await audit("course.unenroll", { userId, entity: "course", entityId: body.courseId });
  return Response.json({ ok: true, message: "تم إلغاء تسجيلك من الكورس" });
}

async function saveProgress(userId: string, body: z.infer<typeof progressSchema>) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, body.lessonId)).limit(1);
  if (!lesson) throw new ApiError(404, "الدرس غير موجود");

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, lesson.courseId)))
    .limit(1);
  if (!enrollment) throw new ApiError(403, "يجب التسجيل في الكورس أولًا");

  await db
    .insert(lessonProgress)
    .values({
      userId,
      lessonId: lesson.id,
      courseId: lesson.courseId,
      completed: body.completed,
      secondsSpent: body.secondsSpent ?? lesson.durationMinutes * 60,
      completedAt: body.completed ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: {
        completed: body.completed,
        completedAt: body.completed ? new Date() : null,
        secondsSpent: body.secondsSpent ?? lesson.durationMinutes * 60,
        updatedAt: new Date(),
      },
    });

  const totals = await db
    .select({
      all: count(lessons.id),
      done: count(lessonProgress.id),
    })
    .from(lessons)
    .leftJoin(
      lessonProgress,
      and(
        eq(lessonProgress.lessonId, lessons.id),
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.completed, true),
      ),
    )
    .where(and(eq(lessons.courseId, lesson.courseId), eq(lessons.isPublished, true)));

  const totalLessons = totals[0]?.all ?? 0;
  const doneLessons = totals[0]?.done ?? 0;
  const percent = percentOf(doneLessons, totalLessons);
  const finished = percent >= 100;

  await db
    .update(enrollments)
    .set({
      progressPercent: percent,
      status: finished ? "completed" : "in_progress",
      completedAt: finished ? new Date() : null,
      lastLessonId: lesson.id,
    })
    .where(eq(enrollments.id, enrollment.id));

  let certificate = null;
  if (finished) {
    const [existingCert] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.userId, userId), eq(certificates.courseId, lesson.courseId)))
      .limit(1);
    if (existingCert) {
      certificate = existingCert;
    } else {
      const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const [created] = await db
        .insert(certificates)
        .values({ userId, courseId: lesson.courseId, code: certificateCode(userId, lesson.courseId), grade: percent })
        .returning();
      certificate = created;
      await audit("certificate.issued", { userId, entity: "course", entityId: lesson.courseId, meta: { student: me?.fullName } });
    }
  }

  return Response.json({
    ok: true,
    message: finished ? "مبروك! أكملت الكورس وصدرت شهادتك" : "تم حفظ تقدمك في الدرس",
    data: { percent, completedLessons: doneLessons, totalLessons, finished, certificate },
  });
}
