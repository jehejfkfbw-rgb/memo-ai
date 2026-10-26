import type { Metadata } from "next";
import { listStages } from "@/lib/data";
import { ResourceManager, type ColumnDef, type FieldDef } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المراحل والمواد" };

const ICON_OPTIONS = [
  { value: "seedling", label: "نبتة (ابتدائي)" },
  { value: "compass", label: "بوصلة (إعدادي)" },
  { value: "flask", label: "قارورة (علوم)" },
  { value: "graduation", label: "قبعة تخرّج (جامعي)" },
  { value: "spark", label: "شرارة (مهارات)" },
  { value: "book", label: "كتاب" },
  { value: "layers", label: "طبقات" },
];

export default async function AdminTaxonomyPage() {
  const stageRows = await listStages();

  const stageFields: FieldDef[] = [
    { name: "name", label: "اسم المرحلة (عربي)", type: "text", required: true, placeholder: "المرحلة الثانوية" },
    { name: "nameEn", label: "الاسم بالإنجليزية", type: "text", required: true, placeholder: "High School" },
    { name: "iconKey", label: "الأيقونة", type: "select", options: ICON_OPTIONS, defaultValue: "book" },
    { name: "accent", label: "لون المرحلة", type: "color", defaultValue: "#1B3A6B", hint: "يُستخدم في البطاقات والأغلفة" },
    { name: "sortOrder", label: "ترتيب العرض", type: "number", defaultValue: 0 },
    { name: "description", label: "الوصف", type: "textarea" },
    { name: "isActive", label: "مرحلة مفعّلة", type: "boolean", defaultValue: true },
  ];

  const stageColumns: ColumnDef[] = [
    {
      key: "name",
      label: "المرحلة",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-6 shrink-0 rounded-md ring-1 ring-mist-200" style={{ background: String(row.accent ?? "#1B3A6B") }} />
          <div className="min-w-0">
            <p className="truncate font-bold text-navy-800">{String(row.name)}</p>
            <p className="truncate text-xs font-semibold text-mist-500" dir="ltr">{String(row.nameEn)}</p>
          </div>
        </div>
      ),
    },
    { key: "iconKey", label: "الأيقونة", hideOnMobile: true, render: (row) => <Badge tone="muted">{ICON_OPTIONS.find((o) => o.value === row.iconKey)?.label ?? String(row.iconKey)}</Badge> },
    { key: "sortOrder", label: "الترتيب", hideOnMobile: true },
    { key: "isActive", label: "الحالة", render: (row) => <Badge tone={row.isActive ? "success" : "muted"}>{row.isActive ? "مفعّلة" : "مخفية"}</Badge> },
  ];

  const subjectFields: FieldDef[] = [
    { name: "stageId", label: "المرحلة", type: "select", required: true, options: stageRows.map((s) => ({ value: s.id, label: s.name })) },
    { name: "name", label: "اسم المادة", type: "text", required: true, placeholder: "الرياضيات" },
    { name: "accent", label: "لون المادة", type: "color", defaultValue: "#C9A227" },
    { name: "sortOrder", label: "ترتيب العرض", type: "number", defaultValue: 0 },
    { name: "description", label: "الوصف", type: "textarea" },
    { name: "isActive", label: "مادة مفعّلة", type: "boolean", defaultValue: true },
  ];

  const subjectColumns: ColumnDef[] = [
    {
      key: "name",
      label: "المادة",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-6 shrink-0 rounded-md ring-1 ring-mist-200" style={{ background: String(row.accent ?? "#C9A227") }} />
          <p className="truncate font-bold text-navy-800">{String(row.name)}</p>
        </div>
      ),
    },
    { key: "stageName", label: "المرحلة", render: (row) => <Badge tone="navy">{String(row.stageName ?? "—")}</Badge> },
    { key: "sortOrder", label: "الترتيب", hideOnMobile: true },
    { key: "isActive", label: "الحالة", render: (row) => <Badge tone={row.isActive ? "success" : "muted"}>{row.isActive ? "مفعّلة" : "مخفية"}</Badge> },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">المراحل والمواد</h1>
        <p className="mt-1.5 text-sm text-mist-600">
          هيكل المنصة التعليمي: أضف مرحلة جديدة (مثل «الدبلومات المهنية») ثم موادها، وستظهر فورًا في الموقع وفي filters الكورسات.
        </p>
      </div>

      <ResourceManager
        entity="stages"
        title="المراحل التعليمية"
        description="ترتيب العرض يتحكم في تسلسل المراحل على الصفحة الرئيسية وصفحة المراحل."
        createLabel="مرحلة جديدة"
        fields={stageFields}
        columns={stageColumns}
        pageSize={10}
      />

      <ResourceManager
        entity="subjects"
        title="المواد الدراسية"
        description="كل مادة تنتمي لمرحلة واحدة، ويمكن ربط الكورسات بها لتسهيل التصفية."
        createLabel="مادة جديدة"
        fields={subjectFields}
        columns={subjectColumns}
        pageSize={10}
        filters={[{ name: "stageId", label: "كل المراحل", options: stageRows.map((s) => ({ value: s.id, label: s.name })) }]}
      />
    </div>
  );
}
