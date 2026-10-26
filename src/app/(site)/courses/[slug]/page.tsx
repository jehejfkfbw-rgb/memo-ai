import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { enrollments } from "@/db/schema";
import { getCourseBySlug, getCourseCurriculum, getCourseReviews, relatedCourses } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { CourseCover } from "@/components/course-cover";
import { CourseActions } from "@/components/course-actions";
import { CourseCard } from "@/components/course-card";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui";
import {
  IconBookOpen, IconCheckCircle, IconChevronLeft, IconClock, IconFile, IconLayers,
  IconPlay, IconQuiz, IconStar, IconTarget, IconUsers,
} from "@/components/icons";
import { formatDuration, LEVEL_LABEL, percentOf } from "@/lib/utils";
import { cookies } from "next/headers";
import { COUNTRY_COOKIE, formatPrice, getCountry } from "@/lib/countries";
import { CountryFlag } from "@/components/country-flag";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getCourseBySlug(slug);
  if (!found) return { title: "الكورس غير موجود" };
  return { title: found.course.title, description: found.course.summary ?? undefined };
}

const LESSON_ICON: Record<string, typeof IconPlay> = { video: IconPlay, article: IconBookOpen, quiz: IconQuiz, attachment: IconFile };

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const found = await getCourseBySlug(slug);
  if (!found) notFound();

  const { course, stage, subject, teacher } = found;
  const user = await getCurrentUser();
  const store = await cookies();
  const country = getCountry(user?.country ?? store.get(COUNTRY_COOKIE)?.value);
  const [{ lessons, quizzes }, reviews, related] = await Promise.all([
    getCourseCurriculum(course.id, user?.role === "admin" || user?.role === "teacher"),
    getCourseReviews(course.id),
    relatedCourses(course.id, course.stageId, course.subjectId, 3),
  ]);

  let enrollment = null;
  if (user) {
    const [row] = await db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, course.id)))
      .limit(1);
    enrollment = row ?? null;
  }

  const completedLessons = enrollment ? 0 : 0;
  void completedLessons;
  const progress = enrollment?.progressPercent ?? 0;
  const rating = course.ratingCount ? Number((course.ratingSum / course.ratingCount).toFixed(1)) : 0;
  const outcomes = (course.learningOutcomes ?? []) as string[];
  const requirements = (course.requirements ?? []) as string[];

  return (
    <div className="bg-mist-50 pb-16">
      {/* رأس الكورس */}
      <div className="relative overflow-hidden bg-navy-900">
        <div className="grid-paper absolute inset-0 opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-mist-400" aria-label="مسار التنقل">
            <Link href="/" className="transition hover:text-white">الرئيسية</Link>
            <IconChevronLeft className="h-3.5 w-3.5" />
            <Link href="/courses" className="transition hover:text-white">الكورسات</Link>
            <IconChevronLeft className="h-3.5 w-3.5" />
            <span className="text-gold-300">{stage.name}</span>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/10 text-gold-300">{stage.name}</Badge>
                {subject && <Badge className="bg-white/10 text-white/80">{subject.name}</Badge>}
                <Badge tone="gold">{LEVEL_LABEL[course.level]}</Badge>
                {course.isFeatured && <Badge className="bg-gold-500 text-navy-900">مميّز</Badge>}
              </div>
              <h1 className="mt-4 font-display text-[1.75rem] font-extrabold leading-tight text-white sm:text-[2.2rem]">{course.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-8 text-mist-300">{course.summary}</p>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold text-mist-300">
                {teacher && (
                  <span className="inline-flex items-center gap-2">
                    <Avatar name={teacher.fullName} src={teacher.avatarUrl} size={30} />
                    {teacher.fullName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5"><IconLayers className="h-4 w-4 text-gold-400" />{lessons.length} درس</span>
                <span className="inline-flex items-center gap-1.5"><IconClock className="h-4 w-4 text-gold-400" />{formatDuration(course.durationMinutes)}</span>
                <span className="inline-flex items-center gap-1.5"><IconQuiz className="h-4 w-4 text-gold-400" />{quizzes.length} اختبار</span>
                {rating > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-gold-300">
                    <IconStar className="h-4 w-4 fill-gold-400 stroke-gold-400" />{rating.toFixed(1)} ({course.ratingCount})
                  </span>
                )}
              </div>
            </div>

            <Card className="overflow-hidden p-0 lg:sticky lg:top-24 lg:self-start">
              <CourseCover seed={course.slug} accent={stage.accent} className="h-32" />
              <div className="p-5">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold text-mist-500">سعر الاشتراك</p>
                    <p className="font-display text-2xl font-extrabold text-navy-800">
                      {formatPrice(course.price, country.code)}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-[0.68rem] font-bold text-mist-500">
                      <CountryFlag code={country.code} className="h-3 w-4.5" />
                      السعر بعملة {country.nameAr} ({country.currency})
                    </p>
                  </div>
                  {enrollment && <Badge tone="success">مسجّل</Badge>}
                </div>
                <CourseActions
                  courseId={course.id}
                  courseSlug={course.slug}
                  isEnrolled={Boolean(enrollment)}
                  progress={progress}
                  isLoggedIn={Boolean(user)}
                  isFree={course.isFree}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.6fr_1fr] lg:px-8">
        <div className="space-y-6">
          {/* الوصف */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-extrabold text-navy-800">وصف الكورس</h2>
            <div className="prose-ar mt-3">
              {(course.description ?? course.summary ?? "").split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </Card>

          {/* المنهج */}
          <Card className="p-6" >
            <div id="curriculum" className="scroll-mt-24" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold text-navy-800">منهج الكورس</h2>
              <span className="text-xs font-bold text-mist-500">{lessons.length + quizzes.length} عنصر</span>
            </div>

            {lessons.length === 0 && quizzes.length === 0 ? (
              <EmptyState title="لم يُضف محتوى بعد" description="يعمل فريق نبراس على تجهيز دروس هذا الكورس." />
            ) : (
              <ol className="space-y-2.5">
                {lessons.map((lesson, i) => {
                  const Icon = LESSON_ICON[lesson.type] ?? IconBookOpen;
                  const href = enrollment || lesson.isFreePreview ? `/learn/${course.slug}/${lesson.id}` : null;
                  return (
                    <li key={lesson.id}>
                      {href ? (
                        <Link href={href} className="flex items-center gap-3 rounded-xl border border-mist-200 bg-white p-3.5 transition hover:border-navy-300 hover:bg-navy-50">
                          <LessonRow index={i + 1} Icon={Icon} lesson={lesson} />
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl border border-mist-200 bg-mist-50 p-3.5 opacity-80">
                          <LessonRow index={i + 1} Icon={Icon} lesson={lesson} locked />
                        </div>
                      )}
                    </li>
                  );
                })}
                {quizzes.map((quiz, i) => (
                  <li key={quiz.id}>
                    {enrollment ? (
                      <Link href={`/quiz/${quiz.id}`} className="flex items-center gap-3 rounded-xl border border-gold-200 bg-gold-50 p-3.5 transition hover:border-gold-400">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-500 text-navy-900">
                          <IconQuiz className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-navy-800">{quiz.title}</p>
                          <p className="mt-0.5 text-xs font-semibold text-mist-500">
                            {quiz.questionCount} سؤال · {quiz.timeLimitMinutes} دقيقة · درجة النجاح {quiz.passingPercent}٪
                          </p>
                        </div>
                        <Badge tone="gold">اختبار {i + 1}</Badge>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl border border-mist-200 bg-mist-50 p-3.5 opacity-75">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mist-200 text-mist-500">
                          <IconQuiz className="h-4.5 w-4.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-navy-800">{quiz.title}</p>
                          <p className="mt-0.5 text-xs font-semibold text-mist-500">متاح بعد التسجيل في الكورس</p>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </Card>

          {/* آراء المتعلمين */}
          <Card className="p-6">
            <h2 className="font-display text-lg font-extrabold text-navy-800">من داخل الكورس</h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm leading-7 text-mist-600">
                لم يسجّل الطلاب ملاحظاتهم على هذا الكورس بعد. بعد إتمامك للكورس سيظهر تقييمك هنا.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {reviews.map((r) => (
                  <li key={r.id} className="rounded-xl border border-mist-200 bg-mist-50 p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.name} src={r.avatarUrl} size={34} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-navy-800">{r.name}</p>
                        <p className="flex items-center gap-1 text-[0.7rem] font-bold text-gold-600">
                          <IconStar className="h-3.5 w-3.5 fill-gold-400 stroke-gold-500" />
                          {r.rating > 0 ? `${r.rating}/٥` : "طالب مسجّل"}
                        </p>
                      </div>
                    </div>
                    {r.comment && <p className="mt-2.5 text-[0.82rem] leading-7 text-mist-600">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-6">
          {outcomes.length > 0 && (
            <Card className="p-6">
              <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-navy-800">
                <IconTarget className="h-5 w-5 text-gold-600" />
                ماذا ستتعلّم؟
              </h2>
              <ul className="mt-4 space-y-2.5">
                {outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-2.5 text-[0.85rem] leading-7 text-mist-700">
                    <IconCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />
                    {o}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {requirements.length > 0 && (
            <Card className="p-6">
              <h2 className="font-display text-base font-extrabold text-navy-800">المتطلبات</h2>
              <ul className="mt-4 space-y-2.5">
                {requirements.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[0.85rem] leading-7 text-mist-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-display text-base font-extrabold text-navy-800">هذا الكورس يشمل</h2>
            <ul className="mt-4 space-y-3 text-sm text-mist-700">
              <li className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><IconLayers className="h-4 w-4 text-navy-500" />عدد الدروس</span><b className="tabular-nums">{lessons.length}</b></li>
              <li className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><IconQuiz className="h-4 w-4 text-navy-500" />الاختبارات</span><b className="tabular-nums">{quizzes.length}</b></li>
              <li className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><IconClock className="h-4 w-4 text-navy-500" />المدة الإجمالية</span><b>{formatDuration(course.durationMinutes)}</b></li>
              <li className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><IconUsers className="h-4 w-4 text-navy-500" />المستوى</span><b>{LEVEL_LABEL[course.level]}</b></li>
              <li className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><IconCheckCircle className="h-4 w-4 text-navy-500" />شهادة إتمام</span><b className="text-success">نعم</b></li>
            </ul>
            {enrollment && (
              <div className="mt-5 rounded-xl bg-mist-50 p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-mist-600">
                  <span>نسبة الإنجاز</span><span className="tabular-nums text-navy-700">{progress}٪</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-mist-200">
                  <div className="h-full rounded-full bg-navy-600" style={{ width: `${percentOf(progress, 100)}%` }} />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-5 font-display text-lg font-extrabold text-navy-800">كورسات مشابهة في {stage.name}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <CourseCard
                key={r.id}
                course={{ id: r.id, title: r.title, slug: r.slug, summary: null, level: r.level, durationMinutes: r.durationMinutes, ratingSum: 0, ratingCount: 0, stage }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LessonRow({ index, Icon, lesson, locked = false }: { index: number; Icon: typeof IconPlay; lesson: { title: string; durationMinutes: number; isFreePreview: boolean; type: string }; locked?: boolean }) {
  return (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${locked ? "bg-mist-200 text-mist-500" : "bg-navy-100 text-navy-700"}`}>
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-navy-800">{lesson.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-mist-500">
          <Icon className="h-3.5 w-3.5" />
          {lesson.durationMinutes} دقيقة
        </p>
      </div>
      {lesson.isFreePreview ? <Badge tone="success">معاينة مجانية</Badge> : locked ? <Badge tone="muted">بعد التسجيل</Badge> : <Badge tone="navy">متاح</Badge>}
    </>
  );
}
