import type { Metadata } from "next";
import Link from "next/link";
import { getUserCertificates, getUserCourses } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { Badge, Card, EmptyState } from "@/components/ui";
import { CertificateVerifier } from "@/components/certificate-verifier";
import { PrintButton } from "@/components/print-button";
import { NebrasMark } from "@/components/logo";
import { IconCertificate, IconCheckCircle, IconTrophy } from "@/components/icons";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "شهاداتي" };

export default async function CertificatesPage() {
  const user = (await getCurrentUser())!;
  const [certs, enrolled] = await Promise.all([getUserCertificates(user.id), getUserCourses(user.id)]);
  const inProgress = enrolled.filter((c) => c.progress > 0 && c.progress < 100);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">شهاداتي</h1>
        <p className="mt-1.5 text-sm text-mist-600">
          تُصدر الشهادة تلقائيًا عند إتمام ١٠٠٪ من دروس الكورس، ولكل شهادة رمز تحقّق فريد.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {certs.length ? (
            certs.map(({ certificate, course, stage }) => (
              <article key={certificate.id} className="relative overflow-hidden rounded-2xl border-2 border-gold-300 bg-white p-1.5 shadow-card">
                <div className="rounded-xl border border-navy-200 bg-gradient-to-bl from-white via-mist-50 to-navy-50 px-6 py-8 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <NebrasMark className="h-12 w-12" />
                    <div className="text-right">
                      <p className="font-display text-base font-extrabold text-navy-800">منصة نبراس التعليمية</p>
                      <p className="text-[0.66rem] font-bold tracking-[0.25em] text-gold-600" dir="ltr">NEBRAS LEARNING PLATFORM</p>
                    </div>
                  </div>

                  <p className="mt-7 font-display text-lg font-extrabold text-gold-600">شهادة إتمام</p>
                  <p className="mt-3 text-sm text-mist-600">تشهد منصة نبراس بأن الطالب/ة</p>
                  <p className="mt-2 font-display text-2xl font-extrabold text-navy-800">{user.fullName}</p>
                  <p className="mt-3 text-sm text-mist-600">قد أتمّ بنجاح كورس</p>
                  <p className="mt-1.5 font-display text-lg font-extrabold text-navy-700">«{course.title}»</p>
                  <p className="mt-1 text-xs font-semibold text-mist-500">{stage.name} {course.subjectId ? "" : ""}</p>

                  <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-mist-200">
                      <p className="text-[0.66rem] font-bold text-mist-500">التقدير</p>
                      <p className="mt-0.5 font-display text-sm font-extrabold text-success">{certificate.grade}٪</p>
                    </div>
                    <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-mist-200">
                      <p className="text-[0.66rem] font-bold text-mist-500">تاريخ الإصدار</p>
                      <p className="mt-0.5 font-display text-sm font-extrabold text-navy-800">{formatDate(certificate.issuedAt)}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-mist-200">
                      <p className="text-[0.66rem] font-bold text-mist-500">رمز التحقّق</p>
                      <p className="mt-0.5 font-display text-[0.7rem] font-extrabold text-navy-800" dir="ltr">{certificate.code}</p>
                    </div>
                  </div>

                  <div className="mx-auto mt-7 flex max-w-md items-end justify-between gap-6">
                    <div className="flex-1 border-t border-mist-300 pt-1.5 text-[0.68rem] font-bold text-mist-500">تاريخ الإصدار</div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold-400 bg-gold-50 text-gold-600">
                      <IconTrophy className="h-6 w-6" />
                    </span>
                    <div className="flex-1 border-t border-mist-300 pt-1.5 text-[0.68rem] font-bold text-mist-500">إدارة منصة نبراس</div>
                  </div>

                  <div className="no-print mt-6 flex flex-wrap items-center justify-center gap-2">
                    <PrintButton />
                    <Link href={`/learn/${course.slug}`} className="btn btn-ghost btn-sm">مراجعة الكورس</Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              icon={<IconCertificate className="h-6 w-6" />}
              title="لا شهادات بعد"
              description="أكمل كل دروس أحد كورساتك لتُصدر شهادتك تلقائيًا مع رمز تحقّق."
              action={<Link href="/my-courses" className="btn btn-primary btn-sm">اذهب إلى كورساتي</Link>}
            />
          )}
        </div>

        <aside className="space-y-5">
          <CertificateVerifier />

          <Card className="p-5">
            <h2 className="font-display text-sm font-extrabold text-navy-800">كيف تُصدر الشهادة؟</h2>
            <ol className="mt-3 space-y-2.5 text-[0.82rem] leading-7 text-mist-700">
              <li className="flex gap-2"><IconCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />أكمل تعليم كل دروس الكورس كمكتملة.</li>
              <li className="flex gap-2"><IconCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />تصل نسبة الإنجاز إلى ١٠٠٪ وتُحدَّث حالة التسجيل إلى «مكتمل».</li>
              <li className="flex gap-2"><IconCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />يُنشئ النظام شهادة برمز فريد ويحفظها في قاعدة البيانات.</li>
              <li className="flex gap-2"><IconCheckCircle className="mt-1 h-4 w-4 shrink-0 text-success" />يمكن لأي جهة التحقّق منها من خانة التحقّق بجانب هذه الصفحة.</li>
            </ol>
          </Card>

          {inProgress.length > 0 && (
            <Card className="p-5">
              <h2 className="font-display text-sm font-extrabold text-navy-800">على بُعد خطوات من شهادة</h2>
              <ul className="mt-3 space-y-2.5">
                {inProgress.slice(0, 4).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 rounded-xl bg-mist-50 px-3.5 py-2.5">
                    <Link href={`/learn/${c.slug}`} className="min-w-0 truncate text-xs font-bold text-navy-800 transition hover:text-gold-600">
                      {c.title}
                    </Link>
                    <Badge tone="gold">{c.progress}٪</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
