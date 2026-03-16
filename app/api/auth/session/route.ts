import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import { log } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSessionFromCookies();

    if (!session.userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        userId: session.userId,
        email: session.email,
        firstName: session.firstName,
        isAdmin: session.isAdmin,
      },
    });
  } catch (error) {
    log.error("Session error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
