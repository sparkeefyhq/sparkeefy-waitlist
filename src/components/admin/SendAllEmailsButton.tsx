"use client";

import { useState, useTransition } from "react";
import { sendAllWelcomeEmailsAction } from "@/app/admin/actions";
import type { BulkEmailResult } from "@/app/admin/actions";

export function SendAllEmailsButton({ unsentCount }: { unsentCount: number }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkEmailResult | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (unsentCount === 0 && !result) {
    return (
      <span className="text-xs text-muted-foreground">
        All welcome emails sent
      </span>
    );
  }

  function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setConfirming(false);
    setError("");
    setResult(null);

    startTransition(async () => {
      const res = await sendAllWelcomeEmailsAction();
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setError(res.error ?? "Failed to send emails");
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      {confirming && !isPending && (
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          Cancel
        </button>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50 ${
          confirming
            ? "bg-amber-600 hover:bg-amber-700"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isPending ? (
          <>
            <svg
              className="h-3.5 w-3.5 animate-spin"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="28"
                strokeDashoffset="8"
                strokeLinecap="round"
              />
            </svg>
            Sending to {unsentCount} user{unsentCount === 1 ? "" : "s"}…
          </>
        ) : confirming ? (
          `Confirm: send to ${unsentCount} user${unsentCount === 1 ? "" : "s"}?`
        ) : (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.75 2h12.5a.75.75 0 0 1 .721.544l-6.97 4.39-6.972-4.39A.75.75 0 0 1 1.75 2ZM1 3.788v8.462A.75.75 0 0 0 1.75 13h12.5a.75.75 0 0 0 .75-.75V3.788l-6.692 4.214a.75.75 0 0 1-.816 0L1 3.788Z" />
            </svg>
            Send all unsent ({unsentCount})
          </>
        )}
      </button>

      {result && (
        <span className="text-xs">
          <span className="text-green-600">{result.sent} sent</span>
          {result.failed > 0 && (
            <span className="text-red-500"> · {result.failed} failed</span>
          )}
          {result.remaining > 0 && (
            <span className="text-muted-foreground"> · {result.remaining} still pending</span>
          )}
        </span>
      )}

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
