import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { certificates, courses, quizAttempts, quizzes, users } from "@/db/schema";
import { listCourses } from "@/lib/data";
import { ResourceManager, type ColumnDef, type FieldDef } from "@/components/admin/resource-manager";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatDateTime, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "التسجيلات والدرجات" };

export default async function AdminLearnersPage() {
  const [{ items: courseItems }, attempts, certs] = await Promise.all([
    listCourses({ limit: 100 }),
    db
      .select({ attempt: quizAttempts, quizTitle: quizzes.title, userName: users.fullName, userEmail: users.email })
      .from(quizAttempts)
      .innerJoin(quizzes, eq(quizzes.id, quizAttempts.quizId))
      .innerJoin(users, eq(users.id, quizAttempts.userId))
      .orderBy(desc(quizAttempts.submittedAt))
      .limit(12),
    db
      .select({ certificate: certificates, userName: users.fullName, courseTitle: courses.title })
      .from(certificates)
      .innerJoin(users, eq(users.id, certificates.userId))
      .innerJoin(courses, eq(courses.id, certificates.courseId))
      .orderBy(desc(certificates.issuedAt))
      .limit(8),
  ]);

  const enrollmentFields: FieldDef[] = [
    { name: "status", label: "حالة التسجيل", type: "select", options: [{ value: "in_progress", label: "قيد التقدّم" }, { value: "completed", label: "مكتمل" }, { value: "dropped", label: "منسحب" }] },
    { name: "progressPercent", label: "نسبة الإنجاز (٠-١٠٠)", type: "number", defaultValue: 0 },
  ];

  const enrollmentColumns: ColumnDef[] = [
    { key: "userName", label: "الطالب", render: (row) => <span className="font-bold text-navy-800">{String(row.userName ?? "—")}</span> },
    { key: "userEmail", label: "البريد", hideOnMobile: true, render: (row) => <span dir="ltr" className="text-xs font-semibold text-mist-500">{String(row.userEmail ?? "—")}</span> },
    { key: "courseTitle", label: "الكورس", render: (row) => String(row.courseTitle ?? "—") },
    { key: "progressPercent", label: "الإنجاز", render: (row) => (
      <span className="inline-flex items-center gap-2">
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-mist-200">
          <span className="block h-full rounded-full bg-navy-600" style={{ width: `${Number(row.progressPercent ?? 0)}%` }} />
        </span>
        <b className="tabular-nums text-xs">{Number(row.progressPercent ?? 0)}٪</b>
      </span>
    ) },
    { key: "status", label: "الحالة", render: (row) => <Badge tone={row.status === "completed" ? "success" : row.status === "dropped" ? "danger" : "navy"}>{row.status === "completed" ? "مكتمل" : row.status === "dropped" ? "منسحب" : "قيد التقدّم"}</Badge> },
    { key: "enrolledAt", label: "تاريخ التسجيل", hideOnMobile: true, render: (row) => relativeTime(String(row.enrolledAt)) },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">التسجيلات والدرجات</h1>
        <p className="mt-1.5 text-sm text-mist-600">من سجّل في أي كورس، وما نسبة إنجازه، ودرجات الاختبارات والشهادات الصادرة.</p>
      </div>

      <ResourceManager
        entity="enrollments"
        title="تسجيلات الطلاب في الكورسات"
        description="يمكنك تعديل نسبة الإنجاز أو حالة التسجيل يدويًا عند الحاجة."
        createLabel="تسجيل يدوي"
        fields={enrollmentFields}
        columns={enrollmentColumns}
        pageSize={10}
        filters={[{ name: "status", label: "كل الحالات", options: [{ value: "in_progress", label: "قيد التقدّم" }, { value: "completed", label: "مكتمل" }, { value: "dropped", label: "منسحب" }] }]}
      />

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-mist-100 px-5 py-4">
          <h2 className="font-display text-sm font-extrabold text-navy-800">أحدث محاولات الاختبارات</h2>
          <span className="text-xs font-bold text-mist-500 tabular-nums">{attempts.length} سجل معروض</span>
        </div>
        {attempts.length ? (
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr><th>الطالب</th><th>الاختبار</th><th>الدرجة</th><th>النسبة</th><th>النتيجة</th><th>التوقيت</th></tr>
              </thead>
              <tbody>
                {attempts.map(({ attempt, quizTitle, userName }) => (
                  <tr key={attempt.id}>
                    <td className="font-bold text-navy-800">{userName}</td>
                    <td className="text-mist-600">{quizTitle}</td>
                    <td className="tabular-nums">{attempt.score}/{attempt.totalPoints}</td>
                    <td className="font-extrabold tabular-nums text-navy-800">{attempt.percent}٪</td>
                    <td><Badge tone={attempt.passed ? "success" : "danger"}>{attempt.passed ? "ناجح" : "لم يجتز"}</Badge></td>
                    <td className="whitespace-nowrap text-xs text-mist-500">{formatDateTime(attempt.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6"><EmptyState title="لا محاولات مسجّلة بعد" /></div>
        )}
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-mist-100 px-5 py-4">
          <h2 className="font-display text-sm font-extrabold text-navy-800">الشهادات الصادرة</h2>
          <span className="text-xs font-bold text-mist-500 tabular-nums">{certs.length}</span>
        </div>
        {certs.length ? (
          <ul className="divide-y divide-mist-100">
            {certs.map(({ certificate, userName, courseTitle }) => (
              <li key={certificate.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-navy-800">{userName}</p>
                  <p className="truncate text-xs font-semibold text-mist-500">{courseTitle}</p>
                </div>
                <Badge tone="gold" className="font-mono" ><span dir="ltr">{certificate.code}</span></Badge>
                <Badge tone="success">{certificate.grade}٪</Badge>
                <span className="text-xs font-semibold text-mist-400">{formatDateTime(certificate.issuedAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6"><EmptyState title="لا شهادات صادرة بعد" description="تُصدر الشهادة تلقائيًا عند إتمام الطالب ١٠٠٪ من دروس الكورس." /></div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-sm font-extrabold text-navy-800">روابط سريعة</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {courseItems.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/admin/courses/${c.id}`} className="btn btn-outline btn-sm">{c.title}</Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
