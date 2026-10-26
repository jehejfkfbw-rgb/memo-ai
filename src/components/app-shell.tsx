"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NebrasMark, NebrasWordmark } from "@/components/logo";
import { Avatar, Badge } from "@/components/ui";
import {
  IconBookOpen, IconCertificate, IconChart, IconClose, IconGrid, IconLogout,
  IconMenu, IconSettings, IconTarget, IconTrophy, IconUser,
} from "@/components/icons";
import { api, errorMessage } from "@/lib/client-api";
import { CountryFlag } from "@/components/country-flag";
import { getCountry } from "@/lib/countries";
import { useToast } from "@/components/toast";

export type ShellUser = { id: string; fullName: string; email: string; role: string; avatarUrl: string | null; country?: string | null };

const STUDENT_NAV = [
  { href: "/dashboard", label: "لوحة التقدم", icon: IconChart },
  { href: "/my-courses", label: "كورساتي", icon: IconBookOpen },
  { href: "/grades", label: "الدرجات والاختبارات", icon: IconTarget },
  { href: "/certificates", label: "شهاداتي", icon: IconCertificate },
  { href: "/profile", label: "الملف الشخصي", icon: IconUser },
];

export function AppShell({ user, children, title, subtitle, actions }: {
  user: ShellUser; children: ReactNode; title?: string; subtitle?: string; actions?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const nav = user.role === "student" ? STUDENT_NAV : [
    ...STUDENT_NAV,
    { href: "/admin", label: "لوحة الإدارة", icon: IconGrid },
  ];

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

  return (
    <div className="min-h-screen bg-mist-50">
      {/* الشريط العلوي */}
      <header className="sticky top-0 z-40 border-b border-mist-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setOpen(true)} className="rounded-lg border border-mist-200 p-2 text-navy-700 lg:hidden" aria-label="فتح القائمة">
            <IconMenu className="h-5 w-5" />
          </button>
          <Link href="/" className="lg:hidden" aria-label="نبراس">
            <NebrasMark className="h-9 w-9" />
          </Link>
          <div className="hidden lg:block">
            <Link href="/dashboard"><NebrasWordmark /></Link>
          </div>
          <div className="mr-auto flex items-center gap-2.5">
            <Link href="/courses" className="btn btn-outline btn-sm hidden sm:inline-flex">تصفّح الكورسات</Link>
            {user.role !== "student" && (
              <Link href="/admin" className="btn btn-gold btn-sm">
                <IconGrid className="h-4 w-4" />
                الإدارة
              </Link>
            )}
            <Link href="/profile" className="flex items-center gap-2 rounded-full border border-mist-200 py-1 pl-3 pr-1 transition hover:border-navy-300">
              <Avatar name={user.fullName} src={user.avatarUrl} size={30} />
              <span className="hidden text-sm font-bold text-navy-800 sm:inline">{user.fullName.split(" ")[0]}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[90rem] gap-6 px-4 py-6 sm:px-6">
        {/* الشريط الجانبي */}
        <aside className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 shrink-0 overflow-y-auto border-l border-mist-200 bg-white p-4 transition-transform lg:sticky lg:top-[5.25rem] lg:z-0 lg:h-fit lg:translate-x-0 lg:rounded-2xl lg:border lg:p-4",
          open ? "translate-x-0" : "translate-x-full lg:translate-x-0",
        )}>
          <div className="mb-5 flex items-center justify-between lg:hidden">
            <NebrasWordmark />
            <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-mist-500 hover:bg-mist-100" aria-label="إغلاق القائمة">
              <IconClose className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-5 hidden rounded-2xl bg-navy-800 p-4 lg:block">
            <div className="flex items-center gap-3">
              <Avatar name={user.fullName} src={user.avatarUrl} size={44} />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-extrabold text-white">{user.fullName}</p>
                <p className="truncate text-[0.7rem] text-mist-400" dir="ltr">{user.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge tone="gold">{user.role === "admin" ? "مدير المنصة" : user.role === "teacher" ? "معلم" : "طالب"}</Badge>
              <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold text-mist-400">
                <CountryFlag code={user.country} className="h-3 w-4.5" />
                {getCountry(user.country).nameAr}
              </span>
              <Link href="/profile" className="inline-flex items-center gap-1 text-[0.7rem] font-bold text-mist-300 transition hover:text-gold-300">
                <IconSettings className="h-3.5 w-3.5" />
                تعديل
              </Link>
            </div>
          </div>

          <nav className="space-y-1" aria-label="قائمة لوحة الطالب">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition",
                    active ? "bg-navy-700 text-white shadow-card" : "text-mist-600 hover:bg-navy-50 hover:text-navy-800",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className={cn("h-4.5 w-4.5", active ? "text-gold-300" : "text-navy-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 space-y-2 border-t border-mist-200 pt-4">
            <Link href="/courses" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-mist-600 transition hover:bg-navy-50 hover:text-navy-800 lg:hidden">
              <IconBookOpen className="h-4.5 w-4.5 text-navy-400" />
              تصفّح الكورسات
            </Link>
            <button
              onClick={logout}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-danger transition hover:bg-danger-soft disabled:opacity-60"
            >
              <IconLogout className="h-4.5 w-4.5" />
              {busy ? "جارٍ الخروج…" : "تسجيل الخروج"}
            </button>
          </div>

          <div className="mt-5 hidden rounded-xl border border-gold-200 bg-gold-50 p-3.5 lg:block">
            <p className="flex items-center gap-2 text-xs font-extrabold text-gold-700">
              <IconTrophy className="h-4 w-4" />
              هدف الأسبوع
            </p>
            <p className="mt-1.5 text-[0.72rem] leading-6 text-mist-600">أكمل درسًا واحدًا يوميًا لتحافظ على سلسلة تعلّمك.</p>
          </div>
        </aside>

        {open && <button className="fixed inset-0 z-40 bg-navy-950/45 lg:hidden" onClick={() => setOpen(false)} aria-label="إغلاق القائمة" />}

        {/* المحتوى */}
        <main className="min-w-0 flex-1">
          {(title || actions) && (
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                {title && <h1 className="font-display text-[1.6rem] font-extrabold text-navy-800">{title}</h1>}
                {subtitle && <p className="mt-1.5 text-sm leading-7 text-mist-600">{subtitle}</p>}
              </div>
              {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
