import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { enrollments, lessons } from "@/db/schema";
import { getCompletedLessonIds, getCourseBySlug } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { Badge, Card } from "@/components/ui";
import { LessonPlayer } from "@/components/lesson-player";
import {
  IconBookOpen, IconCheckCircle, IconChevronLeft, IconClock, IconFile, IconLock, IconPlay, IconQuiz,
} from "@/components/icons";
import { cn, isUuid } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; lessonId: string }> };

const LESSON_ICON: Record<string, typeof IconPlay> = { video: IconPlay, article: IconBookOpen, quiz: IconQuiz, attachment: IconFile };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lessonId } = await params;
  const [row] = isUuid(lessonId)
    ? await db.select({ title: lessons.title }).from(lessons).where(eq(lessons.id, lessonId)).limit(1)
    : [];
  return { title: row ? row.title : "الدرس غير موجود" };
}

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params;
  const user = (await getCurrentUser())!;

  const found = await getCourseBySlug(slug);
  if (!found) notFound();
  const { course, stage } = found;

  if (!isUuid(lessonId)) notFound();

  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, lessonId), eq(lessons.courseId, course.id), eq(lessons.isPublished, true)))
    .limit(1);
  if (!lesson) notFound();

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, course.id)))
    .limit(1);

  const canAccess = Boolean(enrollment) || lesson.isFreePreview;

  const allLessons = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.courseId, course.id), eq(lessons.isPublished, true)))
    .orderBy(asc(lessons.sortOrder), asc(lessons.createdAt));

  if (!canAccess) {
    return (
      <Card className="p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <IconLock className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-lg font-extrabold text-navy-800">هذا الدرس متاح للمسجّلين فقط</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-8 text-mist-600">
          سجّل في «{course.title}» لفتح كل الدروس والاختبارات ومتابعة تقدمك.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Link href={`/courses/${course.slug}`} className="btn btn-primary btn-sm">اذهب لصفحة الكورس</Link>
          <Link href="/my-courses" className="btn btn-outline btn-sm">كورساتي</Link>
        </div>
      </Card>
    );
  }

  const completed = await getCompletedLessonIds(course.id, user.id);
  const index = allLessons.findIndex((l) => l.id === lesson.id);
  const prev = index > 0 ? allLessons[index - 1] : null;
  const next = index >= 0 && index < allLessons.length - 1 ? allLessons[index + 1] : null;
  const done = completed.has(lesson.id);

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-mist-500" aria-label="مسار التنقل">
        <Link href="/my-courses" className="transition hover:text-navy-700">كورساتي</Link>
        <IconChevronLeft className="h-3.5 w-3.5" />
        <Link href={`/learn/${course.slug}`} className="transition hover:text-navy-700">{course.title}</Link>
        <IconChevronLeft className="h-3.5 w-3.5" />
        <span className="text-navy-700">الدرس {index + 1}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <div className="min-w-0 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="navy">{stage.name}</Badge>
              <Badge tone="muted">درس {index + 1} من {allLessons.length}</Badge>
              <Badge tone="gold">
                <IconClock className="h-3.5 w-3.5" />
                {lesson.durationMinutes} دقيقة
              </Badge>
              {done && <Badge tone="success"><IconCheckCircle className="h-3.5 w-3.5" /> مكتمل</Badge>}
            </div>
            <h1 className="mt-3 font-display text-[1.5rem] font-extrabold leading-tight text-navy-800">{lesson.title}</h1>
            {lesson.summary && <p className="mt-2 text-sm leading-7 text-mist-600">{lesson.summary}</p>}
          </div>

          <LessonPlayer
            lesson={{
              id: lesson.id,
              title: lesson.title,
              type: lesson.type,
              content: lesson.content,
              videoUrl: lesson.videoUrl,
              attachmentUrl: lesson.attachmentUrl,
              durationMinutes: lesson.durationMinutes,
            }}
            alreadyCompleted={done}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            {prev ? (
              <Link href={`/learn/${course.slug}/${prev.id}`} className="btn btn-outline">
                <span className="rotate-180"><IconChevronLeft className="h-4 w-4" /></span>
                الدرس السابق
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/learn/${course.slug}/${next.id}`} className="btn btn-primary">
                الدرس التالي
                <IconChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <Link href={`/learn/${course.slug}`} className="btn btn-gold">
                العودة لمنهج الكورس
              </Link>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-extrabold text-navy-800">دروس الكورس</h2>
              <span className="text-xs font-bold tabular-nums text-mist-500">{completed.size}/{allLessons.length}</span>
            </div>
            <ol className="space-y-1.5">
              {allLessons.map((l, i) => {
                const Icon = LESSON_ICON[l.type] ?? IconBookOpen;
                const isCurrent = l.id === lesson.id;
                const isDone = completed.has(l.id);
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${course.slug}/${l.id}`}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition",
                        isCurrent ? "bg-navy-700 text-white shadow-card" : "text-mist-700 hover:bg-navy-50",
                      )}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.7rem] font-extrabold", isCurrent ? "bg-white/15 text-gold-300" : isDone ? "bg-success-soft text-success" : "bg-mist-100 text-mist-500")}>
                        {isDone && !isCurrent ? <IconCheckCircle className="h-4 w-4" /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">{l.title}</span>
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", isCurrent ? "text-gold-300" : "text-mist-400")} />
                    </Link>
                  </li>
                );
              })}
            </ol>
            <Link href={`/learn/${course.slug}`} className="btn btn-ghost btn-sm mt-4 w-full">عرض صفحة الكورس</Link>
          </Card>

          {enrollment && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-extrabold text-navy-800">تقدمك في الكورس</h2>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-mist-200">
                <div className="h-full rounded-full bg-navy-600 transition-all" style={{ width: `${enrollment.progressPercent}%` }} />
              </div>
              <p className="mt-2 text-xs font-bold text-mist-600 tabular-nums">{enrollment.progressPercent}٪ مكتمل</p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
