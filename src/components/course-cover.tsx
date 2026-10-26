import { cn } from "@/lib/utils";

/** غلاف كورس مولّد برمجيًا — نمط هندسي ثابت لكل كورس دون أي صور خارجية */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function CourseCover({
  seed, accent = "#1B3A6B", title, className, compact = false,
}: { seed: string; accent?: string | null; title?: string; className?: string; compact?: boolean }) {
  const h = hash(seed || title || "nebras");
  const variant = h % 3;
  const color = accent || "#1B3A6B";

  return (
    <div
      className={cn("relative overflow-hidden bg-navy-800", compact ? "h-28" : "h-40 sm:h-44", className)}
      style={{ background: `linear-gradient(135deg, ${color} 0%, #142C53 55%, #0E1F3B 100%)` }}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={`g-${h}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E9C963" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#C9A227" stopOpacity="0.35" />
          </linearGradient>
          <pattern id={`p-${h}`} width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M18 0H0v18" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="320" height="160" fill={`url(#p-${h})`} />

        {variant === 0 && (
          <g opacity="0.9">
            <circle cx="265" cy="42" r="54" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.4" />
            <circle cx="265" cy="42" r="34" fill="none" stroke="rgba(233,201,99,0.5)" strokeWidth="1.4" />
            <circle cx="265" cy="42" r="14" fill={`url(#g-${h})`} />
            <path d="M0 132h320" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" />
            <path d="M28 132V88M64 132V70M100 132V100M136 132V58" stroke="rgba(255,255,255,0.32)" strokeWidth="7" strokeLinecap="round" />
          </g>
        )}
        {variant === 1 && (
          <g opacity="0.92">
            <path d="M232 160 300 20l68 140z" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
            <path d="M-20 118c60-46 118-46 178 0" fill="none" stroke="rgba(233,201,99,0.55)" strokeWidth="2" />
            <path d="M-20 138c60-46 118-46 178 0" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="2" />
            <circle cx="70" cy="52" r="26" fill={`url(#g-${h})`} opacity="0.9" />
            <path d="M70 34v36M52 52h36" stroke="#142C53" strokeWidth="2.4" strokeLinecap="round" opacity="0.65" />
          </g>
        )}
        {variant === 2 && (
          <g opacity="0.9">
            <rect x="212" y="26" width="86" height="86" rx="16" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" transform="rotate(12 255 69)" />
            <rect x="228" y="42" width="54" height="54" rx="12" fill={`url(#g-${h})`} opacity="0.85" transform="rotate(12 255 69)" />
            <path d="M18 128c34-16 52-44 52-78" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
            <path d="M52 136c30-14 46-40 46-70" fill="none" stroke="rgba(233,201,99,0.45)" strokeWidth="2" />
            <circle cx="30" cy="46" r="5" fill="#E9C963" opacity="0.8" />
            <circle cx="112" cy="86" r="4" fill="#FFFFFF" opacity="0.5" />
          </g>
        )}
      </svg>

      {title && !compact && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/85 to-transparent p-4 pt-10">
          <p className="line-clamp-2 font-display text-[0.95rem] font-bold leading-6 text-white/95">{title}</p>
        </div>
      )}
    </div>
  );
}
