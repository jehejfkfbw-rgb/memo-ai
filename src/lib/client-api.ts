export type ApiResponse<T = unknown> = { ok: boolean; message?: string; data?: T; details?: unknown };

export class ClientApiError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api<T = unknown>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown; cache?: RequestCache } = {},
): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? "GET",
    cache: options.cache ?? "no-store",
    headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await res.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!res.ok || !payload?.ok) {
    const details = payload?.details;
    const detailMsg =
      Array.isArray(details) && details.length
        ? (details as Array<{ message?: string; path?: string }>).map((d) => `${d.path ? d.path + ": " : ""}${d.message ?? ""}`).join("، ")
        : null;
    throw new ClientApiError(res.status, payload?.message ?? detailMsg ?? "تعذّر تنفيذ الطلب", details);
  }
  return (payload.data ?? (payload as unknown)) as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ClientApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "حدث خطأ غير متوقع";
}
