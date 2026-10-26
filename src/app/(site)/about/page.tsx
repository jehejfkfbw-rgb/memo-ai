import type { Metadata } from "next";
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons, quizzes, stages, users } from "@/db/schema";
import { Card, SectionHeading } from "@/components/ui";
import { NebrasMark } from "@/components/logo";
import { IconChart, IconCheckCircle, IconEye, IconShield, IconTarget, IconTrend, IconUsers } from "@/components/icons";
import { CountryFlag } from "@/components/country-flag";
import { COUNTRY_LIST } from "@/lib/countries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "عن نبراس",
  description: "تعرف على رؤية نبراس ورسالتها وقيمها، وكيف نبني منصة تعليمية عربية موثوقة.",
};

export default async function AboutPage() {
  const [stageCount, courseCount, lessonCount, quizCount, userCount] = await Promise.all([
    db.select({ v: count() }).from(stages),
    db.select({ v: count() }).from(courses).where(eq(courses.status, "published")),
    db.select({ v: count() }).from(lessons),
    db.select({ v: count() }).from(quizzes),
    db.select({ v: count() }).from(users),
  ]);

  const values = [
    { title: "الوضوح قبل الإبهار", text: "كل شاشة في نبراس لها وظيفة واحدة واضحة. لا عناصر زائفة ولا أزرار لا تعمل.", icon: <IconEye className="h-5 w-5" /> },
    { title: "الأمانة الأكاديمية", text: "تصحيح الاختبارات يتم في الخادم، والإجابات الصحيحة لا تُرسل للمتصفح قبل التسليم.", icon: <IconShield className="h-5 w-5" /> },
    { title: "التقدّم المقيس", text: "لا نقول «أنت تتحسن» دون رقم. كل إنجاز له نسبة ودرجة وتاريخ محفوظ في قاعدة البيانات.", icon: <IconChart className="h-5 w-5" /> },
    { title: "العربية أولًا", text: "واجهة RTL أصيلة بخطوط عربية مريحة، لا ترجمة حرفية لمنتج أجنبي.", icon: <IconTrend className="h-5 w-5" /> },
  ];

  const principles = [
    "المحتوى مقسّم إلى وحدات قصيرة قابلة للإنجاز في جلسة واحدة.",
    "كل درس يليه قياس فوري، وكل قياس يليه تغذية راجعة وشرح.",
    "الطالب يرى تقدمه دائمًا: نسبة الإنجاز، الدرجات، الشهادات.",
    "المعلم أو المدير يضيف كورسًا أو مرحلة جديدة دون كتابة شيفرة.",
    "بيانات المستخدم محمية بكلمة مرور مشفّرة وجلسات قابلة للإلغاء.",
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-navy-50 px-3.5 py-1.5 text-xs font-bold text-navy-700">
            <NebrasMark className="h-4 w-4" />
            من نحن
          </span>
          <h1 className="mt-5 font-display text-[2rem] font-extrabold leading-tight text-navy-800 sm:text-[2.4rem]">
            نبراس: نور المعرفة، طريق المستقبل
          </h1>
          <div className="prose-ar mt-5">
            <p>
              نبراس منصة تعليمية عربية متكاملة، وُلدت من ملاحظة بسيطة: الطالب العربي يجد محتوى كثيرًا متناثرًا،
              لكنه نادرًا ما يجد مسارًا واضحًا يخبره ماذا يدرس اليوم، وأين وصل، وما الذي يحتاج مراجعته.
            </p>
            <p>
              لذلك بنينا نبراس حول ثلاثة عناصر: <strong>منهج مرتّب</strong> حسب المرحلة والمادة،
              و<strong>قياس فوري</strong> بعد كل وحدة، و<strong>لوحة تقدم</strong> تُظهر الحقيقة بالأرقام لا بالشعارات.
            </p>
            <p>
              المنصة مصممة لتتوسع: يستطيع فريق الإدارة إضافة مرحلة تعليمية جديدة أو مادة أو كورس كامل بدروسه
              واختباراته من لوحة التحكم، دون أي تعديل في الشيفرة.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {values.map((v) => (
              <Card key={v.title} className="p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-700">{v.icon}</span>
                <h3 className="mt-3.5 font-display text-[0.95rem] font-extrabold text-navy-800">{v.title}</h3>
                <p className="mt-1.5 text-[0.82rem] leading-7 text-mist-600">{v.text}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-5 lg:sticky lg:top-24">
          <Card className="overflow-hidden p-0">
            <div className="relative bg-navy-900 p-6">
              <div className="grid-paper absolute inset-0 opacity-50" />
              <div className="relative">
                <h2 className="font-display text-base font-extrabold text-white">المنصة بالأرقام</h2>
                <p className="mt-1 text-xs text-mist-400">بيانات حية من قاعدة بيانات نبراس</p>
                <dl className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { l: "مراحل تعليمية", v: stageCount[0].v },
                    { l: "كورسات منشورة", v: courseCount[0].v },
                    { l: "دروس", v: lessonCount[0].v },
                    { l: "اختبارات", v: quizCount[0].v },
                    { l: "حسابات مسجّلة", v: userCount[0].v },
                    { l: "دعم RTL كامل", v: "١٠٠٪" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
                      <dt className="text-[0.68rem] font-semibold text-mist-400">{s.l}</dt>
                      <dd className="mt-1 font-display text-xl font-extrabold tabular-nums text-gold-300">{s.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="p-6">
              <h3 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
                <IconTarget className="h-4.5 w-4.5 text-gold-600" />
                مبادئنا في بناء المحتوى
              </h3>
              <ul className="mt-3.5 space-y-2.5">
                {principles.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[0.82rem] leading-7 text-mist-700">
                    <IconCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-sm font-extrabold text-navy-800">نطاق الخدمة الجغرافي</h3>
            <p className="mt-1.5 text-xs leading-6 text-mist-600">
              تعمل نبراس حاليًا في أربع دول فقط، ونوسّع النطاق تدريجيًا بعد ضمان جودة المحتوى لكل منهج دراسي.
            </p>
            <ul className="mt-4 space-y-2">
              {COUNTRY_LIST.map((c) => (
                <li key={c.code} className="flex items-center gap-3 rounded-xl bg-mist-50 px-3.5 py-2.5">
                  <CountryFlag code={c.code} className="h-4 w-6" />
                  <span className="text-xs font-extrabold text-navy-800">{c.nameAr}</span>
                  <span className="mr-auto text-[0.68rem] font-bold text-mist-500" dir="ltr">{c.dial} · {c.currency}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 text-center">
            <IconUsers className="mx-auto h-8 w-8 text-navy-400" />
            <h3 className="mt-3 font-display text-base font-extrabold text-navy-800">جاهز تبدأ؟</h3>
            <p className="mt-1.5 text-sm leading-7 text-mist-600">أنشئ حسابك المجاني واستعرض مكتبة الكورسات الآن.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link href="/register" className="btn btn-primary btn-sm">إنشاء حساب</Link>
              <Link href="/courses" className="btn btn-outline btn-sm">تصفّح الكورسات</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
