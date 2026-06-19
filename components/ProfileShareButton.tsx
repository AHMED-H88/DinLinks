"use client";

import { useState } from "react";

interface ProfileShareButtonProps {
  title:  string;
  url:    string;
  label:  string; // i18n "Share" / "Del"
  labelCopied: string; // "Copied!" / "Kopiert!"
}

export default function ProfileShareButton({
  title,
  url,
  label,
  labelCopied,
}: ProfileShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Use Web Share API when available (most mobile browsers)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available — silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-600 hover:text-gray-900 min-w-[64px]"
    >
      {copied ? (
        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
      <span className="text-[11px] font-medium leading-none">
        {copied ? labelCopied : label}
      </span>
    </button>
  );
}
