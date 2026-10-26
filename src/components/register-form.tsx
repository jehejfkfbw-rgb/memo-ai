"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ClientApiError, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Alert, Spinner } from "@/components/ui";
import { ErrorList, SelectField, TextField } from "@/components/client-ui";
import { IconCheckCircle, IconUser } from "@/components/icons";

export function RegisterForm({ stages }: { stages: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "", phone: "", city: "", stageId: "" });
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [details, setDetails] = useState<unknown>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const strength = (() => {
    const p = form.password;
    let score = 0;
    if (p.length >= 8) score += 1;
    if (/[A-Za-z\u0600-\u06FF]/.test(p)) score += 1;
    if (/\d/.test(p)) score += 1;
    if (/[^A-Za-z0-9\u0600-\u06FF]/.test(p)) score += 1;
    return score;
  })();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFailure(null);
    setDetails(null);
    setLocalError(null);

    if (form.password !== form.confirm) {
      setLocalError("كلمتا المرور غير متطابقتين");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: { ...form, stageId: form.stageId || undefined, phone: form.phone || undefined, city: form.city || undefined },
      });
      toast.push("تم إنشاء حسابك في نبراس — أهلًا بك!", "success");
      router.push("/dashboard");
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

  return (
    <>
      <h1 className="font-display text-[1.7rem] font-extrabold text-navy-800">إنشاء حساب جديد</h1>
      <p className="mt-2 text-sm leading-7 text-mist-600">دقيقة واحدة تفصلك عن بدء رحلتك التعليمية مع نبراس.</p>

      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <TextField label="الاسم الكامل" required value={form.fullName} onChange={set("fullName")} placeholder="مثال: نورة السالم" autoComplete="name" />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="البريد الإلكتروني" type="email" dir="ltr" required value={form.email} onChange={set("email")} placeholder="name@example.com" autoComplete="email" />
          <SelectField
            label="المرحلة الدراسية" value={form.stageId} onChange={set("stageId")} placeholder="اختر المرحلة (اختياري)"
            options={stages.map((s) => ({ value: s.id, label: s.name }))}
          />
        </div>

        <div>
          <TextField
            label="كلمة المرور" type="password" required value={form.password} onChange={set("password")}
            placeholder="٨ خانات على الأقل" autoComplete="new-password"
            hint="استخدم حروفًا وأرقامًا معًا لحماية حسابك"
          />
          <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i < strength ? (strength <= 1 ? "bg-danger" : strength === 2 ? "bg-warning" : strength === 3 ? "bg-navy-500" : "bg-success") : "bg-mist-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs font-semibold text-mist-500">
            قوة كلمة المرور: {["ضعيفة جدًا", "ضعيفة", "متوسطة", "جيدة", "قوية"][strength]}
          </p>
        </div>

        <TextField label="تأكيد كلمة المرور" type="password" required value={form.confirm} onChange={set("confirm")} placeholder="أعد كتابة كلمة المرور" autoComplete="new-password" />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="رقم الجوال" dir="ltr" value={form.phone} onChange={set("phone")} placeholder="+966 5X XXX XXXX" autoComplete="tel" />
          <TextField label="المدينة" value={form.city} onChange={set("city")} placeholder="الرياض" autoComplete="address-level2" />
        </div>

        {localError ? <Alert tone="warning">{localError}</Alert> : null}
        {failure ? (
          <Alert tone="error" title={failure}>
            {details ? <ErrorList details={details} /> : null}
          </Alert>
        ) : null}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={busy}>
          {busy ? <Spinner /> : <IconUser className="h-4 w-4" />}
          {busy ? "جارٍ إنشاء الحساب…" : "إنشاء الحساب"}
        </button>

        <p className="flex items-start gap-2 text-[0.72rem] leading-6 text-mist-500">
          <IconCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          تُشفَّر كلمة المرور قبل حفظها (scrypt + salt فريد)، وتُخزَّن الجلسة في كوكي httpOnly لا يصل إليه أي سكربت خارجي.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-mist-600">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-bold text-navy-700 underline-offset-4 transition hover:text-gold-600 hover:underline">
          سجّل الدخول
        </Link>
      </p>
    </>
  );
}
