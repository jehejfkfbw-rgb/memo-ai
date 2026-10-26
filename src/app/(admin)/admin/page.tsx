import type { Metadata } from "next";
import Link from "next/link";
import { adminOverview } from "@/lib/data";
import { Badge, Card, StatCard } from "@/components/ui";
import {
  IconBell, IconBookOpen, IconCertificate, IconChart, IconClock, IconLayers,
  IconMailOpen, IconPlus, IconQuiz, IconShield, IconTarget, IconTrend, IconUsers,
} from "@/components/icons";
import { formatDateTime, relativeTime, ROLE_LABEL } from "@/lib/utils";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users as usersTable } from "@/db/schema";
import { CountryFlag } from "@/components/country-flag";
import { COUNTRY_LIST, getCountry } from "@/lib/countries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة الإدارة" };

export default async function AdminOverviewPage() {
  const data = await adminOverview();
  const countryRows = await db
    .select({ country: usersTable.country, v: sql<number>`count(*)::int` })
    .from(usersTable)
    .groupBy(usersTable.country)
    .orderBy(sql`count(*) desc`);
  const countryTotals = COUNTRY_LIST.map((c) => ({
    ...c,
    v: countryRows.filter((r) => r.country === c.code).reduce((sum, r) => sum + r.v, 0),
  }));
  const unsupported = countryRows.filter((r) => !r.country || !COUNTRY_LIST.some((c) => c.code === r.country)).reduce((s2, r) => s2 + r.v, 0);
  const maxCountry = Math.max(1, ...countryTotals.map((c) => c.v));
  const { totals, charts, topCourses, recentUsers } = data;

  const days: string[] = [];
  for (let i = 13; i >= 0; i -= 1) days.push(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10));
  const signupByDay = new Map(charts.signups.map((r) => [r.day, r.v]));
  const enrollByDay = new Map(charts.enrollTrend.map((r) => [r.day, r.v]));
  const maxDay = Math.max(1, ...days.map((d) => Math.max(signupByDay.get(d) ?? 0, enrollByDay.get(d) ?? 0)));
  const maxStage = Math.max(1, ...charts.stageDistribution.map((s) => s.v));

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">نظرة عامة على المنصة</h1>
          <p className="mt-1.5 text-sm text-mist-600">مؤشرات حية من قاعدة بيانات نبراس — تُحدَّث مع كل طلب.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/courses" className="btn btn-primary btn-sm"><IconPlus className="h-4 w-4" />إدارة الكورسات</Link>
          <Link href="/admin/users" className="btn btn-outline btn-sm"><IconUsers className="h-4 w-4" />المستخدمون</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي المستخدمين" value={totals.users} icon={<IconUsers className="h-5 w-5" />} tone="navy" hint={`${totals.students} طالب · ${totals.teachers} معلم`} />
        <StatCard label="الكورسات" value={totals.courses} icon={<IconBookOpen className="h-5 w-5" />} tone="gold" hint={`${totals.publishedCourses} منشور · ${totals.lessons} درس`} />
        <StatCard label="التسجيلات في الكورسات" value={totals.enrollments} icon={<IconLayers className="h-5 w-5" />} tone="success" hint={`${totals.quizzes} اختبار منشور`} />
        <StatCard label="متوسط درجات الاختبارات" value={`${totals.averageScore}٪`} icon={<IconTarget className="h-5 w-5" />} tone={totals.averageScore >= 60 ? "success" : "warning"} hint={`${totals.attempts} محاولة مسجّلة`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
              <IconTrend className="h-4.5 w-4.5 text-gold-600" />
              الحركة خلال آخر ١٤ يومًا
            </h2>
            <div className="flex items-center gap-3 text-[0.68rem] font-bold text-mist-500">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-navy-700" />حسابات جديدة</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-gold-400" />تسجيلات كورسات</span>
            </div>
          </div>

          <div className="mt-6 flex h-44 items-end gap-1.5">
            {days.map((d) => {
              const s = signupByDay.get(d) ?? 0;
              const e = enrollByDay.get(d) ?? 0;
              return (
                <div key={d} className="group flex flex-1 flex-col items-center justify-end gap-1" title={`${d}: ${s} حساب، ${e} تسجيل`}>
                  <div className="flex w-full items-end justify-center gap-0.5" style={{ height: "8rem" }}>
                    <div className="w-1/2 rounded-t bg-navy-700 transition-all group-hover:bg-navy-600" style={{ height: `${(s / maxDay) * 100}%`, minHeight: s ? 4 : 0 }} />
                    <div className="w-1/2 rounded-t bg-gold-400 transition-all group-hover:bg-gold-300" style={{ height: `${(e / maxDay) * 100}%`, minHeight: e ? 4 : 0 }} />
                  </div>
                  <span className="text-[0.58rem] font-semibold text-mist-400">{new Date(d).getDate()}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 border-t border-mist-100 pt-3 text-xs text-mist-500">
            إجمالي الحسابات: <b className="text-navy-800">{totals.users}</b> · إجمالي التسجيلات: <b className="text-navy-800">{totals.enrollments}</b>
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
            <IconChart className="h-4.5 w-4.5 text-gold-600" />
            توزيع الكورسات على المراحل
          </h2>
          <ul className="mt-5 space-y-3.5">
            {charts.stageDistribution.map((s) => (
              <li key={s.name}>
                <div className="mb-1.5 flex items-center justify-between text-xs font-bold">
                  <span className="text-navy-800">{s.name}</span>
                  <span className="tabular-nums text-mist-500">{s.v}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-mist-100">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(s.v / maxStage) * 100}%`, background: s.accent ?? "#1B3A6B" }} />
                </div>
              </li>
            ))}
          </ul>
          <Link href="/admin/taxonomy" className="btn btn-ghost btn-sm mt-5 w-full">إدارة المراحل والمواد</Link>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-mist-100 px-5 py-4">
            <h2 className="font-display text-sm font-extrabold text-navy-800">الأكثر تسجيلًا</h2>
            <Link href="/admin/courses" className="text-xs font-bold text-navy-600 transition hover:text-gold-600">كل الكورسات</Link>
          </div>
          <ul className="divide-y divide-mist-100">
            {topCourses.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 font-display text-xs font-extrabold text-navy-700">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/courses/${c.id}`} className="truncate text-sm font-bold text-navy-800 transition hover:text-gold-600">{c.title}</Link>
                  <p className="mt-0.5 text-xs font-semibold text-mist-500">{c.stage}</p>
                </div>
                <Badge tone="gold">{c.enrolled} متعلّم</Badge>
              </li>
            ))}
            {topCourses.length === 0 && <li className="px-5 py-8 text-center text-sm text-mist-500">لا كورسات بعد</li>}
          </ul>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-mist-100 px-5 py-4">
            <h2 className="font-display text-sm font-extrabold text-navy-800">أحدث الحسابات</h2>
            <Link href="/admin/users" className="text-xs font-bold text-navy-600 transition hover:text-gold-600">إدارة المستخدمين</Link>
          </div>
          <ul className="divide-y divide-mist-100">
            {recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-50 font-display text-[0.7rem] font-extrabold text-gold-700">
                  {u.fullName.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-800">{u.fullName}</p>
                  <p className="truncate text-xs font-semibold text-mist-500" dir="ltr">{u.email}</p>
                </div>
                <div className="text-left">
                  <Badge tone={u.role === "admin" ? "gold" : u.role === "teacher" ? "navy" : "muted"}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                  <p className="mt-1 text-[0.65rem] font-semibold text-mist-400">{relativeTime(u.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/messages" className="card card-hover flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700"><IconMailOpen className="h-5 w-5" /></span>
          <div>
            <p className="font-display text-xl font-extrabold tabular-nums text-navy-800">{totals.newMessages}</p>
            <p className="text-xs font-bold text-mist-500">رسالة تواصل جديدة</p>
          </div>
        </Link>
        <Link href="/admin/learners" className="card card-hover flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-100 text-navy-700"><IconQuiz className="h-5 w-5" /></span>
          <div>
            <p className="font-display text-xl font-extrabold tabular-nums text-navy-800">{totals.attempts}</p>
            <p className="text-xs font-bold text-mist-500">محاولة اختبار</p>
          </div>
        </Link>
        <Link href="/admin/audit" className="card card-hover flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-soft text-success"><IconShield className="h-5 w-5" /></span>
          <div>
            <p className="font-display text-xl font-extrabold tabular-nums text-navy-800">{totals.messages}</p>
            <p className="text-xs font-bold text-mist-500">إجمالي الرسائل</p>
          </div>
        </Link>
        <Link href="/admin/courses" className="card card-hover flex items-center gap-4 p-5">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mist-100 text-mist-600"><IconCertificate className="h-5 w-5" /></span>
          <div>
            <p className="font-display text-xl font-extrabold tabular-nums text-navy-800">{totals.lessons}</p>
            <p className="text-xs font-bold text-mist-500">درس منشور</p>
          </div>
        </Link>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
            <IconUsers className="h-4.5 w-4.5 text-gold-600" />
            توزيع المستخدمين على الدول المدعومة
          </h2>
          <span className="text-[0.7rem] font-bold text-mist-500">مصر · السعودية · الأردن · الإمارات فقط</span>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {countryTotals.map((c) => (
            <li key={c.code} className="rounded-xl border border-mist-200 bg-mist-50 p-4">
              <div className="flex items-center gap-2.5">
                <CountryFlag code={c.code} className="h-4 w-6" />
                <span className="text-xs font-extrabold text-navy-800">{c.nameAr}</span>
                <span className="mr-auto font-display text-base font-extrabold tabular-nums text-navy-800">{c.v}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist-200">
                <div className="h-full rounded-full transition-all" style={{ width: `${(c.v / maxCountry) * 100}%`, background: c.accent }} />
              </div>
              <p className="mt-2 text-[0.68rem] font-semibold text-mist-500" dir="ltr">{c.dial} · {c.currency} · {c.timezone}</p>
            </li>
          ))}
        </ul>
        {unsupported > 0 && (
          <p className="mt-4 rounded-xl bg-warning-soft px-4 py-2.5 text-xs font-bold text-warning">
            يوجد {unsupported} حساب بدون دولة محددة — حدّثها من صفحة المستخدمين لتبقى البيانات ضمن الدول المدعومة.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
          <IconBell className="h-4.5 w-4.5 text-gold-600" />
          مهام إدارية مقترحة
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: `${totals.newMessages} رسالة تواصل بحاجة لرد`, href: "/admin/messages", icon: <IconMailOpen className="h-4 w-4" /> },
            { label: `${totals.courses - totals.publishedCourses} كورس في حالة مسودة`, href: "/admin/courses", icon: <IconBookOpen className="h-4 w-4" /> },
            { label: `${totals.quizzes} اختبار — راجع الأسئلة`, href: "/admin/courses", icon: <IconQuiz className="h-4 w-4" /> },
            { label: "أضف مرحلة أو مادة جديدة", href: "/admin/taxonomy", icon: <IconLayers className="h-4 w-4" /> },
            { label: "راجع سجلّ التدقيق الأمني", href: "/admin/audit", icon: <IconShield className="h-4 w-4" /> },
            { label: `متوسط الدرجات ${totals.averageScore}٪`, href: "/admin/learners", icon: <IconClock className="h-4 w-4" /> },
          ].map((t) => (
            <li key={t.label}>
              <Link href={t.href} className="flex items-center gap-2.5 rounded-xl border border-mist-200 px-4 py-3 text-xs font-bold text-mist-700 transition hover:border-navy-300 hover:bg-navy-50 hover:text-navy-800">
                <span className="text-navy-500">{t.icon}</span>
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[0.7rem] font-semibold text-mist-400">آخر تحديث للبيانات: {formatDateTime(new Date())}</p>
      </Card>
    </div>
  );
}
