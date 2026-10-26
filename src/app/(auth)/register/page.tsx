import type { Metadata } from "next";
import { listStages } from "@/lib/data";
import { RegisterForm } from "@/components/register-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إنشاء حساب", description: "أنشئ حسابك المجاني على منصة نبراس التعليمية." };

export default async function RegisterPage() {
  const stageRows = await listStages(true);
  return <RegisterForm stages={stageRows.map((s) => ({ id: s.id, name: s.name }))} />;
}
