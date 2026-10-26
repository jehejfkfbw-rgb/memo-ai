import Link from "next/link";
import type { ReactNode } from "react";
import { cn, initials } from "@/lib/utils";
import { IconCheckCircle, IconAlert, IconInfo, IconSearch, IconStar } from "@/components/icons";

/* --------------------------------- أزرار --------------------------------- */

type Variant = "primary" | "gold" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  gold: "btn-gold",
  outline: "btn-outline",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export function Button({
  children, variant = "primary", size = "md", className, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button className={cn("btn", variantClass[variant], size === "sm" && "btn-sm", className)} {...rest}>
      {children}
    </button>
  );
}

export function LinkButton({
  children, href, variant = "primary", size = "md", className, ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: Variant; size?: Size }) {
  return (
    <Link href={href} className={cn("btn", variantClass[variant], size === "sm" && "btn-sm", className)} {...rest}>
      {children}
    </Link>
  );
}

/* --------------------------------- بطاقات --------------------------------- */

export function Card({ children, className, hover = false }: { children: ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn("card", hover && "card-hover", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow, title, description, align = "start", action,
}: { eyebrow?: string; title: string; description?: string; align?: "start" | "center"; action?: ReactNode }) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", align === "center" && "flex-col items-center text-center")}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && (
          <span className="mb-2 inline-flex items-center gap-2 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-gold-600">
            <span className="h-px w-6 bg-gold-400" />
            {eyebrow}
          </span>
        )}
        <h2 className="text-2xl font-extrabold text-navy-800 sm:text-[1.75rem]">{title}</h2>
        {description && <p className="mt-2.5 text-[0.95rem] leading-8 text-mist-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------- شارات --------------------------------- */

type Tone = "navy" | "gold" | "success" | "warning" | "danger" | "muted";

const toneClass: Record<Tone, string> = {
  navy: "bg-navy-100 text-navy-700",
  gold: "bg-gold-100 text-gold-700",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  muted: "bg-mist-100 text-mist-600",
};

export function Badge({ children, tone = "muted", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("badge", toneClass[tone], className)}>{children}</span>;
}

/* ------------------------------- شريط تقدم ------------------------------- */

export function ProgressBar({ value, tone = "navy", className, showLabel = false }: { value: number; tone?: "navy" | "gold" | "success"; className?: string; showLabel?: boolean }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const bar = tone === "gold" ? "bg-gold-500" : tone === "success" ? "bg-success" : "bg-navy-600";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-mist-200" role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${v}%` }} />
      </div>
      {showLabel && <span className="w-10 shrink-0 text-left text-xs font-bold tabular-nums text-mist-600">{v}٪</span>}
    </div>
  );
}

/* -------------------------------- تنبيهات -------------------------------- */

export function Alert({ tone = "info", title, children, className }: { tone?: "info" | "success" | "error" | "warning"; title?: string; children?: ReactNode; className?: string }) {
  const map = {
    info: { cls: "border-navy-200 bg-navy-50 text-navy-800", Icon: IconInfo },
    success: { cls: "border-success/25 bg-success-soft text-success", Icon: IconCheckCircle },
    error: { cls: "border-danger/25 bg-danger-soft text-danger", Icon: IconAlert },
    warning: { cls: "border-warning/25 bg-warning-soft text-warning", Icon: IconAlert },
  }[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", map.cls, className)} role={tone === "error" ? "alert" : "status"}>
      <map.Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div className="min-w-0">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn("mt-0.5 leading-7", title ? "opacity-90" : "")}>{children}</div>}
      </div>
    </div>
  );
}

/* ------------------------------ حالة فارغة ------------------------------ */

export function EmptyState({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-mist-300 bg-mist-50 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-navy-400 shadow-card">
        {icon ?? <IconSearch className="h-6 w-6" />}
      </div>
      <h3 className="text-base font-bold text-navy-800">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-7 text-mist-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------- أفاتار -------------------------------- */

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className={cn("rounded-full object-cover ring-2 ring-white", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-navy-700 font-bold text-gold-200 ring-2 ring-white", className)}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

/* -------------------------------- تقييم --------------------------------- */

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  if (!value) {
    return <span className={cn("inline-flex items-center gap-1 text-xs text-mist-500", className)}>لا توجد تقييمات</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold text-gold-600", className)}>
      <IconStar className="h-4 w-4 fill-gold-400 stroke-gold-500" />
      <span className="tabular-nums">{value.toFixed(1)}</span>
      {count !== undefined && <span className="font-medium text-mist-500">({count})</span>}
    </span>
  );
}

/* ------------------------------ هياكل تحميل ------------------------------ */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LoadingBlock({ label = "جارٍ التحميل…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-mist-500">
      <Spinner className="h-5 w-5 text-navy-500" />
      {label}
    </div>
  );
}

/* -------------------------------- إحصاءات -------------------------------- */

export function StatCard({
  label, value, hint, icon, tone = "navy", trend,
}: { label: string; value: ReactNode; hint?: string; icon?: ReactNode; tone?: Tone; trend?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.8rem] font-semibold text-mist-600">{label}</p>
          <p className="mt-1.5 font-display text-[1.85rem] font-extrabold leading-none text-navy-800 tabular-nums">{value}</p>
          {hint && <p className="mt-2 text-xs leading-5 text-mist-500">{hint}</p>}
          {trend && <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-success">{trend}</p>}
        </div>
        {icon && (
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", toneClass[tone])}>{icon}</span>
        )}
      </div>
    </Card>
  );
}

/* --------------------------------- جداول --------------------------------- */

export function TableShell({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-mist-200">
      <table className="table-shell">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && <div className="px-4 py-10 text-center text-sm text-mist-500">لا توجد بيانات لعرضها</div>}
    </div>
  );
}
