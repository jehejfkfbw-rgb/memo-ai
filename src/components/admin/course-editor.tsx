"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { ResourceManager, StatusBadge, type ColumnDef, type FieldDef } from "@/components/admin/resource-manager";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui";
import { ConfirmDialog, Modal, SelectField, TextArea, TextField } from "@/components/client-ui";
import { IconCheckCircle, IconClose, IconEdit, IconPlus, IconQuiz, IconTrash } from "@/components/icons";
import { cn } from "@/lib/utils";

type QuizRow = { id: string; title: string; questionCount?: number; timeLimitMinutes: number; passingPercent: number; attemptsAllowed: number; isPublished: boolean };
type QuestionRow = { id: string; type: string; text: string; options: string[]; correctIndexes: number[]; explanation: string | null; points: number; sortOrder: number };

const LESSON_TYPES = [
  { value: "article", label: "مقال / شرح مكتوب" },
  { value: "video", label: "درس فيديو" },
  { value: "attachment", label: "ملف مرفق" },
  { value: "quiz", label: "نشاط اختباري" },
];

const QUESTION_TYPES = [
  { value: "single", label: "اختيار واحد" },
  { value: "multiple", label: "اختيار متعدد" },
  { value: "truefalse", label: "صح / خطأ" },
];

export function CourseEditor({ course }: { course: { id: string; title: string; slug: string; status: string } }) {
  const lessonFields: FieldDef[] = [
    { name: "title", label: "عنوان الدرس", type: "text", required: true },
    { name: "type", label: "نوع الدرس", type: "select", options: LESSON_TYPES, defaultValue: "article" },
    { name: "sortOrder", label: "ترتيب الدرس", type: "number", defaultValue: 0 },
    { name: "durationMinutes", label: "المدة (دقيقة)", type: "number", defaultValue: 10 },
    { name: "summary", label: "ملخص الدرس", type: "textarea", hint: "يظهر تحت عنوان الدرس" },
    { name: "content", label: "محتوى الدرس", type: "richtext", hint: "اكتب كل فقرة في سطر، أو استخدم وسوم HTML مثل <p> و<strong>" },
    { name: "videoUrl", label: "رابط الفيديو", type: "text", hint: "لدروس الفيديو — يوضع داخل مشغّل الصفحة" },
    { name: "attachmentUrl", label: "رابط الملف المرفق", type: "text" },
    { name: "isFreePreview", label: "معاينة مجانية", type: "boolean", hint: "يتاح لغير المسجّلين في الكورس" },
    { name: "isPublished", label: "درس منشور", type: "boolean", defaultValue: true },
  ];

  const lessonColumns: ColumnDef[] = [
    { key: "sortOrder", label: "#", render: (row) => <span className="font-bold tabular-nums">{String(row.sortOrder)}</span> },
    {
      key: "title",
      label: "الدرس",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-navy-800">{String(row.title)}</p>
          <p className="truncate text-xs font-semibold text-mist-500">{String(row.summary ?? "")}</p>
        </div>
      ),
    },
    { key: "type", label: "النوع", render: (row) => <Badge tone="navy">{LESSON_TYPES.find((t) => t.value === row.type)?.label ?? String(row.type)}</Badge> },
    { key: "durationMinutes", label: "المدة", hideOnMobile: true, render: (row) => `${String(row.durationMinutes)} د` },
    { key: "isPublished", label: "الحالة", render: (row) => <StatusBadge value={row.isPublished ? "published" : "draft"} map={{ published: { label: "منشور", tone: "success" }, draft: { label: "مسودة", tone: "warning" } }} /> },
  ];

  const quizFields: FieldDef[] = [
    { name: "title", label: "عنوان الاختبار", type: "text", required: true },
    { name: "timeLimitMinutes", label: "الزمن المحدد (دقيقة)", type: "number", defaultValue: 10 },
    { name: "passingPercent", label: "درجة النجاح (٪)", type: "number", defaultValue: 60 },
    { name: "attemptsAllowed", label: "عدد المحاولات", type: "number", defaultValue: 3 },
    { name: "sortOrder", label: "ترتيب العرض", type: "number", defaultValue: 0 },
    { name: "description", label: "تعليمات الاختبار", type: "textarea" },
    { name: "showExplanations", label: "إظهار شرح الإجابات بعد التسليم", type: "boolean", defaultValue: true },
    { name: "shuffleQuestions", label: "ترتيب عشوائي للأسئلة", type: "boolean" },
    { name: "isPublished", label: "اختبار منشور", type: "boolean", defaultValue: true },
  ];

  const quizColumns: ColumnDef[] = [
    { key: "title", label: "الاختبار", render: (row) => <span className="font-bold text-navy-800">{String(row.title)}</span> },
    { key: "timeLimitMinutes", label: "الزمن", hideOnMobile: true, render: (row) => `${String(row.timeLimitMinutes)} دقيقة` },
    { key: "passingPercent", label: "النجاح", hideOnMobile: true, render: (row) => `${String(row.passingPercent)}٪` },
    { key: "attemptsAllowed", label: "المحاولات", hideOnMobile: true },
    { key: "isPublished", label: "الحالة", render: (row) => <StatusBadge value={row.isPublished ? "published" : "draft"} map={{ published: { label: "منشور", tone: "success" }, draft: { label: "مسودة", tone: "warning" } }} /> },
  ];

  return (
    <div className="space-y-9">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[1.5rem] font-extrabold text-navy-800">{course.title}</h1>
            <StatusBadge value={course.status} map={{ published: { label: "منشور", tone: "success" }, draft: { label: "مسودة", tone: "warning" }, archived: { label: "مؤرشف", tone: "muted" } }} />
          </div>
          <p className="mt-1.5 text-sm text-mist-600">
            إدارة دروس الكورس واختباراته وبنك أسئلته — الرابط العام:
            <Link href={`/courses/${course.slug}`} className="mr-1.5 font-bold text-navy-600 underline-offset-4 hover:text-gold-600 hover:underline">/courses/{course.slug}</Link>
          </p>
        </div>
        <Link href="/admin/courses" className="btn btn-outline btn-sm">العودة لقائمة الكورسات</Link>
      </div>

      <ResourceManager
        entity="lessons"
        title="دروس الكورس"
        description="رتّب الدروس برقم الترتيب؛ الدرس غير المنشور لا يظهر للطلاب."
        createLabel="درس جديد"
        fields={lessonFields}
        columns={lessonColumns}
        fixedFilters={{ courseId: course.id }}
        pageSize={10}
      />

      <ResourceManager
        entity="quizzes"
        title="اختبارات الكورس"
        description="أنشئ الاختبار ثم أضف أسئلته من بنك الأسئلة بالأسفل."
        createLabel="اختبار جديد"
        fields={quizFields}
        columns={quizColumns}
        fixedFilters={{ courseId: course.id }}
        pageSize={10}
      />

      <QuestionBank courseId={course.id} />
    </div>
  );
}

/* ------------------------------ بنك الأسئلة ------------------------------ */

function QuestionBank({ courseId }: { courseId: string }) {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [quizId, setQuizId] = useState("");
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<QuestionRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [form, setForm] = useState<{ type: string; text: string; options: string[]; correct: boolean[]; explanation: string; points: number; sortOrder: number }>({
    type: "single", text: "", options: ["", ""], correct: [false, false], explanation: "", points: 1, sortOrder: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<{ items: QuizRow[] }>(`/api/admin/quizzes?courseId=${courseId}&pageSize=50`);
        setQuizzes(data.items);
        if (data.items[0]) setQuizId(data.items[0].id);
      } catch (err) {
        toast.push(errorMessage(err), "error");
      }
    })();
  }, [courseId, toast]);

  const loadQuestions = useCallback(async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const data = await api<{ items: QuestionRow[] }>(`/api/admin/questions?quizId=${quizId}&pageSize=100`);
      setQuestions(data.items);
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }, [quizId, toast]);

  useEffect(() => {
    void loadQuestions();
  }, [loadQuestions]);

  function openCreate() {
    setEditing(null);
    setForm({ type: "single", text: "", options: ["", ""], correct: [false, false], explanation: "", points: 1, sortOrder: questions.length });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(q: QuestionRow) {
    setEditing(q);
    setForm({
      type: q.type,
      text: q.text,
      options: q.options.length ? q.options : ["", ""],
      correct: q.options.map((_, i) => (q.correctIndexes ?? []).includes(i)),
      explanation: q.explanation ?? "",
      points: q.points,
      sortOrder: q.sortOrder,
    });
    setError(null);
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const correctIndexes = form.correct.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
    if (!form.text.trim()) return setError("اكتب نص السؤال");
    if (form.options.filter((o) => o.trim()).length < 2) return setError("أضف خيارين على الأقل");
    if (correctIndexes.length === 0) return setError("حدّد الإجابة الصحيحة");
    if (form.type === "single" && correctIndexes.length > 1) return setError("نوع «اختيار واحد» يتطلب إجابة صحيحة واحدة فقط");

    try {
      const payload = {
        quizId,
        type: form.type,
        text: form.text.trim(),
        options: form.options.map((o) => o.trim()).filter(Boolean),
        correctIndexes,
        explanation: form.explanation.trim(),
        points: Number(form.points) || 1,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing) await api(`/api/admin/questions/${editing.id}`, { method: "PATCH", body: payload });
      else await api("/api/admin/questions", { method: "POST", body: payload });
      toast.push(editing ? "تم تحديث السؤال" : "تمت إضافة السؤال", "success");
      setModalOpen(false);
      await loadQuestions();
    } catch (err) {
      const msg = errorMessage(err);
      setError(msg);
      toast.push(msg, "error");
    } finally {
      setSaving(false);
    }
    return undefined;
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api(`/api/admin/questions/${deleting.id}`, { method: "DELETE" });
      toast.push("تم حذف السؤال", "info");
      setDeleting(null);
      await loadQuestions();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy-800">بنك الأسئلة</h2>
          <p className="mt-1 text-sm text-mist-600">اختر اختبارًا ثم أضف أسئلته مع الإجابات الصحيحة والشرح.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-64">
            <SelectField
              label="الاختبار"
              value={quizId}
              onChange={(e) => setQuizId(e.target.value)}
              placeholder="اختر اختبارًا"
              options={quizzes.map((qz) => ({ value: qz.id, label: qz.title }))}
            />
          </div>
          <Button onClick={openCreate} disabled={!quizId}>
            <IconPlus className="h-4 w-4" />
            سؤال جديد
          </Button>
        </div>
      </div>

      {!quizzes.length ? (
        <div className="mt-5">
          <EmptyState icon={<IconQuiz className="h-6 w-6" />} title="لا اختبارات في هذا الكورس" description="أنشئ اختبارًا من قسم «اختبارات الكورس» بالأعلى لتتمكن من إضافة الأسئلة." />
        </div>
      ) : loading ? (
        <div className="mt-6 flex items-center justify-center gap-2 py-8 text-sm font-semibold text-mist-500">
          <Spinner className="h-5 w-5 text-navy-500" /> جارٍ تحميل الأسئلة…
        </div>
      ) : questions.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={<IconQuiz className="h-6 w-6" />} title="لا أسئلة في هذا الاختبار" description="أضف أول سؤال ليصبح الاختبار جاهزًا للطلاب." />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {questions.map((q, i) => (
            <li key={q.id} className="rounded-xl border border-mist-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="navy">{i + 1}</Badge>
                    <Badge tone="muted">{QUESTION_TYPES.find((t) => t.value === q.type)?.label ?? q.type}</Badge>
                    <Badge tone="gold">{q.points} نقطة</Badge>
                  </div>
                  <p className="mt-2 text-sm font-extrabold leading-7 text-navy-800">{q.text}</p>
                  <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                    {q.options.map((opt, oi) => {
                      const right = (q.correctIndexes ?? []).includes(oi);
                      return (
                        <li key={oi} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-[0.8rem] font-semibold", right ? "bg-success-soft text-success" : "bg-mist-50 text-mist-600")}>
                          {right ? <IconCheckCircle className="h-4 w-4 shrink-0" /> : <span className="h-4 w-4 shrink-0 rounded-full border border-mist-300" />}
                          {opt}
                        </li>
                      );
                    })}
                  </ul>
                  {q.explanation && <p className="mt-2.5 rounded-lg bg-navy-50 px-3 py-2 text-[0.78rem] leading-7 text-navy-800"><b>الشرح:</b> {q.explanation}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => openEdit(q)} className="rounded-lg p-2 text-mist-500 transition hover:bg-navy-50 hover:text-navy-700" aria-label="تعديل السؤال">
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleting(q)} className="rounded-lg p-2 text-mist-500 transition hover:bg-danger-soft hover:text-danger" aria-label="حذف السؤال">
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? "تعديل السؤال" : "إضافة سؤال"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? <Spinner /> : null}{saving ? "جارٍ الحفظ…" : "حفظ السؤال"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="نوع السؤال" value={form.type} onChange={(e) => {
              const type = e.target.value;
              setForm((f) => ({ ...f, type, options: type === "truefalse" ? ["صح", "خطأ"] : f.options, correct: type === "truefalse" ? [false, false] : f.correct }));
            }} options={QUESTION_TYPES} />
            <TextField label="النقاط" type="number" min={1} value={String(form.points)} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
            <TextField label="ترتيب العرض" type="number" min={0} value={String(form.sortOrder)} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          </div>

          <TextArea label="نص السؤال" required rows={3} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="اكتب السؤال بوضوح…" />

          <div>
            <p className="label">الخيارات {form.type === "multiple" ? "(يمكن تحديد أكثر من إجابة صحيحة)" : "(إجابة صحيحة واحدة)"}</p>
            <ul className="space-y-2">
              {form.options.map((opt, i) => (
                <li key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, correct: f.correct.map((c, k) => (k === i ? (f.type === "multiple" ? !c : true) : f.type === "multiple" ? c : false)) }))}
                    className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition", form.correct[i] ? "border-success bg-success text-white" : "border-mist-300 text-mist-400 hover:border-navy-400")}
                    aria-label={`تحديد الخيار ${i + 1} كإجابة صحيحة`}
                    aria-pressed={Boolean(form.correct[i])}
                  >
                    <IconCheckCircle className="h-4 w-4" />
                  </button>
                  <input className="field" value={opt} placeholder={`الخيار ${i + 1}`} onChange={(e) => setForm((f) => ({ ...f, options: f.options.map((v, k) => (k === i ? e.target.value : v)) }))} />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, options: f.options.filter((_, k) => k !== i), correct: f.correct.filter((_, k) => k !== i) }))}
                    className="rounded-lg p-2 text-mist-400 transition hover:bg-danger-soft hover:text-danger"
                    aria-label="حذف الخيار"
                    disabled={form.options.length <= 2}
                  >
                    <IconClose className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            {form.type !== "truefalse" && (
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setForm((f) => ({ ...f, options: [...f.options, ""], correct: [...f.correct, false] }))}>
                <IconPlus className="h-3.5 w-3.5" /> إضافة خيار
              </Button>
            )}
          </div>

          <TextArea label="شرح الإجابة (يظهر للطالب بعد التسليم)" rows={3} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />

          {error ? <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-bold text-danger">{error}</p> : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={deleteBusy}
        title="حذف السؤال"
        message="سيُحذف السؤال نهائيًا من هذا الاختبار، وستتغير الدرجة الكلية للاختبار. هل تريد المتابعة؟"
        onConfirm={confirmDelete}
        onCancel={() => !deleteBusy && setDeleting(null)}
      />
    </Card>
  );
}
