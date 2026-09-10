const rawBase = (import.meta.env.VITE_API_URL ?? "").trim();
const API_BASE = rawBase
  ? rawBase.startsWith("http://") || rawBase.startsWith("https://")
    ? rawBase.replace(/\/$/, "")
    : `https://${rawBase.replace(/\/$/, "")}`
  : "";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("pf_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  get<T>(path: string): Promise<T> {
    return fetch(`${API_BASE}${path}`, { headers: { ...authHeaders() } }).then((r) =>
      handle<T>(r)
    );
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => handle<T>(r));
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((r) => handle<T>(r));
  },
  delete<T>(path: string): Promise<T> {
    return fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    }).then((r) => handle<T>(r));
  },
  upload<T>(path: string, formData: FormData, method: "POST" = "POST"): Promise<T> {
    return fetch(`${API_BASE}${path}`, {
      method,
      headers: { ...authHeaders() },
      body: formData,
    }).then((r) => handle<T>(r));
  },
};

export function mediaUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("/assets/")) {
    return path;
  }
  return `${API_BASE}${path}`;
}
