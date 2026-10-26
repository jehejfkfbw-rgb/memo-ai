import type { Metadata } from "next";
import { listStages } from "@/lib/data";
import { ResourceManager, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/resource-manager";
import { Badge } from "@/components/ui";
import { ROLE_LABEL, formatDateTime, relativeTime } from "@/lib/utils";
import { CountryFlag } from "@/components/country-flag";
import { COUNTRY_LIST, getCountry } from "@/lib/countries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إدارة المستخدمين" };

const ROLE_MAP: Record<string, { label: string; tone: "navy" | "gold" | "muted" }> = {
  admin: { label: "مدير", tone: "gold" },
  teacher: { label: "معلم", tone: "navy" },
  student: { label: "طالب", tone: "muted" },
};

export default async function AdminUsersPage() {
  const stageRows = await listStages();
  const stageOptions = stageRows.map((s) => ({ value: s.id, label: s.name }));

  const fields: FieldDef[] = [
    { name: "fullName", label: "الاسم الكامل", type: "text", required: true, placeholder: "الاسم الثلاثي" },
    { name: "email", label: "البريد الإلكتروني", type: "email", required: true, placeholder: "name@example.com" },
    { name: "password", label: "كلمة المرور", type: "password", createOnly: true, hint: "٨ خانات على الأقل — عند التعديل اتركه فارغًا لعدم التغيير", placeholder: "••••••••" },
    { name: "role", label: "الصلاحية", type: "select", options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })), defaultValue: "student" },
    { name: "status", label: "حالة الحساب", type: "select", options: [{ value: "active", label: "نشط" }, { value: "suspended", label: "موقوف" }], defaultValue: "active" },
    { name: "stageId", label: "المرحلة الدراسية", type: "select", options: stageOptions },
    { name: "phone", label: "رقم الجوال", type: "text", placeholder: "+966 5X XXX XXXX" },
    { name: "country", label: "الدولة (مدعومة فقط)", type: "select", required: true, options: COUNTRY_LIST.map((c) => ({ value: c.code, label: `${c.nameAr} — ${c.dial}` })), defaultValue: "EG", hint: "المنصة محصورة في: مصر، السعودية، الأردن، الإمارات" },
    { name: "city", label: "المدينة", type: "text" },
    { name: "bio", label: "نبذة", type: "textarea" },
    { name: "isActive", label: "الحساب مفعّل", type: "boolean", defaultValue: true, hint: "إلغاء التفعيل يمنع تسجيل الدخول فورًا" },
  ];

  const columns: ColumnDef[] = [
    {
      key: "fullName",
      label: "المستخدم",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-navy-800">{String(row.fullName)}</p>
          <p className="truncate text-xs font-semibold text-mist-500" dir="ltr">{String(row.email)}</p>
        </div>
      ),
    },
    { key: "role", label: "الصلاحية", render: (row) => <StatusBadge value={row.role} map={ROLE_MAP} /> },
    {
      key: "status",
      label: "الحالة",
      render: (row) => (
        <span className="flex flex-wrap gap-1.5">
          <Badge tone={row.status === "active" ? "success" : "danger"}>{row.status === "active" ? "نشط" : "موقوف"}</Badge>
          {!row.isActive && <Badge tone="warning">معطّل</Badge>}
        </span>
      ),
    },
    {
      key: "country",
      label: "الدولة",
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <CountryFlag code={String(row.country ?? "")} className="h-3.5 w-5" />
          <span className="text-xs font-bold text-navy-800">{row.country ? getCountry(String(row.country)).nameAr : "غير محددة"}</span>
        </span>
      ),
    },
    { key: "stageName", label: "المرحلة", hideOnMobile: true, render: (row) => String(row.stageName ?? "—") },
    { key: "lastLoginAt", label: "آخر دخول", hideOnMobile: true, render: (row) => (row.lastLoginAt ? relativeTime(String(row.lastLoginAt)) : "لم يسجل دخول") },
    { key: "createdAt", label: "تاريخ الانضمام", hideOnMobile: true, render: (row) => formatDateTime(String(row.createdAt)) },
  ];

  return (
    <ResourceManager
      entity="users"
      title="إدارة المستخدمين"
      description="إنشاء الحسابات، منح الصلاحيات (طالب / معلم / مدير)، إيقاف الحسابات، وإعادة تعيين كلمات المرور."
      createLabel="إضافة مستخدم"
      fields={fields}
      columns={columns}
      pageSize={12}
      filters={[
        { name: "role", label: "كل الصلاحيات", options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })) },
        { name: "status", label: "كل الحالات", options: [{ value: "active", label: "نشط" }, { value: "suspended", label: "موقوف" }] },
        { name: "country", label: "كل الدول", options: COUNTRY_LIST.map((c) => ({ value: c.code, label: c.nameAr })) },
      ]}
      emptyHint="لا مستخدمين مطابقين — جرّب مسح البحث أو أضف مستخدمًا جديدًا."
    />
  );
}
