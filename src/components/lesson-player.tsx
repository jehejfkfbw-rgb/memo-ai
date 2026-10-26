"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Badge, Spinner } from "@/components/ui";
import { IconAlert, IconCheckCircle, IconCertificate, IconClock, IconFile, IconPlay } from "@/components/icons";
import { sanitizeHtml } from "@/lib/sanitize";

export function LessonPlayer({
  lesson, alreadyCompleted,
}: {
  lesson: {
    id: string;
    title: string;
    type: string;
    content: string | null;
    videoUrl: string | null;
    attachmentUrl: string | null;
    durationMinutes: number;
  };
  alreadyCompleted: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [busy, setBusy] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef(Date.now());

  // عدّاد وقت الدراسة — يُرسل للخادم عند الحفظ
  useEffect(() => {
    const t = setInterval(() => setSeconds(Math.round((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  async function markComplete(next = !completed) {
    setBusy(true);
    try {
      const res = await api<{ percent: number; finished: boolean }>("/api/learn", {
        method: "POST",
        body: { action: "progress", lessonId: lesson.id, completed: next, secondsSpent: Math.max(30, seconds) },
      });
      setCompleted(next);
      if (res.finished) {
        toast.push("مبروك! أكملت الكورس وصدرت شهادتك 🎉", "success");
      } else {
        toast.push(next ? `تم حفظ تقدمك — إنجاز الكورس ${res.percent}٪` : "تم إلغاء تعليم الدرس كمكتمل", next ? "success" : "info");
      }
      router.refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  const html = sanitizeHtml(lesson.content);

  return (
    <div className="space-y-5">
      {lesson.type === "video" && lesson.videoUrl && (
        <div className="overflow-hidden rounded-2xl border border-mist-200 bg-navy-950">
          {videoFailed ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-gold-300">
                <IconPlay className="h-6 w-6" />
              </span>
              <p className="font-display text-sm font-extrabold text-white">مقطع الفيديو غير متاح للتشغيل حاليًا</p>
              <p className="max-w-md text-xs leading-6 text-mist-400">
                المصدر المسجّل للدرس: <span dir="ltr" className="text-gold-300">{lesson.videoUrl}</span>
                <br />
                يمكنك الاعتماد على الملخص المكتوب أدناه، وسيتوفر المقطع بمجرد رفعه على مخزن الملفات.
              </p>
              <button onClick={() => setVideoFailed(false)} className="btn btn-outline btn-sm mt-1 border-white/25 bg-white/5 text-white hover:bg-white/10">
                إعادة محاولة التشغيل
              </button>
            </div>
          ) : (
            <video
              controls
              preload="metadata"
              className="aspect-video w-full bg-navy-950"
              onError={() => setVideoFailed(true)}
              src={lesson.videoUrl}
            >
              <track kind="captions" />
              متصفحك لا يدعم تشغيل الفيديو.
            </video>
          )}
        </div>
      )}

      {lesson.type === "attachment" && lesson.attachmentUrl && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 text-navy-900">
              <IconFile className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-navy-800">ملف مرفق بالدرس</p>
              <p className="text-xs font-semibold text-mist-600" dir="ltr">{lesson.attachmentUrl}</p>
            </div>
          </div>
          <a href={lesson.attachmentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
            تنزيل الملف
          </a>
        </div>
      )}

      {lesson.type === "video" && !lesson.videoUrl && (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-warning-soft p-4">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <p className="text-sm leading-7 text-mist-700">هذا الدرس مصنّف كفيديو لكن لم يُرفع له مقطع بعد — اعتمد على المحتوى المكتوب بالأسفل.</p>
        </div>
      )}

      {html ? (
        <article className="prose-ar card p-6 sm:p-7" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <article className="card p-6 text-sm leading-8 text-mist-600">
          لم يُضف محتوى مكتوب لهذا الدرس بعد.
        </article>
      )}

      <div className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${completed ? "bg-success-soft text-success" : "bg-mist-100 text-mist-500"}`}>
            {completed ? <IconCheckCircle className="h-5 w-5" /> : <IconClock className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-extrabold text-navy-800">{completed ? "أكملت هذا الدرس" : "أنهيت الدرس؟"}</p>
            <p className="mt-0.5 text-xs font-semibold text-mist-500">
              وقتك في هذه الجلسة: {Math.floor(seconds / 60)}د {seconds % 60}ث · المدة المقترحة {lesson.durationMinutes} دقيقة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {completed && <Badge tone="success"><IconCheckCircle className="h-3.5 w-3.5" /> مكتمل</Badge>}
          <button onClick={() => markComplete(!completed)} disabled={busy} className={completed ? "btn btn-outline btn-sm" : "btn btn-primary"}>
            {busy ? <Spinner /> : <IconCheckCircle className="h-4 w-4" />}
            {completed ? "إلغاء الإكمال" : "تعليم الدرس كمكتمل"}
          </button>
        </div>
      </div>

      {completed && (
        <p className="flex items-center gap-2 text-xs font-semibold text-mist-500">
          <IconCertificate className="h-4 w-4 text-gold-600" />
          يُحدَّث شريط تقدم الكورس وشهادتك تلقائيًا عند إتمام كل الدروس.
        </p>
      )}
    </div>
  );
}
