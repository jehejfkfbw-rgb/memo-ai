import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, lessons, questions, quizAttempts, quizzes } from "@/db/schema";
import { ApiError, requireUser } from "@/lib/auth";
import { safeRoute } from "@/lib/http";
import { isUuid } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** بيانات الاختبار للطالب — تُحجب الإجابات الصحيحة حتى التسليم */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  return safeRoute(async () => {
    const user = await requireUser();
    if (!isUuid(id)) throw new ApiError(404, "الاختبار غير متاح");

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    if (!quiz || !quiz.isPublished) throw new ApiError(404, "الاختبار غير متاح");

    let course: { id: string; title: string; slug: string } | null = null;
    if (quiz.courseId) {
      const [c] = await db
        .select({ id: courses.id, title: courses.title, slug: courses.slug })
        .from(courses)
        .where(eq(courses.id, quiz.courseId))
        .limit(1);
      course = c ?? null;

      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, quiz.courseId)))
        .limit(1);
      if (!enrollment) throw new ApiError(403, "سجّل في الكورس أولًا لأداء الاختبار");
    }

    const qs = await db
      .select({
        id: questions.id,
        type: questions.type,
        text: questions.text,
        options: questions.options,
        points: questions.points,
        sortOrder: questions.sortOrder,
      })
      .from(questions)
      .where(eq(questions.quizId, quiz.id))
      .orderBy(questions.sortOrder);

    if (!qs.length) throw new ApiError(422, "لا يحتوي هذا الاختبار على أسئلة بعد");

    const [attemptsRow] = await db
      .select({ value: count() })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.userId, user.id)));
    const used = attemptsRow?.value ?? 0;

    const history = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.userId, user.id)))
      .orderBy(desc(quizAttempts.submittedAt))
      .limit(10);

    const lesson = quiz.lessonId
      ? (await db
          .select({ id: lessons.id, title: lessons.title, courseId: lessons.courseId })
          .from(lessons)
          .where(eq(lessons.id, quiz.lessonId))
          .limit(1))[0] ?? null
      : null;

    return Response.json({
      ok: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          timeLimitMinutes: quiz.timeLimitMinutes,
          passingPercent: quiz.passingPercent,
          attemptsAllowed: quiz.attemptsAllowed,
          showExplanations: quiz.showExplanations,
          courseId: quiz.courseId,
        },
        course,
        lesson,
        questions: qs.map((q, i) => ({ ...q, index: i + 1 })),
        totalPoints: qs.reduce((s, q) => s + q.points, 0),
        attemptsUsed: used,
        attemptsLeft: Math.max(0, quiz.attemptsAllowed - used),
        bestPercent: history.reduce((m, h) => Math.max(m, h.percent), 0),
        history,
      },
    });
  });
}
