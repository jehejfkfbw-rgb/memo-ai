import type { Metadata } from "next";
import Link from "next/link";
import { listCourses, listStages, listSubjects } from "@/lib/data";
import { CourseCard } from "@/components/course-card";
import { CourseFilters } from "@/components/course-filters";
import { EmptyState } from "@/components/ui";
import { IconChevronLeft, IconLayers } from "@/components/icons";
import { LEVEL_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مكتبة الكورسات", description: "تصفّح كورسات نبراس لكل المراحل التعليمية والمواد الدراسية." };

type Props = { searchParams: Promise<{ stage?: string; subject?: string; level?: string; q?: string; page?: string }> };

export default async function CoursesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const pageSize = 9;

  const [stageRows, subjectRows, result] = await Promise.all([
    listStages(true),
    listSubjects(undefined, true),
    listCourses({ stageId: sp.stage, subjectId: sp.subject, level: sp.level, search: sp.q, limit: pageSize, offset: (page - 1) * pageSize }),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));

  const buildHref = (p: number) => {
    const next = new URLSearchParams();
    if (sp.stage) next.set("stage", sp.stage);
    if (sp.subject) next.set("subject", sp.subject);
    if (sp.level) next.set("level", sp.level);
    if (sp.q) next.set("q", sp.q);
    if (p > 1) next.set("page", String(p));
    const qs = next.toString();
    return qs ? `/courses?${qs}` : "/courses";
  };

  return (
    <div className="bg-mist-50">
      <div className="border-b border-mist-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <nav className="mb-3 flex items-center gap-2 text-xs font-semibold text-mist-500" aria-label="مسار التنقل">
            <Link href="/" className="transition hover:text-navy-700">الرئيسية</Link>
            <IconChevronLeft className="h-3.5 w-3.5" />
            <span className="text-navy-700">الكورسات</span>
          </nav>
          <h1 className="font-display text-[1.9rem] font-extrabold text-navy-800">مكتبة الكورسات</h1>
          <p className="mt-2 max-w-2xl text-sm leading-8 text-mist-600">
            {result.total} كورس متاح الآن في المراحل الابتدائية والإعدادية والثانوية والجامعية والمهارات المهنية.
            اختر المرحلة والمادة لتضييق النتائج.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[17rem_1fr] lg:px-8">
        <aside>
          <CourseFilters
            stages={stageRows.map((s) => ({ value: s.id, label: s.name }))}
            subjects={subjectRows
              .filter((s) => !sp.stage || s.stageId === sp.stage)
              .map((s) => ({ value: s.id, label: s.name }))}
            levels={Object.entries(LEVEL_LABEL).map(([value, label]) => ({ value, label }))}
            counts={{ total: result.total }}
          />
        </aside>

        <div>
          {(sp.q || sp.stage || sp.subject || sp.level) && (
            <p className="mb-4 text-sm font-semibold text-mist-600">
              نتائج البحث عن {sp.q ? `«${sp.q}» ` : ""}— {result.total} كورس
            </p>
          )}

          {result.items.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((c) => <CourseCard key={c.id} course={c} />)}
              </div>

              {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="ترقيم الصفحات">
                  {page > 1 && (
                    <Link href={buildHref(page - 1)} className="btn btn-outline btn-sm">السابق</Link>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={buildHref(p)}
                      className={p === page ? "btn btn-primary btn-sm min-w-10" : "btn btn-outline btn-sm min-w-10"}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </Link>
                  ))}
                  {page < totalPages && (
                    <Link href={buildHref(page + 1)} className="btn btn-outline btn-sm">التالي</Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <EmptyState
              icon={<IconLayers className="h-6 w-6" />}
              title="لا توجد كورسات مطابقة"
              description="جرّب تغيير المرحلة أو المادة، أو امسح كلمة البحث لعرض كل المكتبة."
              action={<Link href="/courses" className="btn btn-primary btn-sm">عرض كل الكورسات</Link>}
            />
          )}
        </div>
      </div>
    </div>
  );
}
