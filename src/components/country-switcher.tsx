"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { CountryFlag } from "@/components/country-flag";
import { COUNTRIES, SUPPORTED_COUNTRY_CODES, type CountryCode } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { IconCheck, IconChevronDown } from "@/components/icons";

/** مبدّل الدولة — محصور في الدول الأربع المدعومة، ويضبط العملة ورمز الاتصال لكل الموقع */
export function CountrySwitcher({ current, tone = "light", className }: { current?: string | null; tone?: "light" | "dark"; className?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<CountryCode | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const active = SUPPORTED_COUNTRY_CODES.includes(current as CountryCode) ? (current as CountryCode) : "EG";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function select(code: CountryCode) {
    setBusy(code);
    try {
      const res = await api<{ code: string }>("/api/country", { method: "POST", body: { code } });
      toast.push(`تم ضبط الدولة على ${COUNTRIES[code].nameAr} — العملة ${COUNTRIES[code].currencyAr}`, "success");
      void res;
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(null);
    }
  }

  const isDark = tone === "dark";

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-bold transition",
          isDark ? "border-white/20 bg-white/5 text-white hover:bg-white/10" : "border-mist-200 bg-white text-navy-800 hover:border-navy-300",
        )}
      >
        <CountryFlag code={active} className="h-3.5 w-5" />
        <span>{COUNTRIES[active].nameAr}</span>
        <IconChevronDown className={cn("h-3.5 w-3.5 opacity-70 transition", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="اختر الدولة"
          className={cn(
            "absolute left-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border shadow-lift animate-fade-up",
            isDark ? "border-white/15 bg-navy-800" : "border-mist-200 bg-white",
          )}
        >
          <li className={cn("px-3.5 py-2.5 text-[0.68rem] font-bold", isDark ? "bg-white/5 text-gold-300" : "bg-mist-50 text-mist-500")}>
            الدول المدعومة حاليًا
          </li>
          {SUPPORTED_COUNTRY_CODES.map((code) => {
            const c = COUNTRIES[code];
            const selected = code === active;
            return (
              <li key={code}>
                <button
                  role="option"
                  aria-selected={selected}
                  disabled={busy !== null}
                  onClick={() => select(code)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3.5 py-2.5 text-right transition disabled:opacity-60",
                    selected
                      ? isDark ? "bg-white/10" : "bg-navy-50"
                      : isDark ? "hover:bg-white/5" : "hover:bg-mist-50",
                  )}
                >
                  <CountryFlag code={code} className="h-4 w-6 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-xs font-extrabold", isDark ? "text-white" : "text-navy-800")}>{c.nameAr}</span>
                    <span className={cn("block text-[0.66rem] font-semibold", isDark ? "text-mist-400" : "text-mist-500")} dir="ltr">
                      {c.dial} · {c.currency}
                    </span>
                  </span>
                  {selected && <IconCheck className={cn("h-4 w-4 shrink-0", isDark ? "text-gold-300" : "text-success")} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
