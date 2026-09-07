import type { SessionOptions } from "iron-session";

/**
 * Typed session data stored in the encrypted iron-session cookie.
 */
export interface SessionData {
  userId?: string;
  email?: string;
  name?: string;
  role?: "ADMIN" | "CO_OWNER";
  isLoggedIn: boolean;
}

/**
 * Default (unauthenticated) session state.
 */
export const defaultSession: SessionData = {
  isLoggedIn: false,
};

/**
 * iron-session configuration.
 *
 * SESSION_SECRET must be at least 32 characters — set it in .env.
 */
export const sessionOptions: SessionOptions = {
  cookieName: "gw_session",
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    // HTTPS only in production
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
