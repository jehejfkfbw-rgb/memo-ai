import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NebrasMark, NebrasWordmark } from "@/components/logo";
import { getCurrentUser } from "@/lib/auth";
import { IconCertificate, IconCheckCircle, IconQuiz, IconTarget } from "@/components/icons";

export const dynamic = "force-dynamic";

const POINTS = [
  { icon: <IconTarget className="h-4.5 w-4.5" />, text: "مسار تعليمي منظّم حسب المرحلة والمادة" },
  { icon: <IconQuiz className="h-4.5 w-4.5" />, text: "اختبارات تُصحَّح آليًا مع شرح لكل إجابة" },
  { icon: <IconCertificate className="h-4.5 w-4.5" />, text: "شهادة إتمام برمز تحقّق عند إنهاء الكورس" },
  { icon: <IconCheckCircle className="h-4.5 w-4.5" />, text: "لوحة تقدم تُظهر نسبتك ودرجاتك بالأرقام" },
];

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "student" ? "/dashboard" : "/admin");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col justify-center bg-white px-5 py-10 sm:px-10 lg:px-14">
        <Link href="/" className="mb-8 inline-flex w-fit" aria-label="العودة للرئيسية">
          <NebrasWordmark />
        </Link>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-xs text-mist-400">
          بالمتابعة فإنك توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة نبراس.
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-navy-900 lg:block">
        <div className="grid-paper absolute inset-0 opacity-60" />
        <div className="absolute -left-16 top-16 h-72 w-72 rounded-full opacity-25 blur-3xl" style={{ background: "radial-gradient(circle,#C9A227 0%,transparent 70%)" }} />
        <div className="absolute -right-10 bottom-10 h-80 w-80 rounded-full opacity-30 blur-3xl" style={{ background: "radial-gradient(circle,#35639F 0%,transparent 70%)" }} />

        <div className="relative flex h-full flex-col justify-center px-14">
          <NebrasMark className="h-16 w-16" tone="light" />
          <h2 className="mt-7 font-display text-[2.1rem] font-extrabold leading-snug text-white">
            نور المعرفة،
            <span className="block text-gold-400">طريق المستقبل</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-8 text-mist-300">
            انضم إلى آلاف الطلاب الذين ينظّمون تعلّمهم مع نبراس: دروس قصيرة، اختبارات فورية، وشهادات موثّقة.
          </p>

          <ul className="mt-9 space-y-3.5">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="mt-0.5 text-gold-400">{p.icon}</span>
                <span className="text-[0.86rem] font-semibold leading-7 text-mist-200">{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
