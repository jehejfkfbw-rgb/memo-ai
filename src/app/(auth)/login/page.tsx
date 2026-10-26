"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api, ClientApiError, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Alert, Spinner } from "@/components/ui";
import { ErrorList, TextField } from "@/components/client-ui";
import { IconLock, IconUser } from "@/components/icons";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const next = params.get("next") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [details, setDetails] = useState<unknown>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setFailure(null);
    setDetails(null);
    try {
      const res = await api<{ user: { role: string } }>("/api/auth/login", { method: "POST", body: { email, password } });
      toast.push("تم تسجيل الدخول بنجاح", "success");
      const target = next.startsWith("/") ? next : res.user.role === "student" ? "/dashboard" : "/admin";
      router.push(target);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError) {
        setFailure(err.message);
        setDetails(err.details);
      } else {
        setFailure(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(kind: "student" | "admin") {
    setEmail(kind === "student" ? "student@nebras.app" : "admin@nebras.app");
    setPassword(kind === "student" ? "Student@12345" : "Admin@12345");
    setFailure(null);
  }

  return (
    <>
      <h1 className="font-display text-[1.7rem] font-extrabold text-navy-800">تسجيل الدخول</h1>
      <p className="mt-2 text-sm leading-7 text-mist-600">أهلًا بعودتك إلى نبراس. أدخل بياناتك لمتابعة تعلّمك.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <TextField
          label="البريد الإلكتروني" type="email" dir="ltr" required autoComplete="email"
          placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="كلمة المرور" type="password" required autoComplete="current-password"
          placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
        />

        {failure ? (
          <Alert tone="error" title={failure}>
            {details ? <ErrorList details={details} /> : "تأكد من البريد الإلكتروني وكلمة المرور ثم أعد المحاولة."}
          </Alert>
        ) : null}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner /> : <IconLock className="h-4 w-4" />}
          {busy ? "جارٍ التحقق…" : "دخول"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-mist-300 bg-mist-50 p-4">
        <p className="flex items-center gap-2 text-xs font-bold text-mist-600">
          <IconUser className="h-4 w-4 text-navy-500" />
          حسابات تجريبية للتجربة السريعة
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => fillDemo("student")} className="btn btn-outline btn-sm">طالب</button>
          <button type="button" onClick={() => fillDemo("admin")} className="btn btn-outline btn-sm">مدير المنصة</button>
        </div>
        <p className="mt-2.5 text-[0.7rem] leading-6 text-mist-500" dir="ltr">
          student@nebras.app / Student@12345 &nbsp;·&nbsp; admin@nebras.app / Admin@12345
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-mist-600">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-bold text-navy-700 underline-offset-4 transition hover:text-gold-600 hover:underline">
          أنشئ حسابًا مجانيًا
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-2xl bg-mist-100" />}>
      <LoginForm />
    </Suspense>
  );
}
