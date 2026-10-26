"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconAlert, IconChevronDown, IconClose } from "@/components/icons";
import { Button, Spinner } from "@/components/ui";

/* --------------------------------- نافذة --------------------------------- */

export function Modal({
  open, onClose, title, description, children, footer, size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[size];

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-navy-950/55 p-4 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} aria-label="إغلاق" tabIndex={-1} />
      <div className={cn("relative my-auto w-full rounded-2xl bg-white shadow-lift animate-fade-up", width)}>
        <div className="flex items-start justify-between gap-4 border-b border-mist-200 px-6 py-4">
          <div>
            <h3 className="text-lg font-extrabold text-navy-800">{title}</h3>
            {description && <p className="mt-1 text-sm leading-6 text-mist-600">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-mist-400 transition hover:bg-mist-100 hover:text-navy-700" aria-label="إغلاق النافذة">
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-mist-200 bg-mist-50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "تأكيد الحذف", onConfirm, onCancel, busy, tone = "danger",
}: {
  open: boolean; title: string; message: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void; busy?: boolean; tone?: "danger" | "primary";
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={busy}>إلغاء</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner />}
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone === "danger" ? "bg-danger-soft text-danger" : "bg-navy-100 text-navy-700")}>
          <IconAlert className="h-5 w-5" />
        </span>
        <p className="text-sm leading-7 text-mist-700">{message}</p>
      </div>
    </Modal>
  );
}

/* ---------------------------------- تبويبات ---------------------------------- */

export function Tabs<T extends string>({
  tabs, value, onChange, className,
}: { tabs: Array<{ key: T; label: string; icon?: ReactNode; count?: number }>; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 rounded-xl border border-mist-200 bg-mist-50 p-1.5", className)} role="tablist">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition",
              active ? "bg-white text-navy-800 shadow-card" : "text-mist-600 hover:bg-white/70 hover:text-navy-700",
            )}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[0.68rem] tabular-nums", active ? "bg-navy-100 text-navy-700" : "bg-mist-200 text-mist-600")}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- أكورديون --------------------------------- */

export function Accordion({ items, className }: { items: Array<{ id: string; title: string; meta?: ReactNode; children: ReactNode }>; className?: string }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id} className={cn("overflow-hidden rounded-xl border transition", isOpen ? "border-navy-200 bg-white shadow-card" : "border-mist-200 bg-white")}>
            <button
              onClick={() => setOpen(isOpen ? null : item.id)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-right"
              aria-expanded={isOpen}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="truncate font-bold text-navy-800">{item.title}</span>
                {item.meta}
              </span>
              <IconChevronDown className={cn("h-5 w-5 shrink-0 text-mist-400 transition-transform", isOpen && "rotate-180 text-navy-600")} />
            </button>
            {isOpen && <div className="border-t border-mist-100 px-5 py-4">{item.children}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- حقول إدخال -------------------------------- */

export function TextField({
  label, hint, error, required, className, ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label className="label" htmlFor={id}>{label}{required && <span className="text-danger"> *</span>}</label>}
      <input id={id} className={cn("field", error && "border-danger")} aria-invalid={Boolean(error)} {...rest} />
      {hint && !error && <p className="mt-1.5 text-xs leading-5 text-mist-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function TextArea({
  label, hint, error, required, className, rows = 4, ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label className="label" htmlFor={id}>{label}{required && <span className="text-danger"> *</span>}</label>}
      <textarea id={id} rows={rows} className={cn("field resize-y", error && "border-danger")} {...rest} />
      {hint && !error && <p className="mt-1.5 text-xs leading-5 text-mist-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function SelectField({
  label, hint, error, required, className, options, placeholder, ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string; hint?: string; error?: string; placeholder?: string;
  options: Array<{ value: string; label: string }>;
}) {
  const id = useId();
  return (
    <div className={className}>
      {label && <label className="label" htmlFor={id}>{label}{required && <span className="text-danger"> *</span>}</label>}
      <div className="relative">
        <select id={id} className={cn("field appearance-none pl-9", error && "border-danger")} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <IconChevronDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" />
      </div>
      {hint && !error && <p className="mt-1.5 text-xs leading-5 text-mist-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

export function SwitchField({ label, hint, checked, onChange, disabled }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-mist-200 bg-mist-50 px-4 py-3">
      <div className="min-w-0">
        <label className="text-sm font-bold text-navy-800" htmlFor={id}>{label}</label>
        {hint && <p className="mt-0.5 text-xs leading-5 text-mist-500">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50", checked ? "bg-success" : "bg-mist-300")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "right-0.5" : "right-[1.4rem]")} />
      </button>
    </div>
  );
}

/* -------------------------------- قائمة أخطاء -------------------------------- */

export function ErrorList({ details }: { details: unknown }) {
  if (!Array.isArray(details) || details.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 rounded-lg bg-danger-soft px-3 py-2 text-xs font-semibold text-danger">
      {(details as Array<{ path?: string; message?: string }>).map((d, i) => (
        <li key={i}>{d.path ? `${d.path}: ` : ""}{d.message}</li>
      ))}
    </ul>
  );
}
