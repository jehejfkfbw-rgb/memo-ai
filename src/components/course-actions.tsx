"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/ui";
import { IconCheckCircle, IconLock, IconPlay } from "@/components/icons";
import { ProgressBar } from "@/components/ui";

export function CourseActions({
  courseId, courseSlug, isEnrolled, progress, isLoggedIn, isFree,
}: {
  courseId: string; courseSlug: string; isEnrolled: boolean; progress: number;
  isLoggedIn: boolean; isFree: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function enroll() {
    if (!isLoggedIn) {
      router.push(`/login?next=/courses/${courseSlug}`);
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ alreadyEnrolled?: boolean }>("/api/learn", { method: "POST", body: { action: "enroll", courseId } });
      toast.push(res.alreadyEnrolled ? "أنت مسجّل مسبقًا في هذا الكورس" : "تم تسجيلك في الكورس — ابدأ الدرس الأول الآن", "success");
      router.refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  if (isEnrolled) {
    return (
      <div className="space-y-3">
        <Link href={`/learn/${courseSlug}`} className="btn btn-primary w-full py-3">
          <IconPlay className="h-4 w-4" />
          {progress > 0 ? "متابعة التعلّم" : "ابدأ الكورس"}
        </Link>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-mist-600">
            <span>تقدمك في الكورس</span>
            <span className="tabular-nums text-navy-700">{progress}٪</span>
          </div>
          <ProgressBar value={progress} tone={progress >= 100 ? "success" : "navy"} />
        </div>
        {progress >= 100 && (
          <Link href="/certificates" className="btn btn-outline w-full">
            <IconCheckCircle className="h-4 w-4 text-success" />
            عرض شهادتك
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button onClick={enroll} disabled={busy || !isFree} className="btn btn-gold w-full py-3">
        {busy && <Spinner />}
        {!isFree ? <IconLock className="h-4 w-4" /> : null}
        {busy ? "جارٍ التسجيل…" : isFree ? "سجّل الآن مجانًا" : "الكورس غير متاح للتسجيل حاليًا"}
      </button>
      {!isLoggedIn && (
        <p className="text-center text-xs leading-6 text-mist-500">
          سيُطلب منك تسجيل الدخول أو إنشاء حساب قبل بدء الكورس.
        </p>
      )}
      <Link href={`/courses/${courseSlug}#curriculum`} className="btn btn-outline w-full">
        استعراض المنهج كاملًا
      </Link>
    </div>
  );
}
