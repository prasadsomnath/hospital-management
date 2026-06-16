import { API_BASE_URL } from "./api-config";
import { getCookie } from "./cookies";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & {
    params?: Record<string, string | number | boolean | undefined>;
  } = {},
): Promise<T> {
  const token =
    getCookie("auth-token") ||
    (typeof window !== "undefined" ? localStorage.getItem("auth-token") : null);

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...Object.fromEntries(
      Object.entries(options.headers || {}).filter(
        ([_, v]) => v !== undefined && v !== null,
      ) as [string, string][],
    ),
  };

  let urlPath = endpoint;
  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      urlPath += (urlPath.includes("?") ? "&" : "?") + queryString;
    }
  }

  const response = await fetch(`${API_BASE_URL}${urlPath}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      const authStr = localStorage.getItem("hospital-auth");
      let isDemo = false;
      if (authStr) {
        try {
          const authState = JSON.parse(authStr);
          isDemo =
            authState.state?.user?.isDemo ||
            authState.state?.user?.email?.includes("skyllx.com");
        } catch {}
      }
      if (!isDemo && token !== "dev-mock-token") {
        localStorage.removeItem("auth-token");
        localStorage.removeItem("hospital-auth");
        document.cookie =
          "auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie =
          "hospital-auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        window.location.href = "/login";
      }
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        errorData.error ||
        `HTTP error! status: ${response.status}`,
    );
  }

  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
