"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Food, Protocol } from "@/types";

interface ProtocolComplianceWarningProps {
  food: Food;
  protocol: Protocol;
  violations: string[];
  onProceed: () => void;
  onCancel: () => void;
}

export function ProtocolComplianceWarning({
  protocol,
  violations,
  onProceed,
  onCancel,
}: ProtocolComplianceWarningProps) {
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
      {/* Header with Icon */}
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
        </div>

        <div className="flex-1">
          {/* Warning Title */}
          <h3 className="text-base font-semibold text-amber-900">
            Protocol Compliance Warning
          </h3>

          {/* Main Warning Message */}
          <p className="mt-2 text-sm text-amber-800">
            This food contains properties that are not allowed on{" "}
            <span className="font-medium">{protocol.name}</span>:
          </p>

          {/* Violations List */}
          <ul className="mt-2 space-y-1">
            {violations.map((violation, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-amber-800"
              >
                <span className="mt-0.5 text-amber-600">•</span>
                <span className="capitalize">{violation}</span>
              </li>
            ))}
          </ul>

          {/* Additional Context */}
          <p className="mt-3 text-xs text-amber-700">
            Logging this food may affect your protocol adherence and could
            trigger symptoms. You can proceed if you&apos;re intentionally
            testing this food.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          size="md"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          size="md"
          onClick={onProceed}
          className="w-full sm:w-auto"
        >
          Proceed Anyway
        </Button>
      </div>
    </div>
  );
}
