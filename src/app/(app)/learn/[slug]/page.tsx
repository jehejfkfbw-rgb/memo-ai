import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { enrollments, quizAttempts } from "@/db/schema";
import { getCompletedLessonIds, getCourseBySlug, getCourseCurriculum } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui";
import { CourseActions } from "@/components/course-actions";
import {
  IconBookOpen, IconCertificate, IconCheckCircle, IconChevronLeft, IconClock,
  IconFile, IconLock, IconPlay, IconQuiz, IconTarget,
} from "@/components/icons";
import { cn, formatDuration, LEVEL_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getCourseBySlug(slug);
  return { title: found ? `تعلّم: ${found.course.title}` : "الكورس غير موجود" };
}

const LESSON_ICON: Record<string, typeof IconPlay> = { video: IconPlay, article: IconBookOpen, quiz: IconQuiz, attachment: IconFile };

export default async function LearnCoursePage({ params }: Props) {
  const { slug } = await params;
  const user = (await getCurrentUser())!;
  const found = await getCourseBySlug(slug);
  if (!found) notFound();
  const { course, stage, subject } = found;

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, course.id)))
    .limit(1);

  const { lessons, quizzes } = await getCourseCurriculum(course.id);
  const completed = await getCompletedLessonIds(course.id, user.id);

  const bestAttempts = quizzes.length
    ? await db
        .select({ quizId: quizAttempts.quizId, percent: quizAttempts.percent, passed: quizAttempts.passed })
        .from(quizAttempts)
        .where(eq(quizAttempts.userId, user.id))
        .orderBy(desc(quizAttempts.percent))
    : [];
  const bestByQuiz = new Map<string, { percent: number; passed: boolean }>();
  bestAttempts.forEach((a) => {
    if (!bestByQuiz.has(a.quizId)) bestByQuiz.set(a.quizId, { percent: a.percent, passed: a.passed });
  });

  if (!enrollment) {
    return (
      <div className="space-y-6">
        <Link href="/my-courses" className="inline-flex items-center gap-2 text-sm font-bold text-mist-600 transition hover:text-navy-700">
          <IconChevronLeft className="h-4 w-4" />
          العودة إلى كورساتي
        </Link>
        <Card className="p-8 text-center">
          <h1 className="font-display text-xl font-extrabold text-navy-800">{course.title}</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-8 text-mist-600">{course.summary}</p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-2.5 text-sm font-bold text-warning">
            <IconLock className="h-4 w-4" />
            سجّل في الكورس لفتح الدروس والاختبارات
          </p>
          <div className="mx-auto mt-5 max-w-xs">
            <CourseActions
              courseId={course.id}
              courseSlug={course.slug}
              isEnrolled={false}
              progress={0}
              isLoggedIn
              isFree={course.isFree}
            />
          </div>
        </Card>
      </div>
    );
  }

  const nextLesson = lessons.find((l) => !completed.has(l.id)) ?? lessons[0];
  const progress = lessons.length ? Math.round((completed.size / lessons.length) * 100) : enrollment.progressPercent;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-xs font-semibold text-mist-500" aria-label="مسار التنقل">
        <Link href="/my-courses" className="transition hover:text-navy-700">كورساتي</Link>
        <IconChevronLeft className="h-3.5 w-3.5" />
        <span className="text-navy-700">{course.title}</span>
      </nav>

      <Card className="relative overflow-hidden p-0">
        <div className="relative bg-navy-900 px-6 py-7">
          <div className="grid-paper absolute inset-0 opacity-50" />
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/10 text-gold-300">{stage.name}</Badge>
                {subject && <Badge className="bg-white/10 text-white/80">{subject.name}</Badge>}
                <Badge tone="gold">{LEVEL_LABEL[course.level]}</Badge>
              </div>
              <h1 className="mt-3 font-display text-[1.5rem] font-extrabold leading-tight text-white">{course.title}</h1>
              <p className="mt-2 max-w-xl text-sm leading-7 text-mist-300">{course.summary}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-mist-400">
                <span className="inline-flex items-center gap-1.5"><IconBookOpen className="h-4 w-4 text-gold-400" />{lessons.length} درس</span>
                <span className="inline-flex items-center gap-1.5"><IconQuiz className="h-4 w-4 text-gold-400" />{quizzes.length} اختبار</span>
                <span className="inline-flex items-center gap-1.5"><IconClock className="h-4 w-4 text-gold-400" />{formatDuration(course.durationMinutes)}</span>
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-mist-300">
                  <span>نسبة الإنجاز</span>
                  <span className="tabular-nums text-gold-300">{progress}٪</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gold-400 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2.5 text-[0.7rem] text-mist-400">{completed.size} من {lessons.length} درس مكتمل</p>
                {nextLesson && (
                  <Link href={`/learn/${course.slug}/${nextLesson.id}`} className="btn btn-gold btn-sm mt-3 w-full">
                    <IconPlay className="h-3.5 w-3.5" />
                    {completed.size === 0 ? "ابدأ الدرس الأول" : "واصل الدرس التالي"}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="mb-4 font-display text-base font-extrabold text-navy-800">محتوى الكورس</h2>
          {lessons.length === 0 ? (
            <EmptyState title="لا دروس منشورة بعد" description="سيظهر محتوى الكورس هنا فور نشره من لوحة الإدارة." />
          ) : (
            <ol className="space-y-2.5">
              {lessons.map((lesson, i) => {
                const done = completed.has(lesson.id);
                const Icon = LESSON_ICON[lesson.type] ?? IconBookOpen;
                return (
                  <li key={lesson.id}>
                    <Link
                      href={`/learn/${course.slug}/${lesson.id}`}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-navy-300 hover:shadow-card",
                        done ? "border-success/30" : "border-mist-200",
                      )}
                    >
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold", done ? "bg-success-soft text-success" : "bg-navy-100 text-navy-700")}>
                        {done ? <IconCheckCircle className="h-5 w-5" /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-navy-800">{lesson.title}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-mist-500">
                          <Icon className="h-3.5 w-3.5" />
                          {lesson.durationMinutes} دقيقة
                          {lesson.isFreePreview && <Badge tone="success">معاينة</Badge>}
                        </p>
                      </div>
                      <IconChevronLeft className="h-4 w-4 shrink-0 text-mist-400" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
              <IconTarget className="h-4.5 w-4.5 text-gold-600" />
              اختبارات الكورس
            </h2>
            {quizzes.length ? (
              <ul className="mt-4 space-y-2.5">
                {quizzes.map((quiz) => {
                  const best = bestByQuiz.get(quiz.id);
                  return (
                    <li key={quiz.id} className="rounded-xl border border-mist-200 p-3.5">
                      <p className="truncate text-sm font-bold text-navy-800">{quiz.title}</p>
                      <p className="mt-1 text-xs font-semibold text-mist-500">
                        {quiz.questionCount} سؤال · {quiz.timeLimitMinutes} دقيقة · النجاح {quiz.passingPercent}٪
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        {best ? (
                          <Badge tone={best.passed ? "success" : "danger"}>أفضل درجة {best.percent}٪</Badge>
                        ) : (
                          <Badge tone="muted">لم يُؤدَّ بعد</Badge>
                        )}
                        <Link href={`/quiz/${quiz.id}`} className="btn btn-outline btn-sm">
                          {best ? "إعادة المحاولة" : "ابدأ"}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-mist-500">لا اختبارات مرتبطة بهذا الكورس.</p>
            )}
          </Card>

          {(course.learningOutcomes ?? []).length > 0 && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-extrabold text-navy-800">أهداف التعلّم</h2>
              <ul className="mt-3 space-y-2">
                {(course.learningOutcomes ?? []).map((o) => (
                  <li key={o} className="flex items-start gap-2 text-[0.82rem] leading-7 text-mist-700">
                    <IconCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />
                    {o}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {progress >= 100 && (
            <Card className="border-success/30 bg-success-soft p-5">
              <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-success">
                <IconCertificate className="h-4.5 w-4.5" />
                أكملت الكورس!
              </h2>
              <p className="mt-2 text-[0.82rem] leading-7 text-mist-700">صدرت شهادتك تلقائيًا ويمكنك تحميلها أو مشاركة رمزها.</p>
              <Link href="/certificates" className="btn btn-primary btn-sm mt-3">عرض الشهادة</Link>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-display text-sm font-extrabold text-navy-800">روابط مفيدة</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><Link href={`/courses/${course.slug}`} className="font-semibold text-navy-600 transition hover:text-gold-600">صفحة الكورس العامة</Link></li>
              <li><Link href="/grades" className="font-semibold text-navy-600 transition hover:text-gold-600">سجلّ درجاتي</Link></li>
              <li><Link href="/my-courses" className="font-semibold text-navy-600 transition hover:text-gold-600">كل كورساتي</Link></li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
