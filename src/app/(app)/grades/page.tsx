import type { Metadata } from "next";
import Link from "next/link";
import { getUserAttempts, getUserCourses, getUserStats } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { Badge, Card, EmptyState, ProgressBar, SectionHeading, StatCard } from "@/components/ui";
import { IconChart, IconClock, IconQuiz, IconTarget, IconTrend } from "@/components/icons";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الدرجات والاختبارات" };

export default async function GradesPage() {
  const user = (await getCurrentUser())!;
  const [attempts, stats, enrolled] = await Promise.all([
    getUserAttempts(user.id, 200),
    getUserStats(user.id),
    getUserCourses(user.id),
  ]);

  const passed = attempts.filter((a) => a.attempt.passed).length;
  const passRate = attempts.length ? Math.round((passed / attempts.length) * 100) : 0;

  // تجميع النتائج حسب الكورس
  const byCourse = new Map<string, { title: string; slug: string | null; attempts: number; best: number; avg: number; sum: number }>();
  attempts.forEach(({ attempt, courseTitle, courseId }) => {
    const key = courseId ?? attempt.quizId;
    const row = byCourse.get(key) ?? { title: courseTitle ?? "اختبارات عامة", slug: null, attempts: 0, best: 0, sum: 0, avg: 0 };
    row.attempts += 1;
    row.best = Math.max(row.best, attempt.percent);
    row.sum += attempt.percent;
    byCourse.set(key, row);
  });
  byCourse.forEach((row) => {
    row.avg = Math.round(row.sum / row.attempts);
    const match = enrolled.find((c) => c.title === row.title);
    row.slug = match?.slug ?? null;
  });

  // اتجاه آخر ٦ محاولات
  const trend = attempts.slice(0, 6).reverse();

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">الدرجات والاختبارات</h1>
        <p className="mt-1.5 text-sm text-mist-600">سجلّ كامل لكل محاولاتك مع الدرجات والنِسب وتواريخ الأداء.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="عدد المحاولات" value={stats.quizAttempts} icon={<IconQuiz className="h-5 w-5" />} tone="navy" />
        <StatCard label="متوسط الدرجات" value={`${stats.averageScore}٪`} icon={<IconChart className="h-5 w-5" />} tone={stats.averageScore >= 60 ? "success" : "warning"} />
        <StatCard label="أعلى درجة" value={`${stats.bestScore}٪`} icon={<IconTarget className="h-5 w-5" />} tone="gold" />
        <StatCard label="نسبة الاجتياز" value={`${passRate}٪`} icon={<IconTrend className="h-5 w-5" />} tone="muted" hint={`${passed} من ${attempts.length} محاولة ناجحة`} />
      </div>

      {trend.length > 1 && (
        <Card className="p-5">
          <h2 className="font-display text-sm font-extrabold text-navy-800">اتجاه درجاتك (آخر {trend.length} محاولات)</h2>
          <div className="mt-5 flex h-28 items-end gap-3">
            {trend.map(({ attempt }, i) => (
              <div key={attempt.id} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[0.68rem] font-bold tabular-nums text-mist-600">{attempt.percent}٪</span>
                <div
                  className="w-full rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max(6, attempt.percent)}%`,
                    background: attempt.passed ? "linear-gradient(180deg,#E9C963,#C9A227)" : "linear-gradient(180deg,#9AA9BD,#74839A)",
                  }}
                  title={`محاولة ${i + 1}`}
                />
                <span className="text-[0.62rem] font-semibold text-mist-400">{i + 1}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {byCourse.size > 0 && (
        <section>
          <SectionHeading eyebrow="حسب الكورس" title="أداؤك في كل مقرر" />
          <div className="grid gap-4 md:grid-cols-2">
            {[...byCourse.values()].map((row) => (
              <Card key={row.title} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {row.slug ? (
                      <Link href={`/learn/${row.slug}`} className="truncate font-display text-sm font-extrabold text-navy-800 transition hover:text-gold-600">
                        {row.title}
                      </Link>
                    ) : (
                      <p className="truncate font-display text-sm font-extrabold text-navy-800">{row.title}</p>
                    )}
                    <p className="mt-1 text-xs font-semibold text-mist-500">{row.attempts} محاولة اختبار</p>
                  </div>
                  <Badge tone={row.avg >= 60 ? "success" : "warning"}>متوسط {row.avg}٪</Badge>
                </div>
                <div className="mt-4">
                  <ProgressBar value={row.best} tone={row.best >= 60 ? "success" : "gold"} showLabel />
                </div>
                <p className="mt-1.5 text-[0.7rem] font-semibold text-mist-500">أفضل درجة في هذا المقرر</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading eyebrow="السجل التفصيلي" title="كل المحاولات" />
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
                    <th>المدة</th>
                    <th>النتيجة</th>
                    <th>التاريخ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map(({ attempt, quizTitle, courseTitle, courseId }) => (
                    <tr key={attempt.id}>
                      <td className="font-bold text-navy-800">{quizTitle}</td>
                      <td className="text-mist-600">{courseTitle ?? "—"}</td>
                      <td className="tabular-nums text-mist-700">{attempt.score}/{attempt.totalPoints}</td>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          <span className="font-extrabold tabular-nums text-navy-800">{attempt.percent}٪</span>
                          <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-mist-200 sm:block">
                            <span className={`block h-full rounded-full ${attempt.passed ? "bg-success" : "bg-danger"}`} style={{ width: `${attempt.percent}%` }} />
                          </span>
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-xs text-mist-500">
                        <span className="inline-flex items-center gap-1">
                          <IconClock className="h-3.5 w-3.5" />
                          {Math.floor(attempt.durationSeconds / 60)}د {attempt.durationSeconds % 60}ث
                        </span>
                      </td>
                      <td><Badge tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "ناجح" : "لم يجتز"}</Badge></td>
                      <td className="whitespace-nowrap text-xs text-mist-500">{formatDateTime(attempt.submittedAt)}</td>
                      <td>
                        {courseId && (
                          <Link href={`/quiz/${attempt.quizId}`} className="btn btn-ghost btn-sm">مراجعة</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={<IconQuiz className="h-6 w-6" />}
            title="لا توجد محاولات بعد"
            description="ابدأ بأول اختبار في كورساتك لتظهر درجاتك هنا."
            action={<Link href="/my-courses" className="btn btn-primary btn-sm">اذهب إلى كورساتي</Link>}
          />
        )}
      </section>

      <p className="text-xs text-mist-400">
        آخر تحديث للسجل: {attempts[0]?.attempt.submittedAt ? formatDateTime(attempts[0].attempt.submittedAt) : "—"} ·
        عدد السجلات المعروضة: {attempts.length}
      </p>
    </div>
  );
}
