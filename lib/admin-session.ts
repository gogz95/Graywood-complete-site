import {
  getIronSession,
  type SessionOptions,
  type CookieStore,
} from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface AdminUserSession {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "CO_OWNER";
}

export interface AdminSessionData {
  user?: AdminUserSession;
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: SESSION_SECRET environment variable is required in production.");
}

export const adminSessionOptions: SessionOptions = {
  password:
    sessionSecret ||
    "complex_secret_password_at_least_32_characters_long_graywood_2026",
  cookieName: "gw_admin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export interface CompatibleCookieSource {
  get: (name: string) => { name: string; value: string } | undefined;
  getAll?: () => { name: string; value: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set?: (...args: any[]) => unknown;
}

const MAX_STORE_ENTRIES = 100;
const globalAdminMemoryStore = new Map<string, string>();

/**
 * Returns the decrypted iron-session instance for admin authentication.
 */
export async function getAdminSession(customSource?: CompatibleCookieSource) {
  let cookieStore: CookieStore;

  if (customSource) {
    cookieStore = {
      get: (name: string) => customSource.get(name),
      getAll: customSource.getAll ? () => customSource.getAll!() : undefined,
      set: (name: string, value: string, options) => {
        if (customSource.set) {
          return customSource.set(name, value, options);
        }
      },
    };
  } else {
    try {
      const nextCookies = await cookies();
      cookieStore = nextCookies as unknown as CookieStore;
    } catch {
      cookieStore = {
        get(name: string) {
          const val = globalAdminMemoryStore.get(name);
          return val ? { name, value: val } : undefined;
        },
        getAll() {
          return Array.from(globalAdminMemoryStore.entries()).map(
            ([name, value]) => ({
              name,
              value,
            })
          );
        },
        set(name: string, value: string) {
          if (globalAdminMemoryStore.size >= MAX_STORE_ENTRIES) {
            const oldestKey = globalAdminMemoryStore.keys().next().value;
            if (oldestKey) globalAdminMemoryStore.delete(oldestKey);
          }
          globalAdminMemoryStore.set(name, value);
        },
      };
    }
  }

  return getIronSession<AdminSessionData>(cookieStore, adminSessionOptions);
}

/**
 * Server-side authorization guard.
 * Redirects to /admin/login if unauthenticated, or enforces allowed roles.
 */
export async function requireAdminSession(allowedRoles?: Array<"ADMIN" | "CO_OWNER">) {
  const session = await getAdminSession();
  if (!session.user) {
    redirect("/admin/login");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    if (session.user.role === "CO_OWNER") {
      redirect("/admin/gear");
    }
    redirect("/admin/login");
  }

  return session.user;
}
