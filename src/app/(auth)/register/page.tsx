import type { Metadata } from "next";
import { listStages } from "@/lib/data";
import { RegisterForm } from "@/components/register-form";
import { cookies } from "next/headers";
import { COUNTRY_COOKIE, getCountry } from "@/lib/countries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إنشاء حساب", description: "أنشئ حسابك المجاني على منصة نبراس التعليمية." };

export default async function RegisterPage() {
  const [stageRows, store] = await Promise.all([listStages(true), cookies()]);
  return (
    <RegisterForm
      stages={stageRows.map((s) => ({ id: s.id, name: s.name }))}
      defaultCountry={getCountry(store.get(COUNTRY_COOKIE)?.value).code}
    />
  );
}
