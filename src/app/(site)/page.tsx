import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons, quizzes, users } from "@/db/schema";
import { listAnnouncements, listCourses, stagesWithCounts } from "@/lib/data";
import { CourseCard } from "@/components/course-card";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { NebrasMark } from "@/components/logo";
import {
  IconBell, IconCertificate, IconChart, IconCheckCircle, IconClock, IconLayers,
  IconQuiz, IconShield, IconSpark, IconTarget, IconTrend, IconUsers, StageIcon,
} from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { CountryFlag } from "@/components/country-flag";
import { COUNTRY_LIST, COUNTRY_COOKIE, getCountry } from "@/lib/countries";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const store = await cookies();
  const country = getCountry(user?.country ?? store.get(COUNTRY_COOKIE)?.value);
  const [stageList, featured, latest, news] = await Promise.all([
    stagesWithCounts(),
    listCourses({ featured: true, limit: 3 }),
    listCourses({ limit: 6 }),
    listAnnouncements(true, 3),
  ]);

  const [courseCount, lessonCount, quizCount, studentCount] = await Promise.all([
    db.select({ v: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ v: count() }).from(lessons),
    db.select({ v: count() }).from(quizzes),
    db.select({ v: count() }).from(users).where(eq(users.role, "student")),
  ]);

  const stats = [
    { label: "كورس منشور", value: courseCount[0].v, icon: <IconLayers className="h-5 w-5" /> },
    { label: "درس تفاعلي", value: lessonCount[0].v, icon: <IconClock className="h-5 w-5" /> },
    { label: "اختبار إلكتروني", value: quizCount[0].v, icon: <IconQuiz className="h-5 w-5" /> },
    { label: "متعلّم مسجّل", value: studentCount[0].v, icon: <IconUsers className="h-5 w-5" /> },
  ];

  const steps = [
    { n: "١", title: "أنشئ حسابك مجانًا", text: "سجّل ببريدك الإلكتروني واختر مرحلتك الدراسية لتظهر لك الكورسات المناسبة.", icon: <IconSpark className="h-5 w-5" /> },
    { n: "٢", title: "اختر كورسك وابدأ", text: "تصفّح المنهج، شاهد الدروس، ونزّل الملخصات، وتابع من حيث توقفت في أي جهاز.", icon: <IconLayers className="h-5 w-5" /> },
    { n: "٣", title: "اختبر نفسك فورًا", text: "اختبارات تُصحَّح آليًا في الخادم مع شرح لكل إجابة خاطئة ودرجة نجاح واضحة.", icon: <IconTarget className="h-5 w-5" /> },
    { n: "٤", title: "تابع تقدمك واحصل على شهادتك", text: "نسبة إنجاز لكل كورس، سجلّ درجات كامل، وشهادة إتمام برمز تحقّق عند إنهاء المنهج.", icon: <IconCertificate className="h-5 w-5" /> },
  ];

  const features = [
    { title: "تصحيح آلي عادل", text: "تُحسب الدرجات في الخادم فقط، فلا تصل الإجابات الصحيحة إلى المتصفح قبل التسليم.", icon: <IconShield className="h-5 w-5" /> },
    { title: "تتبّع تقدم دقيق", text: "نسبة إنجاز لكل كورس، وقت دراسة تراكمي، وآخر درس وصلت إليه.", icon: <IconChart className="h-5 w-5" /> },
    { title: "شهادات قابلة للتحقق", text: "شهادة إتمام برمز فريد لكل طالب وكورس تُصدر تلقائيًا عند بلوغ ١٠٠٪.", icon: <IconCertificate className="h-5 w-5" /> },
    { title: "لكل المراحل", text: "ابتدائي، إعدادي، ثانوي، جامعي، ومهارات مهنية — مع مواد مصنّفة لكل مرحلة.", icon: <IconLayers className="h-5 w-5" /> },
    { title: "إعلانات ومنشورات", text: "أخبار المنصة والمسابقات تصل للطلاب مباشرة في لوحة التحكم.", icon: <IconBell className="h-5 w-5" /> },
    { title: "واجهة عربية أصيلة", text: "تصميم RTL كامل، خطوط عربية مريحة، ومتجاوب مع الجوال والحاسوب.", icon: <IconTrend className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* -------------------------------- البطل -------------------------------- */}
      <section className="relative overflow-hidden bg-navy-900">
        <div className="grid-paper absolute inset-0 opacity-70" />
        <div
          className="absolute -left-24 top-10 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #C9A227 0%, transparent 70%)" }}
        />
        <div
          className="absolute -right-20 bottom-0 h-80 w-80 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #35639F 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24 lg:px-8">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1.5 text-xs font-bold text-gold-300">
              <NebrasMark className="h-4 w-4" tone="light" />
              منصة تعليمية عربية ذكية
            </span>

            <h1 className="mt-6 font-display text-[2.1rem] font-extrabold leading-[1.25] text-white sm:text-[2.9rem] lg:text-[3.3rem]">
              نبراس — نور المعرفة،
              <span className="block bg-gradient-to-l from-gold-300 to-gold-500 bg-clip-text text-transparent">طريق المستقبل</span>
            </h1>

            <p className="mt-5 max-w-xl text-[0.98rem] leading-9 text-mist-300 sm:text-[1.05rem]">
              تعلّم وفق مرحلتك الدراسية من الابتدائي حتى الجامعي: كورسات منظّمة، دروس مقسّمة، اختبارات تُصحَّح فورًا،
              ومتابعة دقيقة لتقدمك الدراسي — كل ذلك في لوحة واحدة واضحة باللغة العربية.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={user ? "/dashboard" : "/register"} className="btn btn-gold px-6 py-3 text-[0.95rem]">
                {user ? "اذهب إلى لوحتي" : "ابدأ التعلّم مجانًا"}
              </Link>
              <Link href="/courses" className="btn border-white/25 bg-white/5 px-6 py-3 text-[0.95rem] text-white hover:bg-white/10">
                تصفّح الكورسات
              </Link>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
                  <dt className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-mist-400">
                    <span className="text-gold-400">{s.icon}</span>
                    {s.label}
                  </dt>
                  <dd className="mt-1.5 font-display text-2xl font-extrabold tabular-nums text-white">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* لوحة توضيحية مرسومة برمجيًا */}
          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="rounded-3xl border border-white/12 bg-white/[0.07] p-4 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] backdrop-blur-sm">
              <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <NebrasMark className="h-8 w-8" />
                  <div>
                    <p className="text-xs font-extrabold text-navy-800">لوحة الطالب</p>
                    <p className="text-[0.68rem] text-mist-500">مرحبًا بعودتك 👋</p>
                  </div>
                </div>
                <span className="rounded-full bg-success-soft px-2.5 py-1 text-[0.66rem] font-bold text-success">متصل</span>
              </div>

              <div className="mt-3 space-y-3 rounded-2xl bg-white p-4">
                {[
                  { name: "الفيزياء: الحركة والقوى", p: 72, tone: "#1B3A6B" },
                  { name: "مقدمة في برمجة الويب", p: 45, tone: "#C9A227" },
                  { name: "مهارات التفكير النقدي", p: 100, tone: "#1F8A5F" },
                ].map((row) => (
                  <div key={row.name}>
                    <div className="mb-1.5 flex items-center justify-between text-[0.72rem] font-semibold text-mist-700">
                      <span className="truncate">{row.name}</span>
                      <span className="tabular-nums text-mist-500">{row.p}٪</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-mist-100">
                      <div className="h-full rounded-full" style={{ width: `${row.p}%`, background: row.tone }} />
                    </div>
                  </div>
                ))}

                <div className="mt-1 grid grid-cols-3 gap-2 border-t border-mist-100 pt-3">
                  {[
                    { l: "متوسط الدرجات", v: "٨٧٪" },
                    { l: "دروس مكتملة", v: "٢٤" },
                    { l: "شهادات", v: "١" },
                  ].map((m) => (
                    <div key={m.l} className="rounded-xl bg-mist-50 px-2.5 py-2 text-center">
                      <p className="font-display text-sm font-extrabold text-navy-800">{m.v}</p>
                      <p className="mt-0.5 text-[0.62rem] font-semibold text-mist-500">{m.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-gold-500/25 bg-gold-500/10 px-4 py-3">
                <IconCheckCircle className="h-5 w-5 shrink-0 text-gold-400" />
                <p className="text-[0.72rem] font-semibold leading-6 text-gold-200">
                  اختباراتك تُصحَّح في الخادم وتُحفظ في قاعدة البيانات لحظيًا
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- المراحل ------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="لكل مرحلة مسارها"
          title="اختر مرحلتك التعليمية"
          description="محتوى مصنّف حسب المرحلة والمادة، ويمكنك التنقّل بين المراحل بحرية في أي وقت."
          action={<Link href="/stages" className="btn btn-outline btn-sm">كل المراحل</Link>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {stageList.map((stage) => (
            <Link key={stage.id} href={`/courses?stage=${stage.id}`} className="card card-hover group p-5">
              <span
                className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white transition group-hover:scale-105"
                style={{ background: stage.accent ?? "#1B3A6B" }}
              >
                <StageIcon iconKey={stage.iconKey} className="h-6 w-6" />
              </span>
              <h3 className="font-display text-[0.98rem] font-bold text-navy-800">{stage.name}</h3>
              <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-6 text-mist-600">{stage.description}</p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold-600">
                <IconLayers className="h-4 w-4" />
                {stage.courseCount} كورس
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------- كورسات مميّزة ---------------------------- */}
      <section className="bg-mist-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="اختيار فريق نبراس"
            title="كورسات مميّزة هذا الفصل"
            description="مقررات اختيرت لجودة محتواها وكثرة إقبال الطلاب عليها."
            action={<Link href="/courses" className="btn btn-outline btn-sm">عرض الكل</Link>}
          />
          {featured.items.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featured.items.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          ) : (
            <Card className="p-10 text-center text-sm text-mist-600">لا توجد كورسات مميّزة بعد.</Card>
          )}
        </div>
      </section>

      {/* ------------------------------ كيف يعمل ------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading align="center" eyebrow="بخطوات واضحة" title="كيف تتعلّم مع نبراس؟" />
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <Card key={s.n} className="relative p-6">
              <span className="absolute left-5 top-5 font-display text-4xl font-extrabold text-mist-100">{s.n}</span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-navy-700 text-gold-300">{s.icon}</span>
              <h3 className="mt-4 font-display text-[1rem] font-bold text-navy-800">{s.title}</h3>
              <p className="mt-2 text-[0.85rem] leading-7 text-mist-600">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------ المزايا ------------------------------ */}
      <section className="relative overflow-hidden bg-navy-800 py-16">
        <div className="grid-paper absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="لماذا نبراس"
            title="منصة مبنية على وضوح المحتوى وأمان البيانات"
            description="كل ميزة هنا مرتبطة بوظيفة فعلية في النظام، لا بمجرد واجهة."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/12 bg-white/[0.06] p-5 transition hover:border-gold-500/40 hover:bg-white/[0.09]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-300">{f.icon}</span>
                <h3 className="mt-3.5 font-display text-[0.98rem] font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-[0.84rem] leading-7 text-mist-300">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------- أحدث الكورسات --------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="أُضيفت مؤخرًا"
          title="أحدث الكورسات على المنصة"
          action={<Link href="/courses" className="btn btn-outline btn-sm">تصفّح المكتبة</Link>}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {latest.items.map((c) => <CourseCard key={c.id} course={c} />)}
        </div>
      </section>

      {/* --------------------------- الدول المدعومة --------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="card overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist-100 bg-mist-50 px-6 py-4">
            <div>
              <h2 className="font-display text-base font-extrabold text-navy-800">نخدم أربع دول عربية</h2>
              <p className="mt-1 text-xs font-semibold text-mist-600">
                الأسعار والعملة ورمز الاتصال وساعات الدعم تُضبط تلقائيًا حسب دولتك — الحالية: <b className="text-navy-800">{country.nameAr}</b> ({country.currencyAr}).
              </p>
            </div>
            <Link href="/contact" className="btn btn-outline btn-sm">دعم دولتك</Link>
          </div>
          <ul className="grid divide-y divide-mist-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            {COUNTRY_LIST.map((c) => (
              <li key={c.code} className={`flex items-center gap-3 px-6 py-5 ${c.code === country.code ? "bg-navy-50" : ""}`}>
                <CountryFlag code={c.code} className="h-7 w-10 shrink-0" />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
                    {c.nameAr}
                    {c.code === country.code && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[0.6rem] font-bold text-gold-700">دولتك</span>}
                  </p>
                  <p className="mt-0.5 text-[0.7rem] font-semibold text-mist-500" dir="ltr">{c.dial} · {c.currency} · {c.timezone}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------ الإعلانات ------------------------------ */}
      {news.length > 0 && (
        <section className="bg-mist-50 py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow="من المنصة" title="آخر الإعلانات والأخبار" />
            <div className="space-y-3">
              {news.map(({ announcement, authorName }) => (
                <Card key={announcement.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
                    <IconBell className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-[0.98rem] font-bold text-navy-800">{announcement.title}</h3>
                      <Badge tone="muted">{relativeTime(announcement.publishedAt)}</Badge>
                      {authorName && <Badge tone="gold">{authorName}</Badge>}
                    </div>
                    <p className="mt-2 text-[0.86rem] leading-7 text-mist-600">{announcement.body}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* -------------------------------- CTA -------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 pb-4 pt-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-navy-800 via-navy-700 to-navy-900 px-6 py-12 text-center sm:px-12">
          <div className="grid-paper absolute inset-0 opacity-50" />
          <div className="relative mx-auto max-w-2xl">
            <NebrasMark className="mx-auto h-14 w-14" tone="light" />
            <h2 className="mt-5 font-display text-2xl font-extrabold text-white sm:text-[2rem]">
              ابدأ رحلتك مع نبراس اليوم
            </h2>
            <p className="mt-3 text-sm leading-8 text-mist-300">
              التسجيل مجاني، ومكتبة الكورسات متاحة فور إنشاء حسابك. اختر مرحلتك واترك لنا تنظيم الطريق.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="btn btn-gold px-6 py-3">إنشاء حساب مجاني</Link>
              <Link href="/contact" className="btn border-white/25 bg-white/5 px-6 py-3 text-white hover:bg-white/10">تحدّث مع فريق الدعم</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
