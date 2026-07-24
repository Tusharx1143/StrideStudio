/**
 * Development-only logger.
 *
 * In production builds (__DEV__=false for RN, NODE_ENV=production for server),
 * all log/warn/info calls are no-ops — preventing sensitive data leaks like
 * OAuth tokens, user PII, and API headers from reaching the console.
 *
 * error() is always enabled (errors must surface in production), but the logger
 * strips known sensitive keys from logged objects on all environments.
 */

const isDev: boolean =
  typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production";

/** Keys whose values should never be logged even in dev (tokens, cookies, PII). */
const REDACTED_KEYS = new Set([
  "sessionToken", "accessToken", "refreshToken", "access_token", "refresh_token",
  "token", "authorization", "cookie", "setCookie", "Set-Cookie",
  "email", "password", "secret", "clientSecret",
]);

function safeValue(key: string, value: unknown): unknown {
  if (typeof key === "string" && REDACTED_KEYS.has(key)) {
    if (typeof value === "string" && value.length > 0) return "[REDACTED]";
    return "[REDACTED]";
  }
  if (typeof value === "string" && value.length > 80) {
    // Truncate very long strings (could be encoded tokens)
    return value.substring(0, 40) + "...";
  }
  return value;
}

function safeReplacer(_key: string, value: unknown): unknown {
  if (typeof _key === "string" && REDACTED_KEYS.has(_key)) return "[REDACTED]";
  return value;
}

/** Safe stringify that redacts known sensitive keys. */
function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, safeReplacer, 2);
  } catch {
    return String(obj);
  }
}

function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (arg instanceof Error) return arg.message;
    if (typeof arg === "object" && arg !== null) {
      try {
        return JSON.parse(safeStringify(arg));
      } catch {
        return String(arg);
      }
    }
    // Truncate long strings (potential encoded data)
    if (typeof arg === "string" && arg.length > 200) {
      return arg.substring(0, 80) + `... (${arg.length} chars)`;
    }
    return arg;
  });
}

export const logger = {
  log(...args: unknown[]): void {
    if (!isDev) return;
    console.log(...formatArgs(args));
  },

  info(...args: unknown[]): void {
    if (!isDev) return;
    console.info(...formatArgs(args));
  },

  warn(...args: unknown[]): void {
    if (!isDev) return;
    console.warn(...formatArgs(args));
  },

  /** Always logs (errors must surface), but redacts sensitive data. */
  error(...args: unknown[]): void {
    console.error(...formatArgs(args));
  },
} as const;
