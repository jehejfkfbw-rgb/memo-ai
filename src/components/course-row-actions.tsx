"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { ConfirmDialog } from "@/components/client-ui";
import { Spinner } from "@/components/ui";
import { IconTrash } from "@/components/icons";

export function UnenrollButton({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await api("/api/learn", { method: "POST", body: { action: "unenroll", courseId } });
      toast.push("تم إلغاء تسجيلك من الكورس", "info");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-mist-500 transition hover:bg-danger-soft hover:text-danger"
        aria-label={`إلغاء التسجيل من ${courseTitle}`}
      >
        <IconTrash className="h-4 w-4" />
        إلغاء التسجيل
      </button>
      <ConfirmDialog
        open={open}
        busy={busy}
        title="إلغاء التسجيل من الكورس"
        message={`سيُحذف تقدمك في «${courseTitle}» من لوحتك. لن تتمكن من الوصول إلى دروسه واختباراته حتى تسجّل مجددًا. هل أنت متأكد؟`}
        confirmLabel={busy ? "جارٍ الحذف…" : "نعم، ألغِ التسجيل"}
        onConfirm={confirm}
        onCancel={() => !busy && setOpen(false)}
      />
    </>
  );
}
