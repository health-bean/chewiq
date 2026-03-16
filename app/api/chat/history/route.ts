import { NextResponse } from "next/server";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";
import { log } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse query params ───────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    let conversationId = searchParams.get("conversationId");

    // If no conversationId provided, find the user's most recent conversation
    if (!conversationId) {
      const [mostRecent] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.userId, session.userId))
        .orderBy(desc(conversations.updatedAt))
        .limit(1);

      if (!mostRecent) {
        return NextResponse.json({
          conversation: null,
          messages: [],
        });
      }

      conversationId = mostRecent.id;
    }

    // ── Verify ownership ─────────────────────────────────────────────
    const [conversation] = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        userId: conversations.userId,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userId !== session.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // ── Load messages ────────────────────────────────────────────────
    const conversationMessages = await db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        extractedData: messages.extractedData,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      messages: conversationMessages,
    });
  } catch (error) {
    log.error("Chat history error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
