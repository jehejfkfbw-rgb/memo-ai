import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { COUNTRY_COOKIE, COUNTRY_LIST, getCountry } from "@/lib/countries";
import { CountryFlag } from "@/components/country-flag";
import { ContactForm } from "@/components/contact-form";
import { Badge, Card } from "@/components/ui";
import { IconChevronLeft, IconClock, IconMail, IconPhone, IconShield } from "@/components/icons";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تواصل معنا", description: "تواصل مع فريق دعم نبراس لأي استفسار أو اقتراح أو شراكة." };

export default async function ContactPage() {
  const [user, store] = await Promise.all([getCurrentUser(), cookies()]);
  const country = getCountry(user?.country ?? store.get(COUNTRY_COOKIE)?.value);
  const [totalRow, recent] = await Promise.all([
    db.select({ v: count() }).from(contactMessages),
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(3),
  ]);

  const channels = [
    { icon: <IconMail className="h-5 w-5" />, title: "البريد الإلكتروني", value: "support@nebras.app", href: "mailto:support@nebras.app", hint: "للاستفسارات العامة والشراكات" },
    { icon: <IconPhone className="h-5 w-5" />, title: "الهاتف", value: "+966 55 000 0000", href: "tel:+966550000000", hint: "من الأحد إلى الخميس" },
    { icon: <IconClock className="h-5 w-5" />, title: "ساعات الدعم", value: "٩ ص – ٦ م", href: null, hint: `بتوقيت ${country.nameAr} (${country.timezone.replace("_", " ")})` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-3 flex items-center gap-2 text-xs font-semibold text-mist-500" aria-label="مسار التنقل">
        <Link href="/" className="transition hover:text-navy-700">الرئيسية</Link>
        <IconChevronLeft className="h-3.5 w-3.5" />
        <span className="text-navy-700">تواصل معنا</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h1 className="font-display text-[2rem] font-extrabold leading-tight text-navy-800">نحن هنا لمساعدتك</h1>
          <p className="mt-3 max-w-xl text-sm leading-8 text-mist-600">
            سواء كنت طالبًا يواجه مشكلة تقنية، أو معلمًا يرغب في نشر كورس، أو مدرسة تبحث عن اتفاقية مؤسسية —
            اكتب لنا وسيتولى فريق نبراس متابعة طلبك.
          </p>

          <div className="mt-8">
            <ContactForm defaultName={user?.fullName ?? ""} defaultEmail={user?.email ?? ""} defaultCountry={country.code} />
          </div>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="font-display text-sm font-extrabold text-navy-800">الدول التي نخدمها</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {COUNTRY_LIST.map((c) => (
                <li key={c.code} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${c.code === country.code ? "border-gold-300 bg-gold-50" : "border-mist-200 bg-white"}`}>
                  <CountryFlag code={c.code} className="h-4 w-6" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-extrabold text-navy-800">{c.nameAr}</span>
                    <span className="block text-[0.66rem] font-semibold text-mist-500" dir="ltr">{c.dial} · {c.currency}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.7rem] leading-6 text-mist-500">الدعم والأسعار وساعات العمل تُعرض حسب الدولة المختارة ({country.nameAr}).</p>
          </Card>

          {channels.map((c) => (
            <Card key={c.title} className="flex items-start gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-700 text-gold-300">{c.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-mist-500">{c.title}</p>
                {c.href ? (
                  <a href={c.href} dir="ltr" className="mt-1 block truncate text-right font-display text-base font-extrabold text-navy-800 transition hover:text-gold-600">
                    {c.value}
                  </a>
                ) : (
                  <p className="mt-1 font-display text-base font-extrabold text-navy-800">{c.value}</p>
                )}
                <p className="mt-1 text-xs text-mist-500">{c.hint}</p>
              </div>
            </Card>
          ))}

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
              <IconShield className="h-4.5 w-4.5 text-success" />
              كيف نتعامل مع رسائلكم
            </h2>
            <ul className="mt-3 space-y-2 text-[0.82rem] leading-7 text-mist-600">
              <li>• تُحفظ كل رسالة في قاعدة البيانات بحالة «جديد».</li>
              <li>• يحدّث فريق الدعم الحالة إلى «مقروء» ثم «تم الرد».</li>
              <li>• لا نشارك بريدك مع أي طرف ثالث، ولا نستخدمه إلا للرد على طلبك.</li>
            </ul>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-mist-50 px-4 py-3">
              <span className="text-xs font-bold text-mist-600">إجمالي الرسائل المستلمة</span>
              <Badge tone="navy">{totalRow[0].v}</Badge>
            </div>
          </Card>

          {recent.length > 0 && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-extrabold text-navy-800">آخر الرسائل الواردة</h2>
              <ul className="mt-3 divide-y divide-mist-100">
                {recent.map((m) => (
                  <li key={m.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[0.82rem] font-bold text-navy-800">{m.subject}</p>
                      <Badge tone={m.status === "new" ? "gold" : m.status === "replied" ? "success" : "muted"}>
                        {m.status === "new" ? "جديد" : m.status === "replied" ? "تم الرد" : "مقروء"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[0.72rem] font-semibold text-mist-500">
                      {m.name} · {formatDateTime(m.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[0.7rem] text-mist-400">تُعرض العناوين فقط؛ محتوى الرسائل خاص بفريق الدعم.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
