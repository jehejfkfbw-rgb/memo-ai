"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ClientApiError, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Alert, Spinner } from "@/components/ui";
import { ErrorList, SelectField, TextField } from "@/components/client-ui";
import { IconCheckCircle, IconUser } from "@/components/icons";
import { CountryFlag } from "@/components/country-flag";
import { COUNTRIES, SUPPORTED_COUNTRY_CODES, SUPPORTED_COUNTRIES_LABEL, getCountry, type CountryCode } from "@/lib/countries";

export function RegisterForm({ stages, defaultCountry = "EG" }: { stages: Array<{ id: string; name: string }>; defaultCountry?: string }) {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "", phone: "", city: "", stageId: "",
    country: (SUPPORTED_COUNTRY_CODES as readonly string[]).includes(defaultCountry) ? defaultCountry : "EG",
  });
  const country = getCountry(form.country);
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
        body: { ...form, country: form.country as CountryCode, stageId: form.stageId || undefined, phone: form.phone || undefined, city: form.city || undefined },
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

      <div className="mt-4 rounded-xl border border-gold-200 bg-gold-50 px-4 py-3">
        <p className="text-xs font-extrabold text-gold-700">الدول المدعومة حاليًا</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {SUPPORTED_COUNTRY_CODES.map((code) => (
            <li key={code} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-bold text-navy-800 ring-1 ring-mist-200">
              <CountryFlag code={code} className="h-3 w-4.5" />
              {COUNTRIES[code].nameAr}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[0.68rem] font-semibold leading-6 text-mist-600">
          التسجيل متاح لمقيمي {SUPPORTED_COUNTRIES_LABEL} فقط، وتُعرض الأسعار والعملة ورمز الاتصال حسب دولتك.
        </p>
      </div>

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
          <div>
            <label className="label" htmlFor="register-country">الدولة <span className="text-danger">*</span></label>
            <div className="relative">
              <select
                id="register-country"
                className="field appearance-none pl-9"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                required
              >
                {SUPPORTED_COUNTRY_CODES.map((code) => (
                  <option key={code} value={code}>{COUNTRIES[code].nameAr} — {COUNTRIES[code].dial}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <CountryFlag code={form.country} className="h-4 w-6" />
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-mist-500">
              العملة: {country.currencyAr} · التوقيت: {country.timezone.replace("_", " ")}
            </p>
          </div>
          <TextField
            label={`رقم الجوال (${country.dial})`} dir="ltr" value={form.phone} onChange={set("phone")}
            placeholder={country.phoneExample} autoComplete="tel"
            hint={`يُتحقق من الرقم حسب صيغة ${country.nameAr}`}
          />
        </div>

        <TextField label="المدينة" value={form.city} onChange={set("city")} placeholder={form.country === "EG" ? "القاهرة" : form.country === "SA" ? "الرياض" : form.country === "JO" ? "عمان" : "دبي"} autoComplete="address-level2" />

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
