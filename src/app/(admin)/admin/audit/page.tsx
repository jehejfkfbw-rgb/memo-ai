import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, settings, users } from "@/db/schema";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";
import { IconAlert, IconCheckCircle, IconLock, IconShield, IconUser } from "@/components/icons";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "السجل والتدقيق" };

const ACTION_LABEL: Record<string, { label: string; tone: "navy" | "gold" | "success" | "danger" | "muted" }> = {
  "auth.register": { label: "تسجيل حساب", tone: "success" },
  "auth.login.success": { label: "دخول ناجح", tone: "success" },
  "auth.login.failed": { label: "دخول فاشل", tone: "danger" },
  "auth.login.rate_limited": { label: "تقييد محاولات دخول", tone: "danger" },
  "auth.logout": { label: "تسجيل خروج", tone: "muted" },
  "auth.password_changed": { label: "تغيير كلمة المرور", tone: "gold" },
  "course.enroll": { label: "تسجيل في كورس", tone: "navy" },
  "course.unenroll": { label: "إلغاء تسجيل كورس", tone: "muted" },
  "quiz.submitted": { label: "تسليم اختبار", tone: "navy" },
  "certificate.issued": { label: "إصدار شهادة", tone: "gold" },
  "contact.created": { label: "رسالة تواصل", tone: "muted" },
  "profile.updated": { label: "تحديث الملف الشخصي", tone: "muted" },
};

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const perPage = 25;

  const [logs, siteSettings, failedLogins] = await Promise.all([
    db
      .select({ log: auditLogs, userName: users.fullName, userEmail: users.email })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select().from(settings),
    db
      .select({ log: auditLogs })
      .from(auditLogs)
      .where(eq(auditLogs.action, "auth.login.failed"))
      .orderBy(desc(auditLogs.createdAt))
      .limit(5),
  ]);

  const site = siteSettings.find((s) => s.key === "site")?.value as Record<string, string> | undefined;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">السجل والتدقيق الأمني</h1>
        <p className="mt-1.5 text-sm text-mist-600">
          كل عملية حسّاسة في المنصة تُسجَّل هنا: الدخول والخروج، التسجيل في الكورسات، تسليم الاختبارات، وعمليات الإدارة.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="إجمالي السجلات" value={logs.length} icon={<IconShield className="h-5 w-5" />} tone="navy" hint="في الصفحة الحالية" />
        <StatCard label="محاولات دخول فاشلة" value={failedLogins.length} icon={<IconAlert className="h-5 w-5" />} tone={failedLogins.length ? "danger" : "success"} hint="آخر ٥ محاولات" />
        <StatCard label="اسم المنصة" value={site?.nameAr ?? "نبراس"} icon={<IconUser className="h-5 w-5" />} tone="gold" hint={site?.tagline} />
        <StatCard label="بريد الدعم" value={<span className="text-sm" dir="ltr">{site?.supportEmail ?? "—"}</span>} icon={<IconCheckCircle className="h-5 w-5" />} tone="muted" hint={site?.supportPhone} />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-mist-100 px-5 py-4">
          <h2 className="font-display text-sm font-extrabold text-navy-800">سجلّ الأحداث</h2>
          <div className="flex items-center gap-1.5">
            {page > 1 && <Link href={`/admin/audit?page=${page - 1}`} className="btn btn-outline btn-sm">السابق</Link>}
            <span className="text-xs font-bold text-mist-500">صفحة {page}</span>
            <Link href={`/admin/audit?page=${page + 1}`} className="btn btn-outline btn-sm">التالي</Link>
          </div>
        </div>

        {logs.length ? (
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr>
                  <th>الحدث</th>
                  <th>المستخدم</th>
                  <th>الكيان</th>
                  <th>عنوان IP</th>
                  <th>التوقيت</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(({ log, userName, userEmail }) => {
                  const meta = ACTION_LABEL[log.action];
                  return (
                    <tr key={log.id}>
                      <td>
                        <Badge tone={meta?.tone ?? "muted"}>{meta?.label ?? log.action}</Badge>
                        {log.meta && Object.keys(log.meta as object).length > 0 && (
                          <p className="mt-1 max-w-xs truncate text-[0.68rem] font-semibold text-mist-500" dir="ltr">
                            {JSON.stringify(log.meta)}
                          </p>
                        )}
                      </td>
                      <td>
                        <p className="font-bold text-navy-800">{userName ?? "زائر"}</p>
                        {userEmail && <p className="text-xs font-semibold text-mist-500" dir="ltr">{userEmail}</p>}
                      </td>
                      <td className="text-xs font-semibold text-mist-600">
                        {log.entity ? <span dir="ltr">{log.entity}{log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}</span> : "—"}
                      </td>
                      <td className="text-xs font-semibold text-mist-500" dir="ltr">{log.ipAddress ?? "—"}</td>
                      <td className="whitespace-nowrap text-xs text-mist-500">
                        {formatDateTime(log.createdAt)}
                        <span className="mr-1.5 text-mist-400">({relativeTime(log.createdAt)})</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState icon={<IconShield className="h-6 w-6" />} title="لا أحداث مسجّلة بعد" description="ستظهر هنا العمليات فور تنفيذها من المستخدمين أو الإدارة." /></div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
          <IconLock className="h-4.5 w-4.5 text-gold-600" />
          سياسات الأمان المطبّقة في نبراس
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "تشفير كلمات المرور بخوارزمية scrypt مع salt فريد لكل مستخدم ومقارنة زمنية آمنة.",
            "جلسات مخزّنة كرمز عشوائي مُوقَّع بـ HMAC، ويُحفظ في قاعدة البيانات بصمة SHA-256 فقط.",
            "كوكي الجلسة httpOnly وSameSite=Lax وSecure في الإنتاج، مع إمكانية إلغاء الجلسة من قاعدة البيانات.",
            "تحديد معدل الطلبات (Rate Limiting) على التسجيل والدخول والتحقق من الشهادات ورسائل التواصل.",
            "التحقق من الصلاحيات في الخادم لكل مسار إداري (requireAdmin) مع رفض أي طلب غير مصرّح به 403.",
            "التحقق من المدخلات بمخططات Zod في كل نقطة كتابة، ورسائل خطأ عربية واضحة.",
            "تصحيح الاختبارات في الخادم فقط — لا تُرسل الإجابات الصحيحة للمتصفح قبل التسليم.",
            "تعقيم محتوى الدروس قبل عرضه لإزالة الوسوم والسمات الخطرة.",
          ].map((p) => (
            <li key={p} className="flex items-start gap-2.5 rounded-xl bg-mist-50 px-4 py-3 text-[0.8rem] leading-7 text-mist-700">
              <IconCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />
              {p}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
