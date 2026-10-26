"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/client-api";
import { useToast } from "@/components/toast";
import { Alert, Badge, Spinner } from "@/components/ui";
import { IconCheckCircle, IconClose, IconSearch, IconShield } from "@/components/icons";
import { formatDate } from "@/lib/utils";

type VerifyResult =
  | { valid: false; message: string }
  | { valid: true; certificate: { code: string; grade: number; issuedAt: string; student: string; course: string; stage: string } };

export function CertificateVerifier() {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const data = await api<VerifyResult>(`/api/certificates/verify?code=${encodeURIComponent(code.trim())}`);
      setResult(data);
      toast.push(data.valid ? "الشهادة صحيحة وموثّقة" : "لم يتم العثور على الشهادة", data.valid ? "success" : "info");
    } catch (err) {
      toast.push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 font-display text-sm font-extrabold text-navy-800">
        <IconShield className="h-4.5 w-4.5 text-gold-600" />
        التحقّق من صحة شهادة
      </h2>
      <p className="mt-1.5 text-xs leading-6 text-mist-600">
        أدخل رمز الشهادة (مثل <span dir="ltr" className="font-bold">NBR-XXXXXX</span>) للتحقق من أنها صادرة فعليًا من نبراس.
      </p>

      <form onSubmit={verify} className="mt-4 flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="NBR-XXXXXXXX"
          dir="ltr"
          className="field text-center font-bold uppercase"
          aria-label="رمز الشهادة"
        />
        <button type="submit" className="btn btn-primary shrink-0" disabled={busy}>
          {busy ? <Spinner /> : <IconSearch className="h-4 w-4" />}
          تحقّق
        </button>
      </form>

      {result && (
        <div className="mt-4">
          {result.valid ? (
            <Alert tone="success" title="شهادة صحيحة وموثّقة">
              <ul className="mt-2 space-y-1 text-xs">
                <li>الطالب: <b>{result.certificate.student}</b></li>
                <li>الكورس: <b>{result.certificate.course}</b> ({result.certificate.stage})</li>
                <li>التقدير: <b>{result.certificate.grade}٪</b> · تاريخ الإصدار: <b>{formatDate(result.certificate.issuedAt)}</b></li>
                <li className="pt-1"><Badge tone="success"><IconCheckCircle className="h-3.5 w-3.5" />{result.certificate.code}</Badge></li>
              </ul>
            </Alert>
          ) : (
            <Alert tone="error" title="شهادة غير موجودة">
              <span className="inline-flex items-center gap-1.5 text-xs">
                <IconClose className="h-4 w-4" />
                {result.message}
              </span>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}
