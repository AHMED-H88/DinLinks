"use client";

import { useState } from "react";

/**
 * Reveals additional server-rendered content inline on demand (e.g. the reviews
 * beyond the first few). The `children` are the extra content shown only when
 * expanded; the caller renders the always-visible preview above this component.
 *
 * Presentation only; labels are passed in (localized on the server). The control
 * is a real <button> with aria-expanded for accessibility.
 */
export default function CollapsibleReveal({
  children,
  moreLabel,
  lessLabel,
}: {
  children:  React.ReactNode;
  moreLabel: string;
  lessLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {open && <div className="mt-6">{children}</div>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-4 text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600"
      >
        {open ? lessLabel : moreLabel}
      </button>
    </div>
  );
}
