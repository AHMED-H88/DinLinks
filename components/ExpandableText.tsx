"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Progressive-disclosure text block for the Company Profile.
 *
 * Shows a line-clamped preview and reveals the full text inline on demand.
 * The toggle button is rendered ONLY when the text actually overflows the
 * clamp, so short content stays fully visible with no redundant control.
 *
 * Presentation only — labels are passed in (localized on the server), and the
 * control is a real <button> with aria-expanded for accessibility.
 */
export default function ExpandableText({
  text,
  clampClass = "line-clamp-4",
  moreLabel,
  lessLabel,
  textClassName = "text-gray-700 leading-relaxed text-[0.9375rem]",
}: {
  text:          string;
  clampClass?:   string;
  moreLabel:     string;
  lessLabel:     string;
  textClassName?: string;
}) {
  const [expanded, setExpanded]       = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Only measure while collapsed: when clamped, an overflowing block reports
    // scrollHeight > clientHeight. Skip while expanded so a resize doesn't wrongly
    // clear the control.
    const measure = () => {
      if (!expanded) setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text, expanded]);

  return (
    <div>
      <div
        ref={ref}
        className={`whitespace-pre-line ${textClassName} ${expanded ? "" : clampClass}`}
      >
        {text}
      </div>
      {overflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-2 text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
