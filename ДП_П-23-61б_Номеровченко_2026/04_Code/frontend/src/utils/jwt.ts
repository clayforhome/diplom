import type { AuthSession, UserRole } from '../types';

const TOKEN_KEY = 'jwt_token';

interface JwtPayload {
  sub?: string;
  role?: UserRole | UserRole[];
  exp?: number;
}

function decodePayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export const jwtService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
  isExpired(token: string): boolean {
    const payload = decodePayload(token);
    if (!payload?.exp) {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  },
  getSession(token: string): AuthSession | null {
    const payload = decodePayload(token);
    if (!payload) {
      return null;
    }

    const roles = Array.isArray(payload.role)
      ? payload.role
      : payload.role
        ? [payload.role]
        : [];

    return {
      token,
      userId: payload.sub ?? null,
      roles
    };
  }
};
