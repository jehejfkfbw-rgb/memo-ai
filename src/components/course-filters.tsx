"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { IconClose, IconSearch } from "@/components/icons";

export type Option = { value: string; label: string };

export function CourseFilters({
  stages, subjects, levels, counts,
}: { stages: Option[]; subjects: Option[]; levels: Option[]; counts: { total: number } }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [stage, setStage] = useState(params.get("stage") ?? "");
  const [subject, setSubject] = useState(params.get("subject") ?? "");
  const [level, setLevel] = useState(params.get("level") ?? "");

  useEffect(() => setQ(params.get("q") ?? ""), [params]);

  function push(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => (v ? sp.set(k, v) : sp.delete(k)));
    sp.delete("page");
    router.push(`/courses?${sp.toString()}`);
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    push({ q });
  }

  const hasFilters = Boolean(q || stage || subject || level);

  return (
    <div className="card sticky top-24 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-sm font-extrabold text-navy-800">تصفية النتائج</h2>
        <span className="text-xs font-bold text-mist-500 tabular-nums">{counts.total} كورس</span>
      </div>

      <form onSubmit={submitSearch} className="relative mb-5">
        <IconSearch className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث باسم الكورس…"
          className="field pr-9"
          aria-label="البحث في الكورسات"
        />
      </form>

      <FilterGroup title="المرحلة التعليمية">
        {stages.map((s) => (
          <Chip key={s.value} active={stage === s.value} onClick={() => push({ stage: stage === s.value ? "" : s.value })}>
            {s.label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="المادة">
        {subjects.map((s) => (
          <Chip key={s.value} active={subject === s.value} onClick={() => push({ subject: subject === s.value ? "" : s.value })}>
            {s.label}
          </Chip>
        ))}
      </FilterGroup>

      <FilterGroup title="المستوى">
        {levels.map((l) => (
          <Chip key={l.value} active={level === l.value} onClick={() => push({ level: level === l.value ? "" : l.value })}>
            {l.label}
          </Chip>
        ))}
      </FilterGroup>

      {hasFilters && (
        <button
          onClick={() => { setQ(""); setStage(""); setSubject(""); setLevel(""); router.push("/courses"); }}
          className="btn btn-ghost btn-sm mt-4 w-full"
        >
          <IconClose className="h-4 w-4" />
          مسح كل عوامل التصفية
        </button>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 border-t border-mist-100 pt-4 first:border-0 first:pt-0">
      <p className="mb-2.5 text-xs font-bold text-mist-600">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-bold transition",
        active ? "border-navy-700 bg-navy-700 text-white shadow-card" : "border-mist-200 bg-white text-mist-600 hover:border-navy-300 hover:text-navy-700",
      )}
    >
      {children}
    </button>
  );
}
