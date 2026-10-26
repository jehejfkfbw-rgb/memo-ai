import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentUser } from "@/lib/auth";
import { cookies } from "next/headers";
import { COUNTRY_COOKIE, getCountry } from "@/lib/countries";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [user, store] = await Promise.all([getCurrentUser(), cookies()]);
  // دولة الزائر: من حساب المستخدم إن وُجد، وإلا من كوكي الاختيار، وإلا الافتراضية
  const country = getCountry(user?.country ?? store.get(COUNTRY_COOKIE)?.value).code;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader
        country={country}
        user={
          user
            ? { id: user.id, fullName: user.fullName, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
            : null
        }
      />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
