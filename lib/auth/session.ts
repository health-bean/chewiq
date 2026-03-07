import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { NextApiRequest, NextApiResponse } from "next";

export interface SessionData {
  userId: string;
  email: string;
  firstName: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "health_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

/**
 * Get session from req/res objects (API routes using pages router style)
 */
export async function getSession(req: NextApiRequest, res: NextApiResponse) {
  return getIronSession<SessionData>(req, res, sessionOptions);
}

/**
 * Get session from cookies() - for use in Server Components and App Router API routes
 */
export async function getSessionFromCookies() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
