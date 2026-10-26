"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ClientApiError, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Alert, Button, Card, Spinner } from "@/components/ui";
import { ErrorList, SelectField, SwitchField, TextArea, TextField } from "@/components/client-ui";
import { Tabs } from "@/components/client-ui";
import { IconCheckCircle, IconLock, IconUser } from "@/components/icons";

export type ProfileUser = {
  id: string; fullName: string; email: string; phone: string | null; city: string | null;
  bio: string | null; avatarUrl: string | null; stageId: string | null; role: string;
};

export function ProfileForm({ user, stages }: { user: ProfileUser; stages: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<"info" | "security">("info");

  const [info, setInfo] = useState({
    fullName: user.fullName,
    phone: user.phone ?? "",
    city: user.city ?? "",
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
    stageId: user.stageId ?? "",
  });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<unknown>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  function handleError(err: unknown) {
    if (err instanceof ClientApiError) {
      setError(err.message);
      setDetails(err.details);
    } else {
      setError(errorMessage(err));
      setDetails(null);
    }
  }

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/profile", {
        method: "PATCH",
        body: { ...info, stageId: info.stageId || null, avatarUrl: info.avatarUrl || null },
      });
      toast.push("تم حفظ بياناتك الشخصية", "success");
      setSavedAt(new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }));
      router.refresh();
    } catch (err) {
      handleError(err);
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    if (pw.newPassword !== pw.confirm) {
      setError("كلمتا المرور الجديدتان غير متطابقتين");
      setBusy(false);
      return;
    }
    try {
      const res = await api("/api/auth/change-password", { method: "POST", body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
      toast.push("تم تغيير كلمة المرور بنجاح", "success");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      void res;
      router.refresh();
    } catch (err) {
      handleError(err);
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "info", label: "البيانات الشخصية", icon: <IconUser className="h-4 w-4" /> },
          { key: "security", label: "الأمان وكلمة المرور", icon: <IconLock className="h-4 w-4" /> },
        ]}
      />

      {error ? (
        <Alert tone="error" title={error}>
          {details ? <ErrorList details={details} /> : null}
        </Alert>
      ) : null}

      {tab === "info" ? (
        <Card className="p-6">
          <form onSubmit={saveInfo} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="الاسم الكامل" required value={info.fullName} onChange={(e) => setInfo({ ...info, fullName: e.target.value })} />
              <TextField label="البريد الإلكتروني" value={user.email} dir="ltr" disabled hint="لتغيير البريد تواصل مع إدارة المنصة" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="رقم الجوال" dir="ltr" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} placeholder="+966 5X XXX XXXX" />
              <TextField label="المدينة" value={info.city} onChange={(e) => setInfo({ ...info, city: e.target.value })} placeholder="الرياض" />
            </div>

            <SelectField
              label="المرحلة الدراسية"
              value={info.stageId}
              onChange={(e) => setInfo({ ...info, stageId: e.target.value })}
              placeholder="اختر المرحلة"
              options={stages.map((s) => ({ value: s.id, label: s.name }))}
              hint="تُستخدم لاقتراح الكورسات المناسبة لك"
            />

            <TextField
              label="رابط الصورة الشخصية" dir="ltr" value={info.avatarUrl}
              onChange={(e) => setInfo({ ...info, avatarUrl: e.target.value })}
              placeholder="https://…/avatar.png" hint="اختياري — اتركه فارغًا لعرض الأحرف الأولى من اسمك"
            />

            <TextArea
              label="نبذة عنك" rows={4} maxLength={400} value={info.bio}
              onChange={(e) => setInfo({ ...info, bio: e.target.value })}
              placeholder="اكتب نبذة قصيرة تعرّف بها بنفسك وأهدافك الدراسية"
              hint={`${info.bio.length}/400 حرف`}
            />

            <div className="flex flex-wrap items-center gap-3 border-t border-mist-100 pt-4">
              <Button type="submit" disabled={busy}>
                {busy ? <Spinner /> : <IconCheckCircle className="h-4 w-4" />}
                {busy ? "جارٍ الحفظ…" : "حفظ البيانات"}
              </Button>
              {savedAt && <span className="text-xs font-bold text-success">آخر حفظ: {savedAt}</span>}
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            <TextField
              label="كلمة المرور الحالية" type="password" required autoComplete="current-password"
              value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="كلمة المرور الجديدة" type="password" required autoComplete="new-password"
                value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                hint="٨ خانات على الأقل مع حرف ورقم"
              />
              <TextField
                label="تأكيد كلمة المرور الجديدة" type="password" required autoComplete="new-password"
                value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
              />
            </div>

            <div className="rounded-xl bg-mist-50 p-4">
              <p className="text-xs font-bold text-navy-800">ملاحظات أمنية</p>
              <ul className="mt-2 space-y-1.5 text-[0.78rem] leading-6 text-mist-600">
                <li>• تُخزَّن كلمة المرور مشفّرة بخوارزمية scrypt مع salt فريد لكل حساب.</li>
                <li>• الجلسة محفوظة في كوكي httpOnly لا يمكن لأي سكربت قراءته.</li>
                <li>• عند تكرار المحاولات الفاشلة يتم تقييد الطلبات مؤقتًا لحماية حسابك.</li>
              </ul>
            </div>

            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? <Spinner /> : <IconLock className="h-4 w-4" />}
              {busy ? "جارٍ التحديث…" : "تحديث كلمة المرور"}
            </Button>
          </form>
        </Card>
      )}

      <SwitchField
        label="تفعيل الإشعارات داخل المنصة"
        hint="تظهر إعلانات المنصة في لوحة تقدمك تلقائيًا"
        checked
        onChange={() => toast.push("الإشعارات داخل المنصة مفعّلة دائمًا لحسابك", "info")}
      />
    </div>
  );
}
