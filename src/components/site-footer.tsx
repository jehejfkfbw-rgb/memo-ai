import Link from "next/link";
import { NebrasWordmark } from "@/components/logo";
import { IconMail, IconPhone, IconShield } from "@/components/icons";
import { listStages } from "@/lib/data";
import { CountryFlag } from "@/components/country-flag";
import { COUNTRY_LIST } from "@/lib/countries";

export async function SiteFooter() {
  const stageList = await listStages(true);

  return (
    <footer className="mt-20 bg-navy-950 text-mist-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:px-8">
        <div>
          <NebrasWordmark tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-8 text-mist-400">
            نبراس منصة تعليمية عربية متكاملة تجمع الكورسات والدروس والاختبارات ومتابعة التقدم في مكان واحد،
            من المرحلة الابتدائية حتى التعليم الجامعي والتطوير المهني.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gold-300">
            <IconShield className="h-4 w-4" />
            نور المعرفة، طريق المستقبل
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-white">المراحل التعليمية</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {stageList.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link href={`/stages?stage=${s.slug}`} className="text-mist-400 transition hover:text-gold-300">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-white">روابط سريعة</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/courses" className="text-mist-400 transition hover:text-gold-300">تصفّح الكورسات</Link></li>
            <li><Link href="/about" className="text-mist-400 transition hover:text-gold-300">عن نبراس</Link></li>
            <li><Link href="/contact" className="text-mist-400 transition hover:text-gold-300">تواصل معنا</Link></li>
            <li><Link href="/register" className="text-mist-400 transition hover:text-gold-300">إنشاء حساب</Link></li>
            <li><Link href="/dashboard" className="text-mist-400 transition hover:text-gold-300">لوحة الطالب</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-white">الدعم</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-2.5 text-mist-400">
              <IconMail className="h-4 w-4 text-gold-400" />
              <a href="mailto:support@nebras.app" dir="ltr" className="transition hover:text-gold-300">support@nebras.app</a>
            </li>
            <li className="flex items-center gap-2.5 text-mist-400">
              <IconPhone className="h-4 w-4 text-gold-400" />
              <a href="tel:+966550000000" dir="ltr" className="transition hover:text-gold-300">+966 55 000 0000</a>
            </li>
          </ul>
          <p className="mt-5 text-xs leading-6 text-mist-500">
            ساعات الدعم: الأحد – الخميس، ٩ صباحًا حتى ٦ مساءً.
          </p>
          <div className="mt-5">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-gold-400">الدول المدعومة</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {COUNTRY_LIST.map((c) => (
                <li key={c.code} className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[0.7rem] font-bold text-mist-200">
                  <CountryFlag code={c.code} className="h-3 w-4.5" />
                  {c.nameAr}
                  <span className="text-mist-500" dir="ltr">{c.dial}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-mist-500 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} نبراس NEBRAS — جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-4">
            <span>سياسة الخصوصية</span>
            <span className="h-3 w-px bg-white/15" />
            <span>شروط الاستخدام</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
