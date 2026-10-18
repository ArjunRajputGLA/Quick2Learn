import { z } from "zod";
import { apiErrorSchema } from "./schemas";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  getHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
  credentials?: RequestCredentials;
  customFetch?: typeof fetch;
}

export interface RequestOptions<T> {
  schema?: z.ZodType<T>;
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
}

export function createApiClient(config: ApiClientConfig) {
  const fetchFn = config.customFetch || globalThis.fetch;
  const baseUrl = config.baseUrl.replace(/\/+$/, "");

  async function request<T>(
    path: string,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    body?: unknown,
    options?: RequestOptions<T>
  ): Promise<T> {
    const dynamicHeaders = config.getHeaders ? await config.getHeaders() : {};

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...dynamicHeaders,
      ...options?.headers,
    };

    if (body !== undefined && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    let url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    if (options?.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryStr = searchParams.toString();
      if (queryStr) {
        url += `${url.includes("?") ? "&" : "?"}${queryStr}`;
      }
    }

    const init: RequestInit = {
      method,
      headers,
      credentials: config.credentials ?? "omit",
    };

    if (body !== undefined) {
      init.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await fetchFn(url, init);
    } catch (networkErr) {
      throw new ApiClientError(
        "NETWORK_ERROR",
        networkErr instanceof Error ? networkErr.message : "Network request failed",
        0
      );
    }

    // Try parsing JSON response
    let json: unknown;
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
    }

    if (!response.ok) {
      // Check if standard API error shape { error: { code, message, details? } }
      const errorParsed = apiErrorSchema.safeParse(json);
      if (errorParsed.success) {
        const { code, message, details } = errorParsed.data.error;
        throw new ApiClientError(code, message, response.status, details);
      }

      const defaultMessage =
        typeof json === "object" && json !== null && "message" in json
          ? String((json as Record<string, unknown>).message)
          : response.statusText || "Request failed";

      throw new ApiClientError(
        `HTTP_${response.status}`,
        defaultMessage,
        response.status,
        json
      );
    }

    // If a Zod schema is provided, parse and validate the payload
    if (options?.schema) {
      const parsed = options.schema.safeParse(json);
      if (!parsed.success) {
        throw new ApiClientError(
          "VALIDATION_ERROR",
          "Response validation failed against expected schema",
          response.status,
          parsed.error.errors
        );
      }
      return parsed.data;
    }

    return json as T;
  }

  return {
    get<T>(path: string, options?: RequestOptions<T>): Promise<T> {
      return request<T>(path, "GET", undefined, options);
    },
    post<T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<T> {
      return request<T>(path, "POST", body, options);
    },
    patch<T>(path: string, body?: unknown, options?: RequestOptions<T>): Promise<T> {
      return request<T>(path, "PATCH", body, options);
    },
    delete<T>(path: string, options?: RequestOptions<T>): Promise<T> {
      return request<T>(path, "DELETE", undefined, options);
    },
    request,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
