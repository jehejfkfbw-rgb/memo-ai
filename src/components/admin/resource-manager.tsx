"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Badge, Button, Card, EmptyState, Spinner } from "@/components/ui";
import { ConfirmDialog, ErrorList, Modal, SelectField, SwitchField, TextArea, TextField } from "@/components/client-ui";
import { IconEdit, IconEye, IconPlus, IconSearch, IconTrash } from "@/components/icons";
import { cn } from "@/lib/utils";

export type Row = Record<string, unknown>;

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "textarea" | "richtext" | "select" | "boolean" | "tags" | "color";
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  half?: boolean;
  createOnly?: boolean;
  defaultValue?: unknown;
};

export type ColumnDef = {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
  hideOnMobile?: boolean;
};

export type FilterDef = { name: string; label: string; options: Array<{ value: string; label: string }> };

export function ResourceManager({
  entity, fields, columns, title, description, createLabel = "إضافة جديد",
  fixedFilters, filters, searchable = true, readOnly = false, pageSize = 12,
  rowLink, emptyHint, toolbarExtra,
}: {
  entity: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  title?: string;
  description?: string;
  createLabel?: string;
  fixedFilters?: Record<string, string>;
  filters?: FilterDef[];
  searchable?: boolean;
  readOnly?: boolean;
  pageSize?: number;
  rowLink?: (row: Row) => string | null;
  emptyHint?: string;
  toolbarExtra?: ReactNode;
}) {
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formDetails, setFormDetails] = useState<unknown>(null);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const query = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const sp = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (q) sp.set("q", q);
      Object.entries({ ...fixedFilters, ...activeFilters }).forEach(([k, v]) => v && sp.set(k, v));
      const data = await api<{ items: Row[]; total: number }>(`/api/admin/${entity}?${sp.toString()}`);
      setRows(data.items);
      setTotal(data.total);
    } catch (err) {
      setLoadError(errorMessage(err));
      toast.push(errorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  }, [activeFilters, entity, fixedFilters, page, pageSize, q, toast]);

  useEffect(() => {
    void query();
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const blankForm = useMemo(() => {
    const base: Record<string, unknown> = {};
    fields.forEach((f) => {
      base[f.name] = f.defaultValue ?? (f.type === "boolean" ? false : f.type === "tags" ? [] : f.type === "number" ? 0 : "");
    });
    if (fixedFilters) Object.entries(fixedFilters).forEach(([k, v]) => { if (k in base) base[k] = v; });
    return base;
  }, [fields, fixedFilters]);

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setFormError(null);
    setFormDetails(null);
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row);
    const next: Record<string, unknown> = {};
    fields.forEach((f) => {
      const value = row[f.name];
      if (f.type === "boolean") next[f.name] = Boolean(value);
      else if (f.type === "tags") next[f.name] = Array.isArray(value) ? value : [];
      else next[f.name] = value === null || value === undefined ? "" : String(value);
    });
    setForm(next);
    setFormError(null);
    setFormDetails(null);
    setModalOpen(true);
  }

  function setValue(name: string, value: unknown) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function save() {
    setSaving(true);
    setFormError(null);
    setFormDetails(null);
    try {
      const payload: Record<string, unknown> = {};
      fields.forEach((f) => {
        if (f.createOnly && editing) return;
        const value = form[f.name];
        if (f.type === "boolean") payload[f.name] = Boolean(value);
        else if (f.type === "tags") payload[f.name] = (Array.isArray(value) ? value : []).filter((v) => String(v).trim());
        else if (f.type === "number") payload[f.name] = value === "" || value === null ? undefined : Number(value);
        else payload[f.name] = value === "" ? (f.required ? "" : "") : String(value);
      });
      Object.entries(fixedFilters ?? {}).forEach(([k, v]) => {
        if (!(k in payload)) payload[k] = v;
      });

      if (editing?.id) {
        await api(`/api/admin/${entity}/${String(editing.id)}`, { method: "PATCH", body: payload });
        toast.push("تم حفظ التعديلات", "success");
      } else {
        await api(`/api/admin/${entity}`, { method: "POST", body: payload });
        toast.push("تمت الإضافة بنجاح", "success");
      }
      setModalOpen(false);
      await query();
    } catch (err) {
      const msg = errorMessage(err);
      setFormError(msg);
      setFormDetails((err as { details?: unknown }).details);
      toast.push(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting?.id) return;
    setDeleteBusy(true);
    try {
      await api(`/api/admin/${entity}/${String(deleting.id)}`, { method: "DELETE" });
      toast.push("تم الحذف نهائيًا", "info");
      setDeleting(null);
      await query();
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  const visibleFields = fields.filter((f) => !f.createOnly || !editing);

  return (
    <div className="space-y-5">
      {(title || toolbarExtra || !readOnly) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-lg font-extrabold text-navy-800">{title}</h2>}
            {description && <p className="mt-1 text-sm text-mist-600">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toolbarExtra}
            {!readOnly && (
              <Button onClick={openCreate}>
                <IconPlus className="h-4 w-4" />
                {createLabel}
              </Button>
            )}
          </div>
        </div>
      )}

      {(searchable || filters?.length) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {searchable && (
            <div className="relative min-w-[14rem] flex-1">
              <IconSearch className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-400" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="بحث…"
                className="field pr-9"
                aria-label="بحث في الجدول"
              />
            </div>
          )}
          {filters?.map((f) => (
            <div key={f.name} className="w-44">
              <SelectField
                value={activeFilters[f.name] ?? ""}
                placeholder={f.label}
                options={f.options}
                onChange={(e) => { setActiveFilters((s) => ({ ...s, [f.name]: e.target.value })); setPage(1); }}
                aria-label={f.label}
              />
            </div>
          ))}
          <span className="text-xs font-bold tabular-nums text-mist-500">{total} سجل</span>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-mist-500">
            <Spinner className="h-5 w-5 text-navy-500" />
            جارٍ تحميل البيانات…
          </div>
        ) : loadError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-danger">{loadError}</p>
            <Button variant="outline" className="mt-4" onClick={() => void query()}>إعادة المحاولة</Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState title="لا توجد سجلات" description={emptyHint ?? "أضف سجلًا جديدًا ليظهر هنا."} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-shell">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} className={cn(c.hideOnMobile && "hidden md:table-cell")}>{c.label}</th>
                  ))}
                  {!readOnly && <th className="w-24">إجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const href = rowLink?.(row) ?? null;
                  return (
                    <tr key={String(row.id)}>
                      {columns.map((c) => (
                        <td key={c.key} className={cn("text-mist-700", c.hideOnMobile && "hidden md:table-cell")}>
                          {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                        </td>
                      ))}
                      {!readOnly && (
                        <td>
                          <div className="flex items-center gap-1">
                            {href && (
                              <a href={href} className="rounded-lg p-2 text-mist-500 transition hover:bg-navy-50 hover:text-navy-700" title="عرض" aria-label="عرض">
                                <IconEye className="h-4 w-4" />
                              </a>
                            )}
                            <button onClick={() => openEdit(row)} className="rounded-lg p-2 text-mist-500 transition hover:bg-navy-50 hover:text-navy-700" title="تعديل" aria-label="تعديل">
                              <IconEdit className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleting(row)} className="rounded-lg p-2 text-mist-500 transition hover:bg-danger-soft hover:text-danger" title="حذف" aria-label="حذف">
                              <IconTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-mist-100 px-4 py-3">
            <p className="text-xs font-bold text-mist-500 tabular-nums">صفحة {page} من {totalPages}</p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>السابق</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>التالي</Button>
            </div>
          </div>
        )}
      </Card>

      {/* نافذة الإنشاء/التعديل */}
      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? `تعديل: ${String(editing[columns[0]?.key ?? "id"] ?? "")}` : createLabel}
        description={editing ? "عدّل الحقول ثم احفظ التغييرات." : "املأ الحقول المطلوبة لإضافة سجل جديد."}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? <Spinner /> : null}
              {saving ? "جارٍ الحفظ…" : "حفظ"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleFields.map((f) => {
            if (f.type === "boolean") {
              return (
                <div key={f.name} className="sm:col-span-2">
                  <SwitchField
                    label={f.label}
                    hint={f.hint}
                    checked={Boolean(form[f.name])}
                    onChange={(v) => setValue(f.name, v)}
                  />
                </div>
              );
            }
            if (f.type === "tags") {
              const list = Array.isArray(form[f.name]) ? (form[f.name] as string[]) : [];
              return (
                <div key={f.name} className="sm:col-span-2">
                  <p className="label">{f.label}</p>
                  <ul className="space-y-2">
                    {list.map((item, i) => (
                      <li key={i} className="flex gap-2">
                        <input
                          className="field"
                          value={item}
                          placeholder={f.placeholder}
                          onChange={(e) => setValue(f.name, list.map((v, k) => (k === i ? e.target.value : v)))}
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setValue(f.name, list.filter((_, k) => k !== i))} aria-label="حذف السطر">
                          <IconTrash className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setValue(f.name, [...list, ""])}>
                    <IconPlus className="h-3.5 w-3.5" />
                    إضافة سطر
                  </Button>
                  {f.hint && <p className="mt-1.5 text-xs text-mist-500">{f.hint}</p>}
                </div>
              );
            }
            if (f.type === "textarea" || f.type === "richtext") {
              return (
                <div key={f.name} className="sm:col-span-2">
                  <TextArea
                    label={f.label}
                    required={f.required}
                    hint={f.hint}
                    rows={f.type === "richtext" ? 8 : 4}
                    value={String(form[f.name] ?? "")}
                    placeholder={f.placeholder}
                    onChange={(e) => setValue(f.name, e.target.value)}
                  />
                </div>
              );
            }
            if (f.type === "select") {
              return (
                <div key={f.name} className={cn(f.half !== false && "sm:col-span-1")}>
                  <SelectField
                    label={f.label}
                    required={f.required}
                    hint={f.hint}
                    placeholder="اختر…"
                    value={String(form[f.name] ?? "")}
                    options={f.options ?? []}
                    onChange={(e) => setValue(f.name, e.target.value)}
                  />
                </div>
              );
            }
            return (
              <div key={f.name} className={cn(f.half !== false && "sm:col-span-1")}>
                <TextField
                  label={f.label}
                  required={f.required}
                  hint={f.hint}
                  type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "password" ? "password" : f.type === "color" ? "color" : "text"}
                  dir={f.type === "color" || f.type === "email" ? "ltr" : undefined}
                  value={String(form[f.name] ?? "")}
                  placeholder={f.placeholder}
                  onChange={(e) => setValue(f.name, e.target.value)}
                />
              </div>
            );
          })}
        </div>

        {formError ? (
          <div className="mt-4">
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-bold text-danger">{formError}</p>
            {formDetails ? <ErrorList details={formDetails} /> : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        busy={deleteBusy}
        title="تأكيد الحذف"
        message="سيُحذف هذا السجل نهائيًا من قاعدة البيانات، وقد يُحذف معه ما يرتبط به (دروس، أسئلة، تسجيلات). هل أنت متأكد؟"
        onConfirm={confirmDelete}
        onCancel={() => !deleteBusy && setDeleting(null)}
      />
    </div>
  );
}

export function StatusBadge({ value, map }: { value: unknown; map: Record<string, { label: string; tone: "navy" | "gold" | "success" | "warning" | "danger" | "muted" }> }) {
  const entry = map[String(value)] ?? { label: String(value ?? "—"), tone: "muted" as const };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
