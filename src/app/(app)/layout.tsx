import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <AppShell user={{ id: user.id, fullName: user.fullName, email: user.email, role: user.role, avatarUrl: user.avatarUrl, country: user.country }}>
      {children}
    </AppShell>
  );
}
