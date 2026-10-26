import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { enrollments, quizzes, quizAttempts } from "@/db/schema";
import {
  getUserAttempts, getUserCourses, getUserStats, listAnnouncements,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { Badge, Card, EmptyState, ProgressBar, SectionHeading, StatCard } from "@/components/ui";
import { CourseCover } from "@/components/course-cover";
import {
  IconBell, IconBookOpen, IconCertificate, IconChart, IconClock, IconLayers,
  IconPlay, IconQuiz, IconTarget, IconTrend, IconTrophy,
} from "@/components/icons";
import { formatDate, relativeTime } from "@/lib/utils";
import { Alert } from "@/components/ui";
import { getCountry, SUPPORTED_COUNTRIES_LABEL } from "@/lib/countries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة التقدم" };

export default async function DashboardPage() {
  const user = (await getCurrentUser())!;

  const [enrolled, stats, attempts, news, myEnrollments] = await Promise.all([
    getUserCourses(user.id),
    getUserStats(user.id),
    getUserAttempts(user.id, 6),
    listAnnouncements(true, 3),
    db.select({ courseId: enrollments.courseId }).from(enrollments).where(eq(enrollments.userId, user.id)),
  ]);

  const courseIds = myEnrollments.map((e) => e.courseId);

  // نشاط آخر ٧ أيام (دروس مكتملة)
  const activityRows = await db
    .select({
      day: sql<string>`to_char(date(${sql`coalesce(completed_at, updated_at)`}), 'YYYY-MM-DD')`,
      v: count(),
    })
    .from(sql`lesson_progress`)
    .where(sql`user_id = ${user.id} and completed = true and coalesce(completed_at, updated_at) >= now() - interval '7 days'`)
    .groupBy(sql`to_char(date(coalesce(completed_at, updated_at)), 'YYYY-MM-DD')`);

  const days: Array<{ label: string; key: string; value: number }> = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    days.push({
      key,
      label: new Intl.DateTimeFormat("ar", { weekday: "short" }).format(d),
      value: activityRows.find((r) => r.day === key)?.v ?? 0,
    });
  }
  const maxActivity = Math.max(1, ...days.map((d) => d.value));

  // اختبارات متاحة لم تُؤدَّ بعد
  const pendingQuizzes = courseIds.length
    ? await db
        .select({ quiz: quizzes, attemptsUsed: sql<number>`(select count(*)::int from ${quizAttempts} where ${quizAttempts.quizId} = ${quizzes.id} and ${quizAttempts.userId} = ${user.id})` })
        .from(quizzes)
        .where(and(inArray(quizzes.courseId, courseIds), eq(quizzes.isPublished, true)))
        .orderBy(desc(quizzes.sortOrder))
        .limit(4)
    : [];

  const continueCourses = enrolled.filter((c) => c.progress > 0 && c.progress < 100).slice(0, 3);
  const notStarted = enrolled.filter((c) => c.progress === 0).slice(0, 3);
  const completedCourses = enrolled.filter((c) => c.progress >= 100);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 17 ? "نهارك سعيد" : "مساء الخير";

  return (
    <div className="space-y-8">
      {/* ترحيب */}
      <Card className="relative overflow-hidden p-0">
        <div className="relative bg-navy-900 px-6 py-7 sm:px-8">
          <div className="grid-paper absolute inset-0 opacity-50" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-gold-400">{greeting} 👋</p>
              <h1 className="mt-1.5 font-display text-[1.6rem] font-extrabold text-white">{user.fullName}</h1>
              <p className="mt-1.5 text-sm text-mist-300">
                {stats.enrolled > 0
                  ? `لديك ${stats.enrolled} كورس${stats.completedCourses ? `، وأتممت ${stats.completedCourses} منها` : ""}. واصل من حيث توقفت.`
                  : "ابدأ بتسجيل أول كورس لك من المكتبة، وستظهر خطتك هنا."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/courses" className="btn btn-gold btn-sm">
                <IconLayers className="h-4 w-4" />
                تصفّح الكورسات
              </Link>
              {continueCourses[0] && (
                <Link href={`/learn/${continueCourses[0].slug}`} className="btn btn-sm border-white/25 bg-white/10 text-white hover:bg-white/15">
                  <IconPlay className="h-4 w-4" />
                  متابعة التعلّم
                </Link>
              )}
            </div>
          </div>
        </div>
      </Card>

      {!user.country ? (
        <Alert tone="warning" title="أكمل بيانات دولتك">
          <p>
            نبراس متاحة في {SUPPORTED_COUNTRIES_LABEL} فقط. حدّد دولتك لعرض الأسعار بالعملة الصحيحة والتحقق من رقم جوالك.
            <Link href="/profile" className="mr-1.5 font-bold text-navy-800 underline underline-offset-4">اذهب إلى الملف الشخصي</Link>
          </p>
        </Alert>
      ) : (
        <p className="text-xs font-bold text-mist-500">
          الدولة المسجّلة: {getCountry(user.country).nameAr} · العملة {getCountry(user.country).currencyAr} · رمز الاتصال <span dir="ltr">{getCountry(user.country).dial}</span>
        </p>
      )}

      {/* الإحصاءات */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="الكورسات المسجّلة" value={stats.enrolled} icon={<IconBookOpen className="h-5 w-5" />} tone="navy" hint={`${stats.completedCourses} مكتملة`} />
        <StatCard label="الدروس المكتملة" value={stats.completedLessons} icon={<IconTarget className="h-5 w-5" />} tone="gold" hint={`وقت دراسة ${stats.studyMinutes} دقيقة`} />
        <StatCard label="متوسط الدرجات" value={`${stats.averageScore}٪`} icon={<IconChart className="h-5 w-5" />} tone={stats.averageScore >= 60 ? "success" : "warning"} hint={`${stats.quizAttempts} محاولة اختبار · الأعلى ${stats.bestScore}٪`} />
        <StatCard label="الشهادات" value={stats.certificates} icon={<IconCertificate className="h-5 w-5" />} tone="muted" hint="تُصدر تلقائيًا عند إتمام الكورس" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* متابعة التعلّم */}
          <section>
            <SectionHeading eyebrow="واصل من حيث توقفت" title="كورسات قيد التقدّم" />
            {continueCourses.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {continueCourses.map((c) => (
                  <Link key={c.id} href={`/learn/${c.slug}`} className="card card-hover overflow-hidden">
                    <CourseCover seed={c.slug} accent={c.stage?.accent} compact />
                    <div className="p-4">
                      <h3 className="line-clamp-1 font-display text-[0.95rem] font-bold text-navy-800">{c.title}</h3>
                      <p className="mt-1 text-xs font-semibold text-mist-500">
                        {c.completedLessons} من {c.totalLessons} درس · {c.stage?.name}
                      </p>
                      <div className="mt-3">
                        <ProgressBar value={c.progress} showLabel tone={c.progress >= 100 ? "success" : "navy"} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IconPlay className="h-6 w-6" />}
                title="لم تبدأ أي درس بعد"
                description={notStarted.length ? "لديك كورسات مسجّلة بانتظار أول درس." : "سجّل في كورس من المكتبة لتبدأ رحلتك."}
                action={<Link href="/courses" className="btn btn-primary btn-sm">اختيار كورس</Link>}
              />
            )}
          </section>

          {/* الاختبارات المعلقة */}
          <section>
            <SectionHeading eyebrow="قياس الفهم" title="اختبارات في كورساتك" />
            {pendingQuizzes.length ? (
              <Card className="divide-y divide-mist-100 p-0">
                {pendingQuizzes.map(({ quiz, attemptsUsed }) => {
                  const left = Math.max(0, quiz.attemptsAllowed - attemptsUsed);
                  return (
                    <div key={quiz.id} className="flex flex-wrap items-center gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
                        <IconQuiz className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-extrabold text-navy-800">{quiz.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs font-semibold text-mist-500">
                          <span className="inline-flex items-center gap-1"><IconClock className="h-3.5 w-3.5" />{quiz.timeLimitMinutes} دقيقة</span>
                          <span>درجة النجاح {quiz.passingPercent}٪</span>
                        </p>
                      </div>
                      {attemptsUsed > 0 ? <Badge tone="muted">{attemptsUsed} محاولة</Badge> : <Badge tone="gold">لم يُؤدَّ بعد</Badge>}
                      <Link href={`/quiz/${quiz.id}`} className={left > 0 ? "btn btn-primary btn-sm" : "btn btn-outline btn-sm cursor-not-allowed opacity-60"}>
                        {left > 0 ? "ابدأ الاختبار" : "استنفدت المحاولات"}
                      </Link>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <EmptyState icon={<IconQuiz className="h-6 w-6" />} title="لا اختبارات متاحة الآن" description="ستظهر هنا اختبارات الكورسات التي تسجّل فيها." />
            )}
          </section>

          {/* آخر المحاولات */}
          <section>
            <SectionHeading
              eyebrow="سجلّ الأداء"
              title="آخر نتائج الاختبارات"
              action={<Link href="/grades" className="btn btn-outline btn-sm">كل الدرجات</Link>}
            />
            {attempts.length ? (
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="table-shell">
                    <thead>
                      <tr>
                        <th>الاختبار</th>
                        <th>الكورس</th>
                        <th>الدرجة</th>
                        <th>النسبة</th>
                        <th>النتيجة</th>
                        <th>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map(({ attempt, quizTitle, courseTitle }) => (
                        <tr key={attempt.id}>
                          <td className="font-bold text-navy-800">{quizTitle}</td>
                          <td className="text-mist-600">{courseTitle ?? "—"}</td>
                          <td className="tabular-nums text-mist-700">{attempt.score}/{attempt.totalPoints}</td>
                          <td className="font-extrabold tabular-nums text-navy-800">{attempt.percent}٪</td>
                          <td>
                            <Badge tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "ناجح" : "يحتاج مراجعة"}</Badge>
                          </td>
                          <td className="whitespace-nowrap text-xs text-mist-500">{relativeTime(attempt.submittedAt ?? attempt.startedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <EmptyState icon={<IconTrend className="h-6 w-6" />} title="لم تؤدِّ أي اختبار بعد" description="أكمل دروسك ثم اختبر نفسك لقياس مستوى فهمك." />
            )}
          </section>
        </div>

        {/* العمود الجانبي */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
              <IconTrend className="h-4.5 w-4.5 text-gold-600" />
              نشاطك في آخر ٧ أيام
            </h2>
            <div className="mt-5 flex h-32 items-end gap-2">
              {days.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[0.65rem] font-bold tabular-nums text-mist-500">{d.value || ""}</span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(4, (d.value / maxActivity) * 100)}%`,
                      background: d.value ? "linear-gradient(180deg,#35639F,#1B3A6B)" : "#DFE6EF",
                    }}
                    title={`${d.value} درس في ${d.key}`}
                  />
                  <span className="text-[0.65rem] font-semibold text-mist-500">{d.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-mist-100 pt-3 text-xs leading-6 text-mist-500">
              إجمالي الدروس المكتملة: <b className="text-navy-800">{stats.completedLessons}</b> درس ·
              إجمالي محاولات الاختبار: <b className="text-navy-800">{stats.quizAttempts}</b>
            </p>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
              <IconTrophy className="h-4.5 w-4.5 text-gold-600" />
              إنجازاتك
            </h2>
            <ul className="mt-4 space-y-3">
              {[
                { label: "كورسات مكتملة", value: stats.completedCourses, icon: <IconCertificate className="h-4 w-4" /> },
                { label: "أعلى درجة اختبار", value: `${stats.bestScore}٪`, icon: <IconTarget className="h-4 w-4" /> },
                { label: "شهادات صادرة", value: stats.certificates, icon: <IconTrophy className="h-4 w-4" /> },
                { label: "دقائق الدراسة", value: stats.studyMinutes, icon: <IconClock className="h-4 w-4" /> },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-mist-50 px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-mist-600">
                    <span className="text-navy-500">{row.icon}</span>
                    {row.label}
                  </span>
                  <span className="font-display text-sm font-extrabold tabular-nums text-navy-800">{row.value}</span>
                </li>
              ))}
            </ul>
          </Card>

          {completedCourses.length > 0 && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-extrabold text-navy-800">أتممتها بنجاح 🎉</h2>
              <ul className="mt-3 space-y-2">
                {completedCourses.map((c) => (
                  <li key={c.id}>
                    <Link href={`/learn/${c.slug}`} className="flex items-center gap-2.5 rounded-xl border border-mist-200 px-3.5 py-2.5 transition hover:border-navy-300 hover:bg-navy-50">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-success" />
                      <span className="truncate text-xs font-bold text-navy-800">{c.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
              <IconBell className="h-4.5 w-4.5 text-gold-600" />
              إعلانات المنصة
            </h2>
            {news.length ? (
              <ul className="mt-3.5 space-y-3.5">
                {news.map(({ announcement }) => (
                  <li key={announcement.id} className="border-r-2 border-gold-400 pr-3">
                    <p className="text-[0.82rem] font-extrabold text-navy-800">{announcement.title}</p>
                    <p className="mt-1 line-clamp-2 text-[0.75rem] leading-6 text-mist-600">{announcement.body}</p>
                    <p className="mt-1 text-[0.68rem] font-semibold text-mist-400">{formatDate(announcement.publishedAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-mist-500">لا توجد إعلانات حاليًا.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
