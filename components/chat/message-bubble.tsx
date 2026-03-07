import type { Message } from "@/types";
import { ExtractedCard } from "./extracted-card";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
}

function formatContent(text: string): React.ReactNode[] {
  // Split into paragraphs and handle basic **bold** syntax
  return text.split("\n\n").map((paragraph, i) => {
    const parts = paragraph.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className={i > 0 ? "mt-2" : ""}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={j} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={j}>{part}</span>;
        })}
      </p>
    );
  });
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 text-slate-800"
        )}
      >
        {message.content ? formatContent(message.content) : null}
      </div>

      {/* Extracted entries */}
      {message.extractedData && message.extractedData.length > 0 && (
        <div className="mt-1.5 flex max-w-[85%] flex-col gap-1.5">
          {message.extractedData.map((entry, i) => (
            <ExtractedCard key={i} entry={entry} />
          ))}
        </div>
      )}

      {/* Timestamp */}
      {message.createdAt && (
        <span
          className={cn(
            "mt-1 text-[10px] text-slate-400",
            isUser ? "mr-1" : "ml-1"
          )}
        >
          {formatTime(message.createdAt)}
        </span>
      )}
    </div>
  );
}
