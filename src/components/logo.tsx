import { cn } from "@/lib/utils";

/**
 * شعار نبراس: منارة ضوئية (نور المعرفة) فوق كتاب مفتوح (طريق المستقبل).
 * مرسوم بالكامل كـ SVG أصلي دون أي أصول خارجية.
 */
export function NebrasMark({ className = "h-10 w-10", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const tile = tone === "dark" ? "url(#nebras-tile-dark)" : "url(#nebras-tile-light)";
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="شعار نبراس">
      <defs>
        <linearGradient id="nebras-tile-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#234B81" />
          <stop offset="55%" stopColor="#1B3A6B" />
          <stop offset="100%" stopColor="#0E1F3B" />
        </linearGradient>
        <linearGradient id="nebras-tile-light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id="nebras-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3DF9B" />
          <stop offset="45%" stopColor="#DFB53C" />
          <stop offset="100%" stopColor="#C9A227" />
        </linearGradient>
        <radialGradient id="nebras-glow" cx="50%" cy="42%" r="45%">
          <stop offset="0%" stopColor="#E9C963" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#E9C963" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="14" fill={tile} />
      <rect x="0.75" y="0.75" width="46.5" height="46.5" rx="14" fill="url(#nebras-glow)" />
      <rect
        x="0.75" y="0.75" width="46.5" height="46.5" rx="14"
        fill="none" stroke={tone === "dark" ? "rgba(201,162,39,0.45)" : "rgba(255,255,255,0.35)"} strokeWidth="1"
      />

      {/* أشعة النور */}
      <g stroke="url(#nebras-gold)" strokeWidth="1.9" strokeLinecap="round" opacity="0.95">
        <path d="M24 6.5v4.2" />
        <path d="M13.6 10.6l2.6 2.6" />
        <path d="M34.4 10.6l-2.6 2.6" />
        <path d="M9.5 19.5h3.4" />
        <path d="M38.5 19.5h-3.4" />
      </g>

      {/* المنارة / شعلة المعرفة */}
      <path d="M24 12.6 30 21.4 24 30.2 18 21.4Z" fill="url(#nebras-gold)" />
      <path d="M24 15.6 27.6 21.4 24 27.2 20.4 21.4Z" fill="#FFF7DF" opacity="0.55" />

      {/* الكتاب المفتوح */}
      <path
        d="M9.6 32.4c4.8-2.4 9.6-2.4 14.4 0 4.8-2.4 9.6-2.4 14.4 0v6.1c-4.8-2.4-9.6-2.4-14.4 0-4.8-2.4-9.6-2.4-14.4 0Z"
        fill={tone === "dark" ? "#F7F9FC" : "#FFFFFF"}
      />
      <path d="M24 32.4v6.1" stroke="#1B3A6B" strokeWidth="1.2" opacity="0.5" />
      <g stroke="#93B1D8" strokeWidth="1" strokeLinecap="round" opacity="0.9">
        <path d="M12.4 35.1c2.5-.9 5-1 7.6-.2" />
        <path d="M28 34.9c2.6-.8 5.1-.7 7.6.2" />
        <path d="M12.4 37.2c2.5-.9 5-1 7.6-.2" />
        <path d="M28 37c2.6-.8 5.1-.7 7.6.2" />
      </g>
    </svg>
  );
}

export function NebrasWordmark({
  className,
  tone = "dark",
  showLatin = true,
}: {
  className?: string;
  tone?: "dark" | "light";
  showLatin?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <NebrasMark className="h-10 w-10 shrink-0" tone={tone} />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-display text-[1.32rem] font-extrabold tracking-tight",
            tone === "dark" ? "text-navy-800" : "text-white",
          )}
        >
          نبراس
        </span>
        {showLatin && (
          <span
            className={cn(
              "mt-1 text-[0.62rem] font-semibold tracking-[0.32em]",
              tone === "dark" ? "text-gold-600" : "text-gold-300",
            )}
            dir="ltr"
          >
            NEBRAS
          </span>
        )}
      </span>
    </span>
  );
}
