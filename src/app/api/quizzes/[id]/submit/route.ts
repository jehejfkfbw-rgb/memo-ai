import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { courses, enrollments, questions, quizAttempts, quizzes } from "@/db/schema";
import { ApiError, audit, requireUser } from "@/lib/auth";
import { readJson, safeRoute } from "@/lib/http";
import { isUuid } from "@/lib/utils";

export const dynamic = "force-dynamic";

const submitSchema = z.object({
  answers: z.record(z.string(), z.array(z.number().int().min(0)).max(12)).refine((v) => Object.keys(v).length > 0, "لم يتم إرسال أي إجابة"),
  startedAt: z.string().datetime({ offset: true }).optional(),
  durationSeconds: z.number().int().min(0).max(7200).optional(),
});

/** تصحيح الاختبار يتم في الخادم دائمًا — لا تصل الإجابات الصحيحة إلى المتصفح قبل التسليم */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return safeRoute(async () => {
    const user = await requireUser();
    const body = submitSchema.parse(await readJson(req));
    if (!isUuid(id)) throw new ApiError(404, "الاختبار غير متاح");

    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
    if (!quiz || !quiz.isPublished) throw new ApiError(404, "الاختبار غير متاح");

    if (quiz.courseId) {
      const [enrollment] = await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, quiz.courseId)))
        .limit(1);
      if (!enrollment) throw new ApiError(403, "يجب التسجيل في الكورس أولًا");
    }

    const [attemptsRow] = await db
      .select({ value: count() })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.userId, user.id)));
    if ((attemptsRow?.value ?? 0) >= quiz.attemptsAllowed) {
      throw new ApiError(429, "استنفدت عدد المحاولات المسموح لهذا الاختبار");
    }

    const qs = await db.select().from(questions).where(eq(questions.quizId, quiz.id));
    if (!qs.length) throw new ApiError(422, "لا توجد أسئلة في هذا الاختبار");

    let score = 0;
    let totalPoints = 0;
    const review: Array<{
      id: string;
      text: string;
      type: string;
      options: string[];
      yourAnswer: number[];
      correct: number[];
      points: number;
      earned: number;
      isCorrect: boolean;
      explanation: string | null;
    }> = [];

    for (const q of qs) {
      const correct = [...(q.correctIndexes ?? [])].sort((a, b) => a - b);
      const given = [...(body.answers[q.id] ?? [])].sort((a, b) => a - b);
      const isCorrect = correct.length > 0 && correct.length === given.length && correct.every((v, i) => v === given[i]);
      const earned = isCorrect ? q.points : 0;
      score += earned;
      totalPoints += q.points;
      review.push({
        id: q.id,
        text: q.text,
        type: q.type,
        options: q.options ?? [],
        yourAnswer: given,
        correct,
        points: q.points,
        earned,
        isCorrect,
        explanation: quiz.showExplanations ? q.explanation : null,
      });
    }

    const percent = totalPoints ? Math.round((score / totalPoints) * 100) : 0;
    const passed = percent >= quiz.passingPercent;

    const [attempt] = await db
      .insert(quizAttempts)
      .values({
        quizId: quiz.id,
        userId: user.id,
        score,
        totalPoints,
        percent,
        passed,
        answers: body.answers,
        durationSeconds: body.durationSeconds ?? 0,
        startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
        submittedAt: new Date(),
      })
      .returning();

    let courseTitle: string | null = null;
    if (quiz.courseId) {
      const [c] = await db.select({ title: courses.title }).from(courses).where(eq(courses.id, quiz.courseId)).limit(1);
      courseTitle = c?.title ?? null;
    }
    await audit("quiz.submitted", {
      userId: user.id,
      entity: "quiz",
      entityId: quiz.id,
      meta: { percent, passed, attemptId: attempt.id },
    });

    const previousBest = await db
      .select({ percent: quizAttempts.percent })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.userId, user.id)))
      .orderBy(desc(quizAttempts.percent))
      .limit(1);

    return Response.json({
      ok: true,
      message: passed ? `أحسنت! نجحت في الاختبار بدرجة ${percent}٪` : `درجتك ${percent}٪ — درجة النجاح ${quiz.passingPercent}٪`,
      data: {
        attempt: { id: attempt.id, score, totalPoints, percent, passed, submittedAt: attempt.submittedAt },
        review,
        showExplanations: quiz.showExplanations,
        bestPercent: previousBest[0]?.percent ?? percent,
        attemptsLeft: Math.max(0, quiz.attemptsAllowed - ((attemptsRow?.value ?? 0) + 1)),
        courseTitle,
      },
    });
  });
}
