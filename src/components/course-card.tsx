import Link from "next/link";
import { cn, formatDuration, LEVEL_LABEL } from "@/lib/utils";
import { CourseCover } from "@/components/course-cover";
import { Badge, Rating } from "@/components/ui";
import { IconBookOpen, IconClock, IconUsers } from "@/components/icons";

export type CourseCardData = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  level: string;
  durationMinutes: number;
  ratingSum: number;
  ratingCount: number;
  isFeatured?: boolean;
  stage?: { name: string; accent: string | null } | null;
  subject?: { name: string; accent?: string | null } | null;
  teacherName?: string | null;
  lessonCount?: number;
  enrolledCount?: number;
  progress?: number | null;
};

export function CourseCard({ course, href, className }: { course: CourseCardData; href?: string; className?: string }) {
  const link = href ?? `/courses/${course.slug}`;
  const rating = course.ratingCount ? Number((course.ratingSum / course.ratingCount).toFixed(1)) : 0;
  const accent = course.stage?.accent ?? "#1B3A6B";

  return (
    <Link
      href={link}
      className={cn("card card-hover group flex h-full flex-col overflow-hidden", className)}
      aria-label={course.title}
    >
      <div className="relative">
        <CourseCover seed={course.slug} accent={accent} compact />
        <div className="absolute right-3 top-3 flex flex-wrap gap-1.5">
          {course.isFeatured && <Badge tone="gold">مميّز</Badge>}
          {course.stage && <Badge className="bg-white/90 text-navy-700">{course.stage.name}</Badge>}
        </div>
        {course.progress !== undefined && course.progress !== null && (
          <div className="absolute inset-x-3 bottom-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-gold-400" style={{ width: `${Math.min(100, course.progress)}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {course.subject && <Badge tone="muted">{course.subject.name}</Badge>}
          <Badge tone="navy">{LEVEL_LABEL[course.level] ?? course.level}</Badge>
        </div>

        <h3 className="line-clamp-2 font-display text-[1.02rem] font-bold leading-7 text-navy-800 transition group-hover:text-navy-600">
          {course.title}
        </h3>
        {course.summary && <p className="mt-1.5 line-clamp-2 text-[0.85rem] leading-6 text-mist-600">{course.summary}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-mist-500">
          <span className="inline-flex items-center gap-1.5">
            <IconBookOpen className="h-4 w-4 text-navy-400" />
            {course.lessonCount ?? 0} درس
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconClock className="h-4 w-4 text-navy-400" />
            {formatDuration(course.durationMinutes)}
          </span>
          {(course.enrolledCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <IconUsers className="h-4 w-4 text-navy-400" />
              {course.enrolledCount} متعلّم
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-mist-100 pt-3">
          <span className="truncate text-xs font-semibold text-mist-600">{course.teacherName ?? "فريق نبراس"}</span>
          <Rating value={rating} count={course.ratingCount} />
        </div>
      </div>
    </Link>
  );
}
