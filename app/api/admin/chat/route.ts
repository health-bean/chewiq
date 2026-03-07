import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";
import { anthropic } from "@/lib/ai/client";
import { buildAdminSystemPrompt } from "@/lib/ai/admin-system-prompt";
import { adminTools } from "@/lib/ai/admin-tools";
import { processAdminToolCall } from "@/lib/ai/admin-extract";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse body ───────────────────────────────────────────────────
    const body = await request.json();
    const { message, conversationId: incomingConversationId } = body as {
      message: string;
      conversationId?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // ── Conversation: find or create ─────────────────────────────────
    let conversationId = incomingConversationId;

    if (!conversationId) {
      const [newConversation] = await db
        .insert(conversations)
        .values({
          userId: session.userId,
          title: "Admin session",
        })
        .returning({ id: conversations.id });

      conversationId = newConversation.id;
    } else {
      // Verify the conversation belongs to this user
      const [conv] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);

      if (!conv) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    }

    // ── Save user message ────────────────────────────────────────────
    await db
      .insert(messages)
      .values({
        conversationId,
        role: "user",
        content: message,
      })
      .returning({ id: messages.id });

    // ── Load conversation history ────────────────────────────────────
    const history = await db
      .select({
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt));

    // ── Build system prompt ──────────────────────────────────────────
    const systemPrompt = buildAdminSystemPrompt();

    // ── Format messages for Claude ───────────────────────────────────
    const claudeMessages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // ── Stream response ──────────────────────────────────────────────
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (event: object) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        };

        try {
          const currentMessages = [...claudeMessages];
          let finalText = "";

          // Loop: call Claude, handle tool use, repeat until final text
          const MAX_TOOL_ROUNDS = 10;
          for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            const response = await anthropic.messages.create({
              model: "claude-sonnet-4-20250514",
              max_tokens: 4096,
              system: systemPrompt,
              tools: adminTools,
              messages: currentMessages,
            });

            // Collect text blocks and tool_use blocks
            const textBlocks: string[] = [];
            const toolUseBlocks: Anthropic.ContentBlockParam[] = [];

            for (const block of response.content) {
              if (block.type === "text") {
                textBlocks.push(block.text);
              } else if (block.type === "tool_use") {
                toolUseBlocks.push(block);
              }
            }

            // If there's text, stream it to the client
            if (textBlocks.length > 0) {
              const text = textBlocks.join("");
              // Send text in chunks for a streaming feel
              const chunkSize = 50;
              for (let i = 0; i < text.length; i += chunkSize) {
                send({ type: "text", content: text.slice(i, i + chunkSize) });
              }
              finalText += text;
            }

            // If no tool use, we're done
            if (response.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
              break;
            }

            // Process tool calls
            // Add the assistant's full response to messages
            currentMessages.push({
              role: "assistant",
              content: response.content as Anthropic.ContentBlockParam[],
            });

            // Process each tool call and build tool results
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const block of toolUseBlocks) {
              if (block.type !== "tool_use") continue;

              const toolBlock = block as Anthropic.ToolUseBlock;
              const result = await processAdminToolCall(
                toolBlock.name,
                toolBlock.input
              );

              // Stream result info to client
              send({
                type: "extracted",
                entries: [
                  {
                    entryType: "admin",
                    name: toolBlock.name,
                    details: result,
                  },
                ],
              });

              toolResults.push({
                type: "tool_result",
                tool_use_id: toolBlock.id,
                content: JSON.stringify(result),
              });
            }

            // Add tool results to messages
            currentMessages.push({
              role: "user",
              content: toolResults,
            });
          }

          // ── Save assistant message ───────────────────────────────
          const [assistantMessage] = await db
            .insert(messages)
            .values({
              conversationId: conversationId!,
              role: "assistant",
              content: finalText,
            })
            .returning({ id: messages.id });

          // Update conversation timestamp
          await db
            .update(conversations)
            .set({ updatedAt: new Date() })
            .where(eq(conversations.id, conversationId!));

          send({
            type: "done",
            messageId: assistantMessage.id,
            conversationId,
          });

          controller.close();
        } catch (error) {
          console.error("Admin Claude API error:", error);
          send({
            type: "error",
            message: "Something went wrong generating a response.",
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Admin chat route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
