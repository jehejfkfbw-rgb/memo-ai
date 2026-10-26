"use client";

import { useEffect } from "react";
import Link from "next/link";
import { NebrasMark } from "@/components/logo";
import { IconAlert, IconShield } from "@/components/icons";

/**
 * حدود خطأ عام: يعرض رسالة عربية واضحة بدل الشاشة البيضاء،
 * ويميّز بين أعطال قاعدة البيانات (إعداد/اتصال) وباقي الأخطاء.
 */
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isDb = /DATABASE_URL|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|Connection terminated|password authentication|no pg_hba|SSL/i.test(
    `${error.name} ${error.message}`,
  );

  useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist-50 px-4 py-16" dir="rtl">
      <div className="card w-full max-w-xl p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <NebrasMark className="h-12 w-12" />
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${isDb ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger"}`}>
            {isDb ? <IconShield className="h-5 w-5" /> : <IconAlert className="h-5 w-5" />}
          </span>
        </div>

        <h1 className="mt-5 font-display text-xl font-extrabold text-navy-800">
          {isDb ? "تعذّر الوصول إلى قاعدة البيانات" : "حدث خطأ غير متوقع"}
        </h1>

        <p className="mt-3 text-sm leading-8 text-mist-600">
          {isDb
            ? "المنصة تعمل، لكنها لم تتمكن من الاتصال بقاعدة البيانات. تأكد من ضبط DATABASE_URL (أو SUPABASE_DB_URL) في متغيرات البيئة، ومن السماح باتصالات IPv4 في إعدادات Supabase."
            : "لم نتمكن من إكمال عرض هذه الصفحة. يمكنك إعادة المحاولة، وإن تكرّر الخطأ فتواصل مع الدعم الفني."}
        </p>

        {error.digest && (
          <p className="mt-3 text-[0.7rem] font-bold text-mist-400" dir="ltr">
            error digest: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button onClick={reset} className="btn btn-primary">إعادة المحاولة</button>
          <Link href="/" className="btn btn-outline">الصفحة الرئيسية</Link>
          <Link href="/api/health" className="btn btn-ghost">فحص حالة النظام</Link>
        </div>
      </div>
    </div>
  );
}
