"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ClientApiError, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Alert, Badge, Button, Card, ProgressBar, Spinner } from "@/components/ui";
import { ConfirmDialog, ErrorList } from "@/components/client-ui";
import {
  IconAlert, IconCertificate, IconCheckCircle, IconChevronLeft, IconClock, IconClose,
  IconQuiz, IconTarget, IconTrophy,
} from "@/components/icons";
import { cn } from "@/lib/utils";

export type QuizQuestion = {
  id: string;
  type: "single" | "multiple" | "truefalse";
  text: string;
  options: string[];
  points: number;
  index: number;
};

type ReviewItem = {
  id: string;
  text: string;
  type: string;
  options: string[];
  yourAnswer: number[];
  correct: number[];
  points: number;
  earned: number;
  isCorrect: boolean;
  explanation: string | null;
};

type Result = {
  attempt: { id: string; score: number; totalPoints: number; percent: number; passed: boolean };
  review: ReviewItem[];
  bestPercent: number;
  attemptsLeft: number;
  courseTitle: string | null;
};

export function QuizRunner({
  quiz, questions, course, attemptsLeft, bestPercent, totalPoints,
}: {
  quiz: { id: string; title: string; description: string | null; timeLimitMinutes: number; passingPercent: number; attemptsAllowed: number };
  questions: QuizQuestion[];
  course: { title: string; slug: string } | null;
  attemptsLeft: number;
  bestPercent: number;
  totalPoints: number;
}) {
  const toast = useToast();
  const [phase, setPhase] = useState<"intro" | "running" | "result">(attemptsLeft <= 0 ? "intro" : "intro");
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(quiz.timeLimitMinutes * 60);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [details, setDetails] = useState<unknown>(null);
  const startedAt = useRef<string | null>(null);

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id]?.length ?? 0) > 0).length,
    [answers, questions],
  );

  const submit = useCallback(async () => {
    if (!startedAt.current || busy) return;
    setBusy(true);
    setFailure(null);
    setDetails(null);
    try {
      const durationSeconds = Math.round((Date.now() - new Date(startedAt.current).getTime()) / 1000);
      const res = await api<Result>(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        body: { answers, startedAt: startedAt.current, durationSeconds },
      });
      setResult(res);
      setPhase("result");
      toast.push(res.attempt.passed ? "أحسنت! تم اجتياز الاختبار" : "تم تسليم الاختبار", res.attempt.passed ? "success" : "info");
    } catch (err) {
      if (err instanceof ClientApiError) {
        setFailure(err.message);
        setDetails(err.details);
        toast.push(err.message, "error");
      } else {
        toast.push(errorMessage(err), "error");
      }
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }, [answers, busy, quiz.id, toast]);

  // مؤقّت الاختبار — تسليم تلقائي عند انتهاء الوقت
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          void submit();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, submit]);

  function start() {
    startedAt.current = new Date().toISOString();
    setSecondsLeft(quiz.timeLimitMinutes * 60);
    setAnswers({});
    setCurrent(0);
    setPhase("running");
  }

  function toggle(question: QuizQuestion, optionIndex: number) {
    setAnswers((prev) => {
      const list = prev[question.id] ?? [];
      if (question.type === "multiple") {
        return { ...prev, [question.id]: list.includes(optionIndex) ? list.filter((i) => i !== optionIndex) : [...list, optionIndex].sort() };
      }
      return { ...prev, [question.id]: [optionIndex] };
    });
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeLow = secondsLeft <= 60;
  const q = questions[current];

  /* ------------------------------ شاشة البداية ------------------------------ */
  if (phase === "intro") {
    return (
      <Card className="mx-auto max-w-2xl overflow-hidden p-0">
        <div className="relative bg-navy-900 px-6 py-7">
          <div className="grid-paper absolute inset-0 opacity-50" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-300">
                <IconQuiz className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-lg font-extrabold text-white">{quiz.title}</h1>
                {course && <p className="mt-0.5 text-xs font-semibold text-mist-400">{course.title}</p>}
              </div>
            </div>
            {quiz.description && <p className="mt-4 text-sm leading-7 text-mist-300">{quiz.description}</p>}
          </div>
        </div>

        <div className="p-6">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "عدد الأسئلة", v: questions.length, icon: <IconQuiz className="h-4 w-4" /> },
              { l: "الوقت المتاح", v: `${quiz.timeLimitMinutes} د`, icon: <IconClock className="h-4 w-4" /> },
              { l: "درجة النجاح", v: `${quiz.passingPercent}٪`, icon: <IconTarget className="h-4 w-4" /> },
              { l: "مجموع النقاط", v: totalPoints, icon: <IconTrophy className="h-4 w-4" /> },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-mist-50 px-3.5 py-3 text-center">
                <dt className="flex items-center justify-center gap-1.5 text-[0.68rem] font-bold text-mist-500">
                  <span className="text-navy-500">{s.icon}</span>
                  {s.l}
                </dt>
                <dd className="mt-1 font-display text-lg font-extrabold tabular-nums text-navy-800">{s.v}</dd>
              </div>
            ))}
          </dl>

          <ul className="mt-5 space-y-2 rounded-xl border border-navy-200 bg-navy-50 p-4 text-[0.82rem] leading-7 text-navy-800">
            <li>• يُصحَّح الاختبار في الخادم، وتظهر النتيجة وشرح الإجابات فور التسليم.</li>
            <li>• يمكنك التنقّل بين الأسئلة ومراجعة إجاباتك قبل التسليم.</li>
            <li>• يُسلَّم الاختبار تلقائيًا عند انتهاء الوقت المحدد.</li>
            <li>• المحاولات المتاحة: {quiz.attemptsAllowed} — تُحتسب كل محاولة في سجلّ درجاتك.</li>
          </ul>

          {bestPercent > 0 && (
            <p className="mt-4 text-sm font-bold text-mist-600">أفضل درجة سابقة: <span className="text-navy-800 tabular-nums">{bestPercent}٪</span></p>
          )}

          {failure ? (
            <Alert tone="error" title={failure} className="mt-4">
              {details ? <ErrorList details={details} /> : null}
            </Alert>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2.5">
            {attemptsLeft > 0 ? (
              <Button onClick={start} className="flex-1 py-3">
                <IconTarget className="h-4 w-4" />
                بدء الاختبار ({attemptsLeft} محاولة متبقية)
              </Button>
            ) : (
              <Alert tone="warning" className="flex-1">استنفدت كل المحاولات المتاحة لهذا الاختبار.</Alert>
            )}
            {course && <Link href={`/learn/${course.slug}`} className="btn btn-outline py-3">العودة للكورس</Link>}
          </div>
        </div>
      </Card>
    );
  }

  /* -------------------------------- شاشة النتيجة -------------------------------- */
  if (phase === "result" && result) {
    const { attempt, review } = result;
    const correctCount = review.filter((r) => r.isCorrect).length;
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden p-0">
          <div className={cn("relative px-6 py-8 text-center", attempt.passed ? "bg-navy-900" : "bg-navy-800")}>
            <div className="grid-paper absolute inset-0 opacity-40" />
            <div className="relative">
              <div className="relative mx-auto h-32 w-32">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={attempt.passed ? "#E9C963" : "#DFB53C"}
                    strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${(attempt.percent / 100) * 326.7} 326.7`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-extrabold tabular-nums text-white">{attempt.percent}٪</span>
                  <span className="text-[0.68rem] font-bold text-mist-300">{attempt.score}/{attempt.totalPoints} نقطة</span>
                </div>
              </div>
              <h1 className="mt-5 font-display text-xl font-extrabold text-white">
                {attempt.passed ? "مبروك، اجتزت الاختبار 🎉" : "لم تصل لدرجة النجاح بعد"}
              </h1>
              <p className="mt-2 text-sm text-mist-300">
                أجبت بشكل صحيح عن {correctCount} من {review.length} أسئلة · درجة النجاح {quiz.passingPercent}٪
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Badge tone="gold">أفضل درجة: {result.bestPercent}٪</Badge>
                <Badge className="bg-white/10 text-white/85">محاولات متبقية: {result.attemptsLeft}</Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 p-5">
            {result.attemptsLeft > 0 && (
              <Button variant="primary" onClick={start}>
                <IconQuiz className="h-4 w-4" />
                إعادة الاختبار
              </Button>
            )}
            {course && <Link href={`/learn/${course.slug}`} className="btn btn-outline">العودة للكورس</Link>}
            <Link href="/grades" className="btn btn-ghost">سجلّ الدرجات</Link>
            {attempt.percent >= 100 && (
              <Link href="/certificates" className="btn btn-gold">
                <IconCertificate className="h-4 w-4" />
                شهاداتي
              </Link>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-base font-extrabold text-navy-800">مراجعة الإجابات</h2>
          <p className="mt-1 text-xs text-mist-500">الإجابات الصحيحة والشرح تظهر بعد التسليم فقط.</p>
          <ul className="mt-5 space-y-4">
            {review.map((r, i) => (
              <li key={r.id} className={cn("rounded-xl border p-4", r.isCorrect ? "border-success/30 bg-success-soft/50" : "border-danger/25 bg-danger-soft/40")}>
                <div className="flex items-start gap-3">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold", r.isCorrect ? "bg-success text-white" : "bg-danger text-white")}>
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold leading-7 text-navy-800">{r.text}</p>
                    <ul className="mt-2.5 space-y-1.5">
                      {r.options.map((opt, oi) => {
                        const chosen = r.yourAnswer.includes(oi);
                        const isRight = r.correct.includes(oi);
                        return (
                          <li
                            key={oi}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.82rem] font-semibold",
                              isRight ? "border-success/40 bg-white text-success" : chosen ? "border-danger/40 bg-white text-danger" : "border-transparent bg-white/60 text-mist-600",
                            )}
                          >
                            {isRight ? <IconCheckCircle className="h-4 w-4 shrink-0" /> : chosen ? <IconClose className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0" />}
                            {opt}
                            {chosen && <span className="mr-auto text-[0.68rem] font-bold">إجابتك</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {r.explanation && (
                      <p className="mt-2.5 rounded-lg bg-white/80 px-3 py-2 text-[0.78rem] leading-7 text-mist-700">
                        <b className="text-navy-800">الشرح: </b>{r.explanation}
                      </p>
                    )}
                    <p className="mt-2 text-[0.7rem] font-bold text-mist-500">النقاط: {r.earned}/{r.points}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  /* -------------------------------- شاشة الأسئلة -------------------------------- */
  return (
    <div className="space-y-5">
      <div className="sticky top-[4.75rem] z-20 -mx-1 rounded-2xl border border-mist-200 bg-white/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate font-display text-sm font-extrabold text-navy-800">{quiz.title}</h1>
            <p className="mt-0.5 text-xs font-semibold text-mist-500">
              السؤال {current + 1} من {questions.length} · أُجيب عن {answeredCount}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-2 font-display text-sm font-extrabold tabular-nums", timeLow ? "bg-danger-soft text-danger" : "bg-navy-50 text-navy-700")}>
              <IconClock className="h-4 w-4" />
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <Button variant="gold" size="sm" onClick={() => setConfirmOpen(true)} disabled={busy}>
              {busy ? <Spinner /> : <IconCheckCircle className="h-4 w-4" />}
              تسليم الاختبار
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={(answeredCount / questions.length) * 100} tone={timeLow ? "gold" : "navy"} />
        </div>
      </div>

      {failure ? (
        <Alert tone="error" title={failure}>
          {details ? <ErrorList details={details} /> : null}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Badge tone="navy">
                {q.type === "single" ? "اختيار واحد" : q.type === "multiple" ? "اختيار متعدد" : "صح / خطأ"}
              </Badge>
              <h2 className="mt-3 font-display text-[1.05rem] font-extrabold leading-8 text-navy-800">{q.text}</h2>
            </div>
            <Badge tone="gold">{q.points} نقطة</Badge>
          </div>

          {q.type === "multiple" && (
            <p className="mt-2 text-xs font-semibold text-mist-500">اختر كل الإجابات الصحيحة.</p>
          )}

          <ul className="mt-5 space-y-2.5" role={q.type === "multiple" ? "group" : "radiogroup"}>
            {q.options.map((opt, oi) => {
              const selected = (answers[q.id] ?? []).includes(oi);
              return (
                <li key={oi}>
                  <button
                    type="button"
                    onClick={() => toggle(q, oi)}
                    aria-pressed={selected}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-right transition",
                      selected ? "border-navy-600 bg-navy-50 shadow-card" : "border-mist-200 bg-white hover:border-navy-300 hover:bg-mist-50",
                    )}
                  >
                    <span className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center border-2 text-[0.7rem] font-extrabold transition",
                      q.type === "multiple" ? "rounded-md" : "rounded-full",
                      selected ? "border-navy-700 bg-navy-700 text-white" : "border-mist-300 text-mist-400",
                    )}>
                      {selected ? <IconCheckCircle className="h-4 w-4" /> : String.fromCharCode(1571 + oi)}
                    </span>
                    <span className="text-sm font-semibold leading-7 text-navy-800">{opt}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-mist-100 pt-4">
            <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
              <span className="rotate-180"><IconChevronLeft className="h-4 w-4" /></span>
              السابق
            </Button>
            {current < questions.length - 1 ? (
              <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>
                السؤال التالي
                <IconChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="gold" onClick={() => setConfirmOpen(true)}>
                إنهاء وتسليم
              </Button>
            )}
          </div>
        </Card>

        <Card className="h-fit p-5 lg:sticky lg:top-[12rem]">
          <h2 className="font-display text-sm font-extrabold text-navy-800">خريطة الأسئلة</h2>
          <p className="mt-1 text-xs text-mist-500">اضغط على رقم للانتقال مباشرة.</p>
          <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-5">
            {questions.map((item, i) => {
              const answered = (answers[item.id]?.length ?? 0) > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-9 rounded-lg text-xs font-extrabold tabular-nums transition",
                    i === current ? "bg-navy-700 text-white ring-2 ring-gold-400" : answered ? "bg-success-soft text-success" : "bg-mist-100 text-mist-500 hover:bg-mist-200",
                  )}
                  aria-label={`السؤال ${i + 1}${answered ? " (مُجاب)" : ""}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-5 space-y-2 border-t border-mist-100 pt-4 text-xs font-semibold text-mist-600">
            <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-success-soft ring-1 ring-success/40" /> مُجاب</p>
            <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-mist-100 ring-1 ring-mist-300" /> بدون إجابة</p>
            <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-navy-700" /> السؤال الحالي</p>
          </div>

          {answeredCount < questions.length && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning-soft p-3 text-[0.72rem] font-bold leading-6 text-warning">
              <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
              تبقّى {questions.length - answeredCount} سؤالًا بدون إجابة.
            </p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        tone="primary"
        busy={busy}
        title="تسليم الاختبار"
        message={
          answeredCount === questions.length
            ? `أجبت عن كل الأسئلة (${questions.length}). سيتم تصحيح إجاباتك وحفظها في سجلّ درجاتك.`
            : `أجبت عن ${answeredCount} من ${questions.length} أسئلة فقط. الأسئلة الفارغة ستُحتسب صفرًا. هل تريد التسليم الآن؟`
        }
        confirmLabel={busy ? "جارٍ التصحيح…" : "تأكيد التسليم"}
        onConfirm={submit}
        onCancel={() => !busy && setConfirmOpen(false)}
      />
    </div>
  );
}
