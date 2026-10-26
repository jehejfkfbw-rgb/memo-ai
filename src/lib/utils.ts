const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** تحقق من صيغة UUID قبل مقارنته بعمود uuid — يمنع خطأ Postgres 22P02 */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const ARABIC_DIACRITICS = /[\u0617-\u061A\u064B-\u0652\u0670\u0640]/g;
const ARABIC_NORMALIZE: Record<string, string> = {
  "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ئ": "ي", "ء": "", "ؤ": "و", "ة": "ه",
};

/** توليد رابط آمن يدعم العربية والإنجليزية */
export function slugify(input: string): string {
  const cleaned = input
    .trim()
    .replace(ARABIC_DIACRITICS, "")
    .replace(/[ً-ْ]/g, "")
    .split("")
    .map((ch) => ARABIC_NORMALIZE[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || `item-${Date.now().toString(36)}`;
}

export function uniqueSlug(base: string, existing: string[]): string {
  let slug = slugify(base);
  if (!existing.includes(slug)) return slug;
  let i = 2;
  while (existing.includes(`${slug}-${i}`)) i += 1;
  return `${slug}-${i}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h} س ${m} د`;
}

export function relativeTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "الآن";
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  const days = Math.round(hours / 24);
  if (days < 30) return `قبل ${days} يوم`;
  return formatDate(date);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
}

export const ROLE_LABEL: Record<string, string> = {
  student: "طالب",
  teacher: "معلم",
  admin: "مدير",
};

export const STATUS_LABEL: Record<string, string> = {
  active: "نشط",
  suspended: "موقوف",
  published: "منشور",
  draft: "مسودة",
  archived: "مؤرشف",
  new: "جديد",
  read: "مقروء",
  replied: "تم الرد",
  completed: "مكتمل",
  in_progress: "قيد التقدّم",
};

export const LEVEL_LABEL: Record<string, string> = {
  beginner: "مبتدئ",
  intermediate: "متوسط",
  advanced: "متقدم",
};

export const LESSON_TYPE_LABEL: Record<string, string> = {
  video: "فيديو",
  article: "مقال",
  quiz: "اختبار",
  attachment: "ملف",
};

export const QUESTION_TYPE_LABEL: Record<string, string> = {
  single: "اختيار واحد",
  multiple: "اختيار متعدد",
  truefalse: "صح / خطأ",
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentOf(part: number, total: number): number {
  if (!total) return 0;
  return clamp(Math.round((part / total) * 100), 0, 100);
}

export function certificateCode(userId: string, courseId: string): string {
  const clean = (userId + courseId).replace(/-/g, "").toUpperCase();
  const chunk = (s: string, i: number) => s.slice(i * 4, i * 4 + 4);
  return `NBR-${chunk(clean, 0)}-${chunk(clean, 2)}-${chunk(clean, 4)}`.slice(0, 20);
}
