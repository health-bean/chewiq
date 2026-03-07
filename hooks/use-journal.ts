"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { JournalEntry, JournalScores } from "@/types";

interface UseJournalReturn {
  entry: JournalEntry | null;
  loading: boolean;
  hasEntryToday: boolean;
  saveScores: (scores: JournalScores) => Promise<void>;
}

export function useJournal(date?: string): UseJournalReturn {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const fetchEntry = useCallback(async () => {
    try {
      const res = await fetch(`/api/journal?date=${targetDate}`);
      if (res.ok) {
        const data = await res.json();
        setEntry(data.entry ?? null);
      }
    } catch (err) {
      console.error("Failed to fetch journal entry:", err);
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchEntry();
    }
  }, [fetchEntry]);

  const saveScores = useCallback(
    async (scores: JournalScores) => {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryDate: targetDate, ...scores }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntry(data.entry ?? null);
      }
    },
    [targetDate]
  );

  const hasEntryToday = entry !== null;

  return { entry, loading, hasEntryToday, saveScores };
}
