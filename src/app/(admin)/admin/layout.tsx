import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { Card } from "@/components/ui";
import { IconShield } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist-50 px-4">
        <Card className="max-w-md p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <IconShield className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-lg font-extrabold text-navy-800">الوصول مقيّد</h1>
          <p className="mt-2 text-sm leading-8 text-mist-600">
            لوحة الإدارة متاحة لحسابات المدير فقط. حسابك الحالي بصلاحية «{user.role === "teacher" ? "معلم" : "طالب"}».
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard" className="btn btn-primary btn-sm">العودة إلى لوحتي</Link>
            <Link href="/" className="btn btn-outline btn-sm">الصفحة الرئيسية</Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <AdminShell user={{ fullName: user.fullName, email: user.email, avatarUrl: user.avatarUrl }}>
      {children}
    </AdminShell>
  );
}
