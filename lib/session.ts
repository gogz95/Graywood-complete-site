import {
  getIronSession,
  type SessionOptions,
  type CookieStore,
} from "iron-session";
import { cookies } from "next/headers";

export interface ProofingSessionData {
  authorizedAlbums?: string[];
}

export const proofingSessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "complex_secret_password_at_least_32_characters_long_graywood_2026",
  cookieName: "gw_proofing_session",
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

const globalProofingMemoryStore = new Map<string, string>();

/**
 * Returns the decrypted iron-session instance.
 * Accepts optional cookie source (e.g. NextRequest.cookies or custom test store).
 * Gracefully falls back to in-memory store in standalone tests when cookies() is outside request scope.
 */
export async function getProofingSession(
  customSource?: CompatibleCookieSource
) {
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
      // In standalone test environments where RequestAsyncStorage is not mounted
      cookieStore = {
        get(name: string) {
          const val = globalProofingMemoryStore.get(name);
          return val ? { name, value: val } : undefined;
        },
        getAll() {
          return Array.from(globalProofingMemoryStore.entries()).map(([name, value]) => ({
            name,
            value,
          }));
        },
        set(name: string, value: string) {
          globalProofingMemoryStore.set(name, value);
        },
      };
    }
  }

  return getIronSession<ProofingSessionData>(
    cookieStore,
    proofingSessionOptions
  );
}

/**
 * Helper to check if a specific album slug has been authorized by the client PIN.
 */
export function isAlbumAuthorized(
  session: ProofingSessionData,
  albumSlug: string
): boolean {
  return (
    Array.isArray(session.authorizedAlbums) &&
    session.authorizedAlbums.includes(albumSlug)
  );
}
