import { cn } from "@/lib/utils";
import { isCountryCode, type CountryCode } from "@/lib/countries";

/**
 * أعلام الدول المدعومة مرسومة كـ SVG هندسي مبسّط (بديل عن الإيموجي)
 * لضمان وضوحها على كل الأحجام والخلفيات.
 */
export function CountryFlag({ code, className = "h-4 w-6" }: { code?: string | null; className?: string }) {
  const country: CountryCode | null = isCountryCode(code) ? code : null;
  if (!country) {
    return (
      <svg viewBox="0 0 24 16" className={cn("rounded-sm", className)} aria-hidden="true">
        <rect width="24" height="16" rx="2" fill="#DFE6EF" />
        <circle cx="12" cy="8" r="3" fill="#9AA9BD" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 16" className={cn("rounded-sm ring-1 ring-navy-900/10", className)} role="img" aria-label={`علم ${country}`}>
      <clipPath id={`flag-clip-${country}`}>
        <rect width="24" height="16" rx="2" />
      </clipPath>
      <g clipPath={`url(#flag-clip-${country})`}>
        {country === "EG" && (
          <>
            <rect width="24" height="5.34" fill="#CE1126" />
            <rect y="5.34" width="24" height="5.32" fill="#FFFFFF" />
            <rect y="10.66" width="24" height="5.34" fill="#000000" />
            <path d="M12 6.4l1.5 1.6-1.5 1.6-1.5-1.6z" fill="#C9A227" />
          </>
        )}
        {country === "SA" && (
          <>
            <rect width="24" height="16" fill="#006C35" />
            <path d="M6 6.6h11.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M7.5 9.8h9" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" />
            <circle cx="18.6" cy="9.9" r="0.9" fill="#FFFFFF" />
          </>
        )}
        {country === "JO" && (
          <>
            <rect width="24" height="5.34" fill="#000000" />
            <rect y="5.34" width="24" height="5.32" fill="#FFFFFF" />
            <rect y="10.66" width="24" height="5.34" fill="#007A3D" />
            <path d="M0 0l10 8L0 16z" fill="#CE1126" />
            <path d="M3.6 8l.7 1.4 1.5.2-1.1 1 .3 1.5-1.4-.8-1.4.8.3-1.5-1.1-1 1.5-.2z" fill="#FFFFFF" />
          </>
        )}
        {country === "AE" && (
          <>
            <rect width="24" height="5.34" fill="#00732F" />
            <rect y="5.34" width="24" height="5.32" fill="#FFFFFF" />
            <rect y="10.66" width="24" height="5.34" fill="#000000" />
            <rect width="7" height="16" fill="#FF0000" />
          </>
        )}
      </g>
    </svg>
  );
}
