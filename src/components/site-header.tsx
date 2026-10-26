"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NebrasWordmark } from "@/components/logo";
import { Avatar, Badge } from "@/components/ui";
import { IconChevronDown, IconClose, IconGrid, IconLogout, IconMenu, IconUser } from "@/components/icons";
import { api, errorMessage } from "@/lib/client-api";
import { CountrySwitcher } from "@/components/country-switcher";
import { CountryFlag } from "@/components/country-flag";
import { getCountry } from "@/lib/countries";
import { useToast } from "@/components/toast";

export type HeaderUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl: string | null;
} | null;

const NAV = [
  { href: "/", label: "الرئيسية" },
  { href: "/courses", label: "الكورسات" },
  { href: "/stages", label: "المراحل" },
  { href: "/about", label: "عن نبراس" },
  { href: "/contact", label: "تواصل معنا" },
];

const ROLE_LABEL: Record<string, string> = { student: "طالب", teacher: "معلم", admin: "مدير" };

export function SiteHeader({ user, country }: { user: HeaderUser; country?: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardHref = user?.role === "admin" ? "/admin" : user?.role === "teacher" ? "/admin" : "/dashboard";

  async function logout() {
    setBusy(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      toast.push("تم تسجيل الخروج بنجاح", "info");
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled ? "border-mist-200 bg-white/92 backdrop-blur-md shadow-[0_6px_24px_-18px_rgba(14,31,59,0.6)]" : "border-transparent bg-white",
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="نبراس — الصفحة الرئيسية">
          <NebrasWordmark />
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="التنقل الرئيسي">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-semibold transition",
                  active ? "text-navy-800" : "text-mist-600 hover:bg-navy-50 hover:text-navy-700",
                )}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {active && <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 rounded-full bg-gold-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="mr-auto hidden items-center gap-2.5 lg:flex">
          <CountrySwitcher current={country} tone="light" />
          <span className="h-6 w-px bg-mist-200" />
          {user ? (
            <>
              <Link href={dashboardHref} className="btn btn-outline btn-sm">
                <IconGrid className="h-4 w-4" />
                لوحة التحكم
              </Link>
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-mist-200 bg-white py-1 pl-3 pr-1 transition hover:border-navy-300"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  <Avatar name={user.fullName} src={user.avatarUrl} size={32} />
                  <span className="text-sm font-bold text-navy-800">{user.fullName.split(" ")[0]}</span>
                  <IconChevronDown className={cn("h-4 w-4 text-mist-400 transition", menuOpen && "rotate-180")} />
                </button>
                {menuOpen && (
                  <>
                    <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة" tabIndex={-1} />
                    <div role="menu" className="absolute left-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-mist-200 bg-white shadow-lift animate-fade-up">
                      <div className="border-b border-mist-100 bg-mist-50 px-4 py-3">
                        <p className="truncate text-sm font-bold text-navy-800">{user.fullName}</p>
                        <p className="truncate text-xs text-mist-500" dir="ltr">{user.email}</p>
                        <Badge tone={user.role === "admin" ? "gold" : "navy"} className="mt-2">{ROLE_LABEL[user.role] ?? user.role}</Badge>
                      </div>
                      <div className="p-1.5">
                        <MenuLink href={dashboardHref} icon={<IconGrid className="h-4 w-4" />}>لوحة التحكم</MenuLink>
                        <MenuLink href="/profile" icon={<IconUser className="h-4 w-4" />}>الملف الشخصي</MenuLink>
                        <button
                          onClick={logout}
                          disabled={busy}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-right text-sm font-semibold text-danger transition hover:bg-danger-soft disabled:opacity-60"
                          role="menuitem"
                        >
                          <IconLogout className="h-4 w-4" />
                          {busy ? "جارٍ الخروج…" : "تسجيل الخروج"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">تسجيل الدخول</Link>
              <Link href="/register" className="btn btn-primary btn-sm">إنشاء حساب مجاني</Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="mr-auto rounded-lg border border-mist-200 p-2 text-navy-700 transition hover:bg-navy-50 lg:hidden"
          aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-mist-200 bg-white lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4" aria-label="التنقل للجوال">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                  pathname === item.href ? "bg-navy-50 text-navy-800" : "text-mist-700 hover:bg-mist-50",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-mist-200 pt-3">
              <p className="mb-2 px-1 text-[0.7rem] font-bold text-mist-500">الدولة (العملة ورمز الاتصال)</p>
              <CountrySwitcher current={country} tone="light" className="mb-3 flex justify-start" />
            </div>
            <div className="flex flex-col gap-2 border-t border-mist-200 pt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar name={user.fullName} src={user.avatarUrl} size={38} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-navy-800">{user.fullName}</p>
                      <p className="flex items-center gap-1.5 truncate text-xs text-mist-500">
                        <CountryFlag code={country} className="h-3 w-4.5" />
                        {ROLE_LABEL[user.role]} · {getCountry(country).nameAr}
                      </p>
                    </div>
                  </div>
                  <Link href={dashboardHref} className="btn btn-outline">لوحة التحكم</Link>
                  <Link href="/profile" className="btn btn-ghost">الملف الشخصي</Link>
                  <button onClick={logout} disabled={busy} className="btn btn-danger">تسجيل الخروج</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn btn-outline">تسجيل الدخول</Link>
                  <Link href="/register" className="btn btn-primary">إنشاء حساب مجاني</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} role="menuitem" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-mist-700 transition hover:bg-navy-50 hover:text-navy-800">
      <span className="text-navy-500">{icon}</span>
      {children}
    </Link>
  );
}
