import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, questions, quizAttempts, quizzes } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Card, EmptyState } from "@/components/ui";
import { QuizRunner } from "@/components/quiz-runner";
import { IconChevronLeft, IconLock, IconQuiz } from "@/components/icons";
import { isUuid } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [row] = isUuid(id)
    ? await db.select({ title: quizzes.title }).from(quizzes).where(eq(quizzes.id, id)).limit(1)
    : [];
  return { title: row ? `اختبار: ${row.title}` : "الاختبار غير موجود" };
}

export default async function QuizPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/quiz/${id}`);

  if (!isUuid(id)) notFound();
  const [quiz] = await db.select().from(quizzes).where(and(eq(quizzes.id, id), eq(quizzes.isPublished, true))).limit(1);
  if (!quiz) notFound();

  let course: { id: string; title: string; slug: string } | null = null;
  if (quiz.courseId) {
    const [c] = await db
      .select({ id: courses.id, title: courses.title, slug: courses.slug })
      .from(courses)
      .where(eq(courses.id, quiz.courseId))
      .limit(1);
    course = c ?? null;

    const [enrollment] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, quiz.courseId)))
      .limit(1);

    if (!enrollment) {
      return (
        <Card className="mx-auto max-w-xl p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
            <IconLock className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-lg font-extrabold text-navy-800">الاختبار مقصور على المسجّلين</h1>
          <p className="mt-2 text-sm leading-8 text-mist-600">
            سجّل في «{course?.title ?? "الكورس"}» أولًا لتتمكن من أداء «{quiz.title}».
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {course && <Link href={`/courses/${course.slug}`} className="btn btn-primary btn-sm">اذهب لصفحة الكورس</Link>}
            <Link href="/my-courses" className="btn btn-outline btn-sm">كورساتي</Link>
          </div>
        </Card>
      );
    }
  }

  const questionRows = await db
    .select({ id: questions.id, type: questions.type, text: questions.text, options: questions.options, points: questions.points, sortOrder: questions.sortOrder })
    .from(questions)
    .where(eq(questions.quizId, quiz.id))
    .orderBy(questions.sortOrder);

  if (!questionRows.length) {
    return (
      <EmptyState
        icon={<IconQuiz className="h-6 w-6" />}
        title="لا توجد أسئلة في هذا الاختبار"
        description="يعمل فريق المحتوى على إضافة الأسئلة. يمكنك العودة لاحقًا أو تصفّح كورس آخر."
        action={<Link href="/my-courses" className="btn btn-primary btn-sm">كورساتي</Link>}
      />
    );
  }

  const [attemptsRow] = await db
    .select({ value: count() })
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.userId, user.id)));

  const history = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.quizId, quiz.id), eq(quizAttempts.userId, user.id)))
    .orderBy(desc(quizAttempts.submittedAt));

  const bestPercent = history.reduce((m, h) => Math.max(m, h.percent), 0);
  const used = attemptsRow?.value ?? 0;

  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-mist-500" aria-label="مسار التنقل">
        <Link href="/dashboard" className="transition hover:text-navy-700">لوحة التقدم</Link>
        <IconChevronLeft className="h-3.5 w-3.5" />
        {course && (
          <>
            <Link href={`/learn/${course.slug}`} className="transition hover:text-navy-700">{course.title}</Link>
            <IconChevronLeft className="h-3.5 w-3.5" />
          </>
        )}
        <span className="text-navy-700">{quiz.title}</span>
      </nav>

      <QuizRunner
        quiz={{
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          timeLimitMinutes: quiz.timeLimitMinutes,
          passingPercent: quiz.passingPercent,
          attemptsAllowed: quiz.attemptsAllowed,
        }}
        questions={questionRows.map((q, i) => ({
          id: q.id,
          type: q.type as "single" | "multiple" | "truefalse",
          text: q.text,
          options: q.options ?? [],
          points: q.points,
          index: i + 1,
        }))}
        course={course}
        attemptsLeft={Math.max(0, quiz.attemptsAllowed - used)}
        bestPercent={bestPercent}
        totalPoints={questionRows.reduce((s, q) => s + q.points, 0)}
      />
    </div>
  );
}
