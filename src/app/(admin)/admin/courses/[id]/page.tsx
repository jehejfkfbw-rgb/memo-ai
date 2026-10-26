import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { count, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, lessons, questions, quizzes } from "@/db/schema";
import { CourseEditor } from "@/components/admin/course-editor";
import { Card, StatCard } from "@/components/ui";
import { IconBookOpen, IconLayers, IconQuiz, IconUsers } from "@/components/icons";
import { isUuid } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تحرير الكورس" };

export default async function AdminCourseEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [course] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  if (!course) notFound();

  const [lessonCount, quizCount, questionCount, enrollmentCount] = await Promise.all([
    db.select({ v: count() }).from(lessons).where(eq(lessons.courseId, course.id)),
    db.select({ v: count() }).from(quizzes).where(eq(quizzes.courseId, course.id)),
    db.select({ v: count() }).from(quizzes).where(eq(quizzes.courseId, course.id)),
    db.select({ v: count() }).from(enrollments).where(eq(enrollments.courseId, course.id)),
  ]);

  const quizRows = await db.select({ id: quizzes.id }).from(quizzes).where(eq(quizzes.courseId, course.id));
  void questionCount;
  const totalQuestions = quizRows.length
    ? await db.select({ v: count() }).from(questions).where(inArray(questions.quizId, quizRows.map((q) => q.id)))
    : [{ v: 0 }];

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="الدروس" value={lessonCount[0].v} icon={<IconBookOpen className="h-5 w-5" />} tone="navy" />
        <StatCard label="الاختبارات" value={quizCount[0].v} icon={<IconQuiz className="h-5 w-5" />} tone="gold" />
        <StatCard label="المتعلّمون المسجّلون" value={enrollmentCount[0].v} icon={<IconUsers className="h-5 w-5" />} tone="success" />
        <StatCard label="حالة الكورس" value={course.status === "published" ? "منشور" : course.status === "draft" ? "مسودة" : "مؤرشف"} icon={<IconLayers className="h-5 w-5" />} tone="muted" />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-mist-600">
            إجمالي أسئلة اختبارات هذا الكورس: <b className="text-navy-800">{totalQuestions[0]?.v ?? 0}</b> سؤال — يمكنك إدارتها جميعًا من «بنك الأسئلة» بالأسفل.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/courses/${course.slug}`} className="btn btn-outline btn-sm">معاينة صفحة الكورس</Link>
            <Link href="/admin/courses" className="btn btn-ghost btn-sm">كل الكورسات</Link>
          </div>
        </div>
      </Card>

      <CourseEditor course={{ id: course.id, title: course.title, slug: course.slug, status: course.status }} />
    </div>
  );
}
