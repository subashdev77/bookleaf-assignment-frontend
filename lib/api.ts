import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  timeout: 30000,
});

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: { field: string; message: string }[] };
}

export const SESSION_EXPIRED_EVENT = "bookleaf:session-expired";

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    const code = error.response?.data?.error?.code;
    if (error.response?.status === 401 && (code === "SESSION_EXPIRED" || code === "INVALID_SESSION" || code === "ACCOUNT_INACTIVE")) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: code }));
    }
    return Promise.reject(error);
  },
);

export function errorCode(error: unknown): string | undefined {
  return (error as AxiosError<ApiErrorBody>)?.response?.data?.error?.code;
}

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const err = error as AxiosError<ApiErrorBody>;
  if (err?.response?.data?.error?.message) return err.response.data.error.message;
  if (err?.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (err?.isAxiosError && !err.response) return "Can't reach the server. Check your connection and try again.";
  return fallback;
}

export function fieldErrors(error: unknown): Record<string, string> {
  const details = (error as AxiosError<ApiErrorBody>)?.response?.data?.error?.details || [];
  return Object.fromEntries(details.map((d) => [d.field, d.message]));
}
