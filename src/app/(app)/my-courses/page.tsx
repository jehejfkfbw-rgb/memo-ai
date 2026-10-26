import type { Metadata } from "next";
import Link from "next/link";
import { getUserCourses } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui";
import { CourseCover } from "@/components/course-cover";
import { UnenrollButton } from "@/components/course-row-actions";
import { IconBookOpen, IconClock, IconLayers, IconPlay, IconQuiz } from "@/components/icons";
import { cn, formatDate, formatDuration, LEVEL_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "كورساتي" };

const FILTERS = [
  { key: "all", label: "الكل" },
  { key: "in_progress", label: "قيد التقدّم" },
  { key: "completed", label: "مكتملة" },
  { key: "not_started", label: "لم تبدأ" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default async function MyCoursesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = (await getCurrentUser())!;
  const sp = await searchParams;
  const filter = (FILTERS.find((f) => f.key === sp.filter)?.key ?? "all") as FilterKey;
  const all = await getUserCourses(user.id);

  const items = all.filter((c) => {
    if (filter === "all") return true;
    if (filter === "completed") return c.progress >= 100;
    if (filter === "in_progress") return c.progress > 0 && c.progress < 100;
    return c.progress === 0;
  });

  const counts = {
    all: all.length,
    in_progress: all.filter((c) => c.progress > 0 && c.progress < 100).length,
    completed: all.filter((c) => c.progress >= 100).length,
    not_started: all.filter((c) => c.progress === 0).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">كورساتي</h1>
          <p className="mt-1.5 text-sm text-mist-600">كل الكورسات التي سجّلت فيها مع نسبة إنجاز كل واحد منها.</p>
        </div>
        <Link href="/courses" className="btn btn-primary btn-sm">
          <IconLayers className="h-4 w-4" />
          إضافة كورس جديد
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-mist-200 bg-white p-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/my-courses" : `/my-courses?filter=${f.key}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition",
              filter === f.key ? "bg-navy-700 text-white shadow-card" : "text-mist-600 hover:bg-navy-50 hover:text-navy-800",
            )}
            aria-current={filter === f.key ? "page" : undefined}
          >
            {f.label}
            <span className={cn("rounded-full px-1.5 text-[0.68rem] tabular-nums", filter === f.key ? "bg-white/20" : "bg-mist-100 text-mist-600")}>
              {counts[f.key]}
            </span>
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<IconBookOpen className="h-6 w-6" />}
          title={filter === "all" ? "لم تسجّل في أي كورس بعد" : "لا نتائج في هذا التصنيف"}
          description={filter === "all" ? "ابدأ من مكتبة الكورسات واختر ما يناسب مرحلتك الدراسية." : "جرّب تصنيفًا آخر أو أضف كورسًا جديدًا."}
          action={<Link href="/courses" className="btn btn-primary btn-sm">تصفّح المكتبة</Link>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <Card key={c.enrollment.id} className="flex flex-col overflow-hidden">
              <div className="relative">
                <CourseCover seed={c.slug} accent={c.stage?.accent} compact />
                <div className="absolute right-3 top-3 flex gap-1.5">
                  <Badge className="bg-white/90 text-navy-700">{c.stage?.name}</Badge>
                  {c.progress >= 100 && <Badge tone="success">مكتمل</Badge>}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <Link href={`/learn/${c.slug}`} className="text-left">
                  <h2 className="line-clamp-2 font-display text-[1rem] font-extrabold leading-7 text-navy-800 transition hover:text-navy-600">{c.title}</h2>
                </Link>
                <p className="mt-1.5 text-xs font-semibold text-mist-500">سُجّلت في {formatDate(c.enrollment.enrolledAt)}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-mist-500">
                  <span className="inline-flex items-center gap-1.5"><IconBookOpen className="h-4 w-4 text-navy-400" />{c.completedLessons}/{c.totalLessons} درس</span>
                  <span className="inline-flex items-center gap-1.5"><IconClock className="h-4 w-4 text-navy-400" />{formatDuration(c.durationMinutes)}</span>
                  <span className="inline-flex items-center gap-1.5"><IconLayers className="h-4 w-4 text-navy-400" />{LEVEL_LABEL[c.level]}</span>
                </div>

                <div className="mt-3.5">
                  <ProgressBar value={c.progress} showLabel tone={c.progress >= 100 ? "success" : "navy"} />
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-mist-100 pt-3">
                  <Link href={`/learn/${c.slug}`} className="btn btn-primary btn-sm">
                    <IconPlay className="h-3.5 w-3.5" />
                    {c.progress >= 100 ? "مراجعة الكورس" : c.progress > 0 ? "متابعة" : "ابدأ الآن"}
                  </Link>
                  <div className="flex items-center gap-1">
                    <Link href={`/courses/${c.slug}`} className="rounded-lg p-2 text-mist-500 transition hover:bg-navy-50 hover:text-navy-700" aria-label="تفاصيل الكورس" title="تفاصيل الكورس">
                      <IconQuiz className="h-4 w-4" />
                    </Link>
                    <UnenrollButton courseId={c.id} courseTitle={c.title} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
