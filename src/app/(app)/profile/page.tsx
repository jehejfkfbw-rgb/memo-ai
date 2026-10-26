import type { Metadata } from "next";
import Link from "next/link";
import { listStages } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getUserStats } from "@/lib/data";
import { Avatar, Badge, Card, StatCard } from "@/components/ui";
import { ProfileForm } from "@/components/profile-form";
import {
  IconBookOpen, IconCertificate, IconChart, IconClock, IconLayers, IconShield, IconTarget, IconUser,
} from "@/components/icons";
import { formatDateTime, ROLE_LABEL } from "@/lib/utils";
import { CountryFlag } from "@/components/country-flag";
import { getCountry } from "@/lib/countries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الملف الشخصي" };

export default async function ProfilePage() {
  const user = (await getCurrentUser())!;
  const [stageRows, stats] = await Promise.all([listStages(true), getUserStats(user.id)]);
  const stage = stageRows.find((s) => s.id === user.stageId);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">الملف الشخصي</h1>
        <p className="mt-1.5 text-sm text-mist-600">حدّث بياناتك الشخصية وأمن حسابك في منصة نبراس.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <ProfileForm
          user={{
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            city: user.city,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            stageId: user.stageId,
            role: user.role,
            country: user.country,
          }}
          stages={stageRows.map((s) => ({ id: s.id, name: s.name }))}
        />

        <aside className="space-y-5">
          <Card className="overflow-hidden p-0">
            <div className="relative bg-navy-900 px-6 py-7">
              <div className="grid-paper absolute inset-0 opacity-50" />
              <div className="relative flex items-center gap-4">
                <Avatar name={user.fullName} src={user.avatarUrl} size={64} />
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-extrabold text-white">{user.fullName}</p>
                  <p className="truncate text-xs text-mist-400" dir="ltr">{user.email}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="gold">{ROLE_LABEL[user.role] ?? user.role}</Badge>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[0.7rem] font-bold text-white/90">
                      <CountryFlag code={user.country} className="h-3 w-4.5" />
                      {getCountry(user.country).nameAr}
                    </span>
                    {stage && <Badge className="bg-white/10 text-white/85">{stage.name}</Badge>}
                  </div>
                </div>
              </div>
            </div>
            <dl className="divide-y divide-mist-100 text-sm">
              {[
                { l: "عضو منذ", v: formatDateTime(user.createdAt), icon: <IconUser className="h-4 w-4" /> },
                { l: "آخر تسجيل دخول", v: user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "—", icon: <IconClock className="h-4 w-4" /> },
                { l: "الدولة", v: getCountry(user.country).nameAr, icon: <IconShield className="h-4 w-4" /> },
                { l: "المدينة", v: user.city ?? "—", icon: <IconLayers className="h-4 w-4" /> },
                { l: "العملة المعروضة", v: getCountry(user.country).currencyAr, icon: <IconChart className="h-4 w-4" /> },
                { l: "رقم الجوال", v: user.phone ?? "—", icon: <IconShield className="h-4 w-4" />, ltr: Boolean(user.phone) },
                { l: "حالة الحساب", v: user.status === "active" ? "نشط" : "موقوف", icon: <IconTarget className="h-4 w-4" /> },
              ].map((row) => (
                <div key={row.l} className="flex items-center justify-between gap-3 px-5 py-3">
                  <dt className="inline-flex items-center gap-2 text-xs font-bold text-mist-600">
                    <span className="text-navy-500">{row.icon}</span>
                    {row.l}
                  </dt>
                  <dd className={`text-xs font-extrabold text-navy-800 ${row.ltr ? "" : ""}`} dir={row.ltr ? "ltr" : undefined}>
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <StatCard label="كورسات مسجّلة" value={stats.enrolled} icon={<IconBookOpen className="h-5 w-5" />} tone="navy" />
            <StatCard label="دروس مكتملة" value={stats.completedLessons} icon={<IconTarget className="h-5 w-5" />} tone="gold" />
            <StatCard label="متوسط الدرجات" value={`${stats.averageScore}٪`} icon={<IconChart className="h-5 w-5" />} tone={stats.averageScore >= 60 ? "success" : "warning"} />
            <StatCard label="شهادات" value={stats.certificates} icon={<IconCertificate className="h-5 w-5" />} tone="muted" />
          </div>

          {user.bio && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-extrabold text-navy-800">نبذة عنك</h2>
              <p className="mt-2 text-[0.85rem] leading-8 text-mist-600">{user.bio}</p>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-display text-sm font-extrabold text-navy-800">روابط سريعة</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li><Link href="/dashboard" className="font-semibold text-navy-600 transition hover:text-gold-600">لوحة التقدم</Link></li>
              <li><Link href="/my-courses" className="font-semibold text-navy-600 transition hover:text-gold-600">كورساتي</Link></li>
              <li><Link href="/grades" className="font-semibold text-navy-600 transition hover:text-gold-600">الدرجات والاختبارات</Link></li>
              <li><Link href="/certificates" className="font-semibold text-navy-600 transition hover:text-gold-600">شهاداتي</Link></li>
              <li><Link href="/contact" className="font-semibold text-navy-600 transition hover:text-gold-600">الدعم الفني</Link></li>
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}
