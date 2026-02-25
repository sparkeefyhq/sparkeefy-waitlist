"use client";

import { useState, useTransition } from "react";
import { sendWelcomeEmailAction } from "@/app/admin/actions";

export function SendEmailButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function handleClick() {
    setStatus("idle");
    setErrorMsg("");
    startTransition(async () => {
      const result = await sendWelcomeEmailAction(userId);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMsg(result.error ?? "Failed");
      }
    });
  }

  if (status === "success") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16Zm3.78-9.72a.75.75 0 0 0-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.06 0l4.25-4.25Z" />
        </svg>
        Sent
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
        title={`Send welcome email to ${email}`}
      >
        {isPending ? (
          <>
            <svg
              className="h-3 w-3 animate-spin"
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
            Sending…
          </>
        ) : (
          <>
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.75 2h12.5a.75.75 0 0 1 .721.544l-6.97 4.39-6.972-4.39A.75.75 0 0 1 1.75 2ZM1 3.788v8.462A.75.75 0 0 0 1.75 13h12.5a.75.75 0 0 0 .75-.75V3.788l-6.692 4.214a.75.75 0 0 1-.816 0L1 3.788Z" />
            </svg>
            Send
          </>
        )}
      </button>
      {status === "error" && (
        <span className="max-w-[140px] truncate text-[10px] text-red-500" title={errorMsg}>
          {errorMsg}
        </span>
      )}
    </div>
  );
}
