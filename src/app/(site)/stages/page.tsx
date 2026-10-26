import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, subjects, users } from "@/db/schema";
import { listStages } from "@/lib/data";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { IconChevronLeft, IconLayers, IconUsers, StageIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المراحل التعليمية", description: "كل المراحل التعليمية المتاحة على منصة نبراس مع المواد والكورسات." };

export default async function StagesPage({ searchParams }: { searchParams: Promise<{ stage?: string }> }) {
  const sp = await searchParams;
  const [stageRows, subjectRows, teacherRows] = await Promise.all([
    listStages(true),
    db.select().from(subjects).orderBy(subjects.sortOrder),
    db.select({ id: users.id, fullName: users.fullName, bio: users.bio, city: users.city, avatarUrl: users.avatarUrl }).from(users).where(eq(users.role, "teacher")),
  ]);

  const courseRows = await db
    .select({ id: courses.id, title: courses.title, slug: courses.slug, stageId: courses.stageId, subjectId: courses.subjectId, level: courses.level })
    .from(courses)
    .where(eq(courses.status, "published"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-3 flex items-center gap-2 text-xs font-semibold text-mist-500" aria-label="مسار التنقل">
        <Link href="/" className="transition hover:text-navy-700">الرئيسية</Link>
        <IconChevronLeft className="h-3.5 w-3.5" />
        <span className="text-navy-700">المراحل</span>
      </nav>

      <SectionHeading
        eyebrow="من الابتدائي إلى الجامعي"
        title="المراحل التعليمية في نبراس"
        description="نظّمنا المحتوى في مراحل ومواد واضحة، فتصل إلى ما يناسب صفّك ومستواك في ثوانٍ. كل مرحلة قابلة للتوسّع بمواد وكورسات جديدة من لوحة الإدارة."
      />

      <div className="space-y-6">
        {stageRows.map((stage) => {
          const stageSubjects = subjectRows.filter((s) => s.stageId === stage.id);
          const stageCourses = courseRows.filter((c) => c.stageId === stage.id);
          const highlighted = sp.stage === stage.slug;

          return (
            <Card key={stage.id} className={highlighted ? "overflow-hidden border-navy-300 ring-2 ring-navy-200" : "overflow-hidden"}>
              <div id={stage.slug} className="scroll-mt-24" />
              <div className="flex flex-col gap-4 border-b border-mist-100 p-6 sm:flex-row sm:items-center">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                  style={{ background: stage.accent ?? "#1B3A6B" }}
                >
                  <StageIcon iconKey={stage.iconKey} className="h-7 w-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-extrabold text-navy-800">{stage.name}</h2>
                    <span className="text-xs font-bold uppercase tracking-wider text-mist-400" dir="ltr">{stage.nameEn}</span>
                  </div>
                  <p className="mt-1.5 max-w-2xl text-sm leading-7 text-mist-600">{stage.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Badge tone="navy"><IconLayers className="h-3.5 w-3.5" />{stageCourses.length} كورس</Badge>
                  <Badge tone="gold"><IconUsers className="h-3.5 w-3.5" />{stageSubjects.length} مادة</Badge>
                </div>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.2fr]">
                <div>
                  <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-mist-500">مواد المرحلة</h3>
                  {stageSubjects.length ? (
                    <ul className="space-y-2">
                      {stageSubjects.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/courses?stage=${stage.id}&subject=${s.id}`}
                            className="flex items-center justify-between rounded-xl border border-mist-200 px-4 py-2.5 text-sm font-bold text-navy-800 transition hover:border-navy-300 hover:bg-navy-50"
                          >
                            <span className="inline-flex items-center gap-2.5">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.accent ?? "#C9A227" }} />
                              {s.name}
                            </span>
                            <span className="text-xs font-semibold text-mist-500 tabular-nums">
                              {stageCourses.filter((c) => c.subjectId === s.id).length} كورس
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-mist-500">لم تُضف مواد لهذه المرحلة بعد.</p>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-xs font-extrabold uppercase tracking-wider text-mist-500">كورسات المرحلة</h3>
                  {stageCourses.length ? (
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {stageCourses.map((c) => (
                        <li key={c.id}>
                          <Link href={`/courses/${c.slug}`} className="block rounded-xl bg-mist-50 px-4 py-3 transition hover:bg-navy-50">
                            <p className="truncate text-sm font-bold text-navy-800">{c.title}</p>
                            <p className="mt-1 text-[0.7rem] font-semibold text-mist-500">
                              {stageSubjects.find((s) => s.id === c.subjectId)?.name ?? "عام"}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-mist-500">لا توجد كورسات منشورة في هذه المرحلة حاليًا.</p>
                  )}
                  <Link href={`/courses?stage=${stage.id}`} className="btn btn-outline btn-sm mt-4">
                    عرض كل كورسات {stage.name}
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {teacherRows.length > 0 && (
        <section className="mt-16">
          <SectionHeading eyebrow="فريق التدريس" title="معلمو نبراس" description="نخبة من المعلمين والمحاضرين يشرفون على محتوى المنصة." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teacherRows.map((t) => (
              <Card key={t.id} className="p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-700 font-display text-sm font-extrabold text-gold-300">
                    {t.fullName.replace(/^(د\.|أ\.)\s*/, "").slice(0, 2)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-extrabold text-navy-800">{t.fullName}</p>
                    {t.city && <p className="text-xs font-semibold text-mist-500">{t.city}</p>}
                  </div>
                </div>
                {t.bio && <p className="mt-3 text-[0.82rem] leading-7 text-mist-600">{t.bio}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
