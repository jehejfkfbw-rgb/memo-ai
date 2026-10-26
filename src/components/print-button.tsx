"use client";

import { useState } from "react";
import { IconCertificate } from "@/components/icons";

/** زر طباعة/حفظ الشهادة كملف PDF عبر نافذة الطباعة */
export function PrintButton({ label = "طباعة الشهادة" }: { label?: string }) {
  const [hint, setHint] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => {
          setHint(true);
          window.print();
          setTimeout(() => setHint(false), 3500);
        }}
        className="btn btn-outline btn-sm no-print"
      >
        <IconCertificate className="h-4 w-4" />
        {label}
      </button>
      {hint && (
        <span className="absolute -top-9 right-0 whitespace-nowrap rounded-lg bg-navy-800 px-2.5 py-1.5 text-[0.68rem] font-bold text-white shadow-lift">
          اختر «حفظ كـ PDF» من نافذة الطباعة
        </span>
      )}
    </span>
  );
}
