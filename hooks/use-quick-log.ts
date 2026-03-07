"use client";

import { useState, useCallback } from "react";
import type { EntryType } from "@/types";

export interface QuickLogItem {
  id: string; // temp client ID
  entryType: EntryType;
  name: string;
  severity?: number;
}

interface UseQuickLogReturn {
  items: QuickLogItem[];
  addItem: (entryType: EntryType, name: string) => void;
  removeItem: (id: string) => void;
  updateSeverity: (id: string, severity: number) => void;
  submitAll: () => Promise<boolean>;
  submitting: boolean;
  clear: () => void;
}

export function useQuickLog(): UseQuickLogReturn {
  const [items, setItems] = useState<QuickLogItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addItem = useCallback((entryType: EntryType, name: string) => {
    // Prevent duplicates
    setItems((prev) => {
      const exists = prev.some(
        (i) => i.entryType === entryType && i.name === name
      );
      if (exists) return prev;
      return [
        ...prev,
        {
          id: `ql-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          entryType,
          name,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateSeverity = useCallback((id: string, severity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, severity } : i))
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const submitAll = useCallback(async () => {
    if (items.length === 0) return false;
    setSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date();
      const entryTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      const entries = items.map((item) => ({
        entryType: item.entryType,
        name: item.name,
        severity: item.severity,
        entryDate: today,
        entryTime,
      }));

      const res = await fetch("/api/entries/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      if (res.ok) {
        setItems([]);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to submit quick log:", err);
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [items]);

  return { items, addItem, removeItem, updateSeverity, submitAll, submitting, clear };
}
