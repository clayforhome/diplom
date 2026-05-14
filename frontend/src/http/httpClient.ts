import { jwtService } from '../utils/jwt';
import type { ApiEnvelope, ApiErrorPayload } from '../types';

type RequestActivityHandlers = {
  onRequestStart?: () => void;
  onRequestEnd?: () => void;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '');
}

function resolveApiUrl(): string {
  const rawUrl = import.meta.env.VITE_API_URL;
  const rawBasePath = import.meta.env.VITE_API_BASE_PATH;

  if (!rawUrl) {
    throw new Error('VITE_API_URL is not defined');
  }

  const normalizedUrl = trimTrailingSlash(rawUrl);
  const normalizedBasePath = rawBasePath ? `/${trimLeadingSlash(rawBasePath)}` : '';

  return `${normalizedUrl}${normalizedBasePath}`;
}

const API_URL = resolveApiUrl();
const requestActivityHandlers: RequestActivityHandlers = {};

export function resolveHttpClientUrl(path: string): string {
  return `${API_URL}${path}`;
}

export function configureHttpClientActivityHandlers(handlers: RequestActivityHandlers) {
  requestActivityHandlers.onRequestStart = handlers.onRequestStart;
  requestActivityHandlers.onRequestEnd = handlers.onRequestEnd;
}

export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;
  details?: string[];
  code?: string;

  constructor(statusCode: number, payload: ApiErrorPayload) {
    super(resolveApiErrorMessage(statusCode, payload));
    this.statusCode = statusCode;
    this.errors = payload.errors;
    this.details = payload.Errors;
    this.code = payload.code;
  }
}

function resolveApiErrorMessage(statusCode: number, payload: ApiErrorPayload): string {
  if (payload.message?.trim()) {
    return payload.message;
  }

  if (payload.detail?.trim()) {
    return payload.detail;
  }

  if (payload.title?.trim()) {
    return payload.title;
  }

  if (Array.isArray(payload.Errors) && payload.Errors.length > 0) {
    return payload.Errors.join('\n');
  }

  if (payload.errors) {
    const messages = Object.values(payload.errors).flat();
    if (messages.length > 0) {
      return messages.join('\n');
    }
  }

  return `HTTP ${statusCode}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? ((await response.json()) as ApiErrorPayload | ApiEnvelope<T>) : null;

  if (!response.ok) {
    throw new ApiError(response.status, (payload as ApiErrorPayload | null) ?? { message: `HTTP ${response.status}` });
  }

  return payload as T;
}

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return typeof payload === 'object' && payload !== null && 'data' in payload && 'status' in payload;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = jwtService.getToken();
  const headers = new Headers(init?.headers);

  if (!(init?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  requestActivityHandlers.onRequestStart?.();

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers
    });

    const payload = await parseResponse<ApiEnvelope<T> | T>(response);
    return isApiEnvelope<T>(payload) ? payload.data : payload;
  } finally {
    requestActivityHandlers.onRequestEnd?.();
  }
}

export const httpClient = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
  postForm<T>(path: string, body: FormData): Promise<T> {
    return request<T>(path, { method: 'POST', body });
  }
};
