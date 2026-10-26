"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NebrasMark, NebrasWordmark } from "@/components/logo";
import { Avatar, Badge } from "@/components/ui";
import {
  IconBookOpen, IconChart, IconClose, IconGrid, IconLayers, IconLogout, IconMailOpen,
  IconMenu, IconSettings, IconShield, IconUsers,
} from "@/components/icons";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";

const NAV = [
  { href: "/admin", label: "نظرة عامة", icon: IconChart, exact: true },
  { href: "/admin/users", label: "المستخدمون", icon: IconUsers },
  { href: "/admin/courses", label: "الكورسات", icon: IconBookOpen },
  { href: "/admin/taxonomy", label: "المراحل والمواد", icon: IconLayers },
  { href: "/admin/learners", label: "التسجيلات والدرجات", icon: IconGrid },
  { href: "/admin/messages", label: "الرسائل والإعلانات", icon: IconMailOpen },
  { href: "/admin/audit", label: "السجل والتدقيق", icon: IconShield },
];

export function AdminShell({ user, children }: { user: { fullName: string; email: string; avatarUrl: string | null }; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      toast.push("تم تسجيل الخروج", "info");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-mist-50">
      <header className="sticky top-0 z-40 border-b border-navy-800/40 bg-navy-900 text-white">
        <div className="mx-auto flex h-16 max-w-[95rem] items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg border border-white/15 p-2 lg:hidden" aria-label="فتح القائمة">
            <IconMenu className="h-5 w-5" />
          </button>
          <Link href="/admin" className="hidden items-center gap-2.5 lg:flex">
            <NebrasMark className="h-9 w-9" tone="light" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-sm font-extrabold">لوحة إدارة نبراس</span>
              <span className="mt-1 text-[0.6rem] font-bold tracking-[0.22em] text-gold-400" dir="ltr">ADMIN CONSOLE</span>
            </span>
          </Link>
          <Link href="/admin" className="lg:hidden"><NebrasMark className="h-9 w-9" tone="light" /></Link>

          <div className="mr-auto flex items-center gap-2">
            <Link href="/" className="btn btn-sm border-white/15 bg-white/5 text-white hover:bg-white/10 hidden sm:inline-flex">عرض الموقع</Link>
            <Link href="/dashboard" className="btn btn-sm border-white/15 bg-white/5 text-white hover:bg-white/10">لوحة الطالب</Link>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 py-1 pl-3 pr-1">
              <Avatar name={user.fullName} src={user.avatarUrl} size={30} />
              <span className="hidden text-sm font-bold sm:inline">{user.fullName}</span>
              <Badge tone="gold">مدير</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[95rem] gap-6 px-4 py-6 sm:px-6">
        <aside className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 shrink-0 overflow-y-auto bg-white p-4 transition-transform lg:sticky lg:top-[5.25rem] lg:z-0 lg:h-fit lg:translate-x-0 lg:rounded-2xl lg:border lg:border-mist-200 lg:p-4 lg:shadow-card",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}>
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <NebrasWordmark />
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-mist-500 hover:bg-mist-100" aria-label="إغلاق">
              <IconClose className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-1" aria-label="قائمة الإدارة">
            {NAV.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
                    active ? "bg-navy-800 text-white shadow-card" : "text-mist-600 hover:bg-navy-50 hover:text-navy-800",
                  )}
                >
                  <item.icon className={cn("h-4.5 w-4.5", active ? "text-gold-300" : "text-navy-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 space-y-1 border-t border-mist-200 pt-4">
            <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-mist-600 transition hover:bg-navy-50 hover:text-navy-800">
              <IconSettings className="h-4.5 w-4.5 text-navy-400" />
              إعدادات حسابي
            </Link>
            <button onClick={logout} disabled={busy} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-danger transition hover:bg-danger-soft disabled:opacity-60">
              <IconLogout className="h-4.5 w-4.5" />
              {busy ? "جارٍ الخروج…" : "تسجيل الخروج"}
            </button>
          </div>

          <div className="mt-5 hidden rounded-xl bg-navy-800 p-4 lg:block">
            <p className="text-[0.7rem] font-bold text-gold-300">ملاحظة أمنية</p>
            <p className="mt-1.5 text-[0.72rem] leading-6 text-mist-300">
              كل عملية إنشاء أو تعديل أو حذف تُسجَّل في سجلّ التدقيق مع هوية المنفّذ وعنوان IP.
            </p>
          </div>
        </aside>

        {open && <button className="fixed inset-0 z-40 bg-navy-950/45 lg:hidden" onClick={() => setOpen(false)} aria-label="إغلاق القائمة" />}

        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
