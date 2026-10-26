/**
 * تعقيم بسيط لمحتوى الدروس المكتوب بواسطة فريق الإدارة:
 * يزيل الوسوم الخطرة وسمات الأحداث وروابط javascript قبل العرض في المتصفح.
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*["']?\s*javascript:[^"'>\s]*/gi, '$1="#"')
    .trim();
}

/** تحويل نص بسيط إلى فقرات HTML آمنة */
export function paragraphsToHtml(text: string): string {
  return text
    .split(/\n{1,}/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("\n");
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
