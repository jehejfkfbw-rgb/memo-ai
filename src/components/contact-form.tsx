"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ClientApiError, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Alert, Button, Spinner } from "@/components/ui";
import { ErrorList, TextArea, TextField } from "@/components/client-ui";
import { IconCheckCircle, IconMail } from "@/components/icons";

type FormState = { name: string; email: string; subject: string; message: string; website: string };

const EMPTY: FormState = { name: "", email: "", subject: "", message: "", website: "" };

export function ContactForm({ defaultName = "", defaultEmail = "" }: { defaultName?: string; defaultEmail?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<FormState>({ ...EMPTY, name: defaultName, email: defaultEmail });
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [details, setDetails] = useState<unknown>(null);
  const [sent, setSent] = useState<string | null>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setDetails(null);
    try {
      const res = await api<{ id: string }>("/api/contact", { method: "POST", body: form });
      setSent(res.id);
      toast.push("وصلتنا رسالتك — سنرد عليك خلال يوم عمل", "success");
      setForm(EMPTY);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && Array.isArray(err.details)) {
        setDetails(err.details);
        const mapped: Record<string, string> = {};
        (err.details as Array<{ path?: string; message?: string }>).forEach((d) => {
          if (d.path) mapped[d.path] = d.message ?? "قيمة غير صالحة";
        });
        setErrors(mapped);
      }
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Alert tone="success" title="تم إرسال رسالتك بنجاح">
        <p className="mt-1">رقم البلاغة: <b dir="ltr">{sent.slice(0, 8)}</b> — احتفظ به لمتابعة طلبك.</p>
        <button className="btn btn-outline btn-sm mt-4" onClick={() => setSent(null)}>
          إرسال رسالة أخرى
        </button>
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
      <div className="mb-1 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-100 text-navy-700">
          <IconMail className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-display text-base font-extrabold text-navy-800">أرسل رسالتك</h2>
          <p className="text-xs text-mist-500">نرد عادة خلال يوم عمل واحد.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="الاسم الكامل" required value={form.name} onChange={set("name")} error={errors.name} placeholder="مثال: سارة العبدالله" autoComplete="name" />
        <TextField label="البريد الإلكتروني" required type="email" dir="ltr" value={form.email} onChange={set("email")} error={errors.email} placeholder="name@example.com" autoComplete="email" />
      </div>
      <TextField label="الموضوع" required value={form.subject} onChange={set("subject")} error={errors.subject} placeholder="استفسار عن كورس، شراكة، مشكلة تقنية…" />
      <TextArea label="نص الرسالة" required rows={6} value={form.message} onChange={set("message")} error={errors.message} placeholder="اكتب تفاصيل طلبك هنا (١٥ حرفًا على الأقل)" />

      {/* حقل فخّ مخفي لصدّ الرسائل الآلية */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} className="hidden" aria-hidden="true" />

      {details ? <ErrorList details={details} /> : null}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={busy} className="px-6">
          {busy && <Spinner />}
          {busy ? "جارٍ الإرسال…" : "إرسال الرسالة"}
        </Button>
        {busy ? null : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-mist-500">
            <IconCheckCircle className="h-4 w-4 text-success" />
            تُحفظ الرسالة مباشرة في قاعدة البيانات
          </span>
        )}
      </div>
    </form>
  );
}
