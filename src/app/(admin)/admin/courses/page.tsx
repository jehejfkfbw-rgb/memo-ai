import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { listStages, listSubjects } from "@/lib/data";
import { ResourceManager, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui";
import { LEVEL_LABEL, STATUS_LABEL, formatDate, formatDuration } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إدارة الكورسات" };

export default async function AdminCoursesPage() {
  const [stageRows, subjectRows, teacherRows] = await Promise.all([
    listStages(),
    listSubjects(),
    db.select({ id: users.id, fullName: users.fullName }).from(users).where(eq(users.role, "teacher")),
  ]);

  const fields: FieldDef[] = [
    { name: "title", label: "عنوان الكورس", type: "text", required: true, placeholder: "مثال: الفيزياء — الحركة والقوى" },
    { name: "stageId", label: "المرحلة التعليمية", type: "select", required: true, options: stageRows.map((s) => ({ value: s.id, label: s.name })) },
    { name: "subjectId", label: "المادة", type: "select", options: subjectRows.map((s) => ({ value: s.id, label: `${s.name} — ${stageRows.find((x) => x.id === s.stageId)?.name ?? ""}` })) },
    { name: "teacherId", label: "المعلم المسؤول", type: "select", options: teacherRows.map((t) => ({ value: t.id, label: t.fullName })) },
    { name: "level", label: "المستوى", type: "select", options: Object.entries(LEVEL_LABEL).map(([value, label]) => ({ value, label })), defaultValue: "beginner" },
    { name: "status", label: "حالة النشر", type: "select", options: Object.entries(STATUS_LABEL).filter(([k]) => ["draft", "published", "archived"].includes(k)).map(([value, label]) => ({ value, label })), defaultValue: "published" },
    { name: "durationMinutes", label: "المدة الإجمالية (دقيقة)", type: "number", defaultValue: 0 },
    { name: "price", label: "السعر (٠ = مجاني)", type: "number", defaultValue: 0 },
    { name: "summary", label: "ملخص قصير", type: "textarea", placeholder: "جملة أو جملتان تظهران في بطاقة الكورس" },
    { name: "description", label: "الوصف الكامل", type: "richtext", placeholder: "اكتب وصفًا تفصيليًا… يمكنك استخدام وسوم HTML بسيطة مثل <p> و<strong>" },
    { name: "learningOutcomes", label: "مخرجات التعلّم", type: "tags", placeholder: "ماذا سيتقن الطالب؟", hint: "سطر لكل مخرَج تعليمي" },
    { name: "requirements", label: "المتطلبات", type: "tags", placeholder: "متطلب سابق", hint: "سطر لكل متطلب" },
    { name: "coverUrl", label: "رابط صورة الغلاف", type: "text", hint: "اختياري — إن تُرك فارغًا يُولَّد غلاف هندسي تلقائيًا" },
    { name: "isFeatured", label: "كورس مميّز", type: "boolean", hint: "يظهر في القسم المميّز بالصفحة الرئيسية" },
    { name: "isFree", label: "التسجيل مجاني", type: "boolean", defaultValue: true },
  ];

  const columns: ColumnDef[] = [
    {
      key: "title",
      label: "الكورس",
      render: (row) => (
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold text-navy-800">
            <span className="truncate">{String(row.title)}</span>
            {Boolean(row.isFeatured) && <Badge tone="gold">مميّز</Badge>}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-mist-500">
            {String(row.stageName ?? "—")}{row.subjectName ? ` · ${String(row.subjectName)}` : ""}
          </p>
        </div>
      ),
    },
    { key: "level", label: "المستوى", render: (row) => <Badge tone="navy">{LEVEL_LABEL[String(row.level)] ?? String(row.level)}</Badge> },
    { key: "status", label: "الحالة", render: (row) => <StatusBadge value={row.status} map={{ published: { label: "منشور", tone: "success" }, draft: { label: "مسودة", tone: "warning" }, archived: { label: "مؤرشف", tone: "muted" } }} /> },
    { key: "teacherName", label: "المعلم", hideOnMobile: true, render: (row) => String(row.teacherName ?? "—") },
    { key: "durationMinutes", label: "المدة", hideOnMobile: true, render: (row) => formatDuration(Number(row.durationMinutes ?? 0)) },
    { key: "createdAt", label: "أُضيف في", hideOnMobile: true, render: (row) => formatDate(String(row.createdAt)) },
  ];

  return (
    <ResourceManager
      entity="courses"
      title="إدارة الكورسات"
      description="أنشئ الكورسات وعدّلها وانشرها، ثم ادخل إلى الكورس لإدارة دروسه واختباراته وأسئلته."
      createLabel="كورس جديد"
      fields={fields}
      columns={columns}
      pageSize={10}
      rowLink={(row) => `/admin/courses/${String(row.id)}`}
      filters={[
        { name: "stageId", label: "كل المراحل", options: stageRows.map((s) => ({ value: s.id, label: s.name })) },
        { name: "status", label: "كل الحالات", options: [{ value: "published", label: "منشور" }, { value: "draft", label: "مسودة" }, { value: "archived", label: "مؤرشف" }] },
      ]}
      emptyHint="لا كورسات مطابقة — أنشئ كورسًا جديدًا أو غيّر عوامل التصفية."
    />
  );
}
