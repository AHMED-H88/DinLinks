"use client";

import { Children, useState } from "react";

/**
 * Renders the first `initialCount` children and reveals the rest inline on
 * demand, preserving the container layout (grid or stack) via `containerClassName`.
 *
 * The toggle is rendered ONLY when there are more children than the initial
 * count, so short lists show everything with no redundant control. Presentation
 * only; labels are passed in (localized on the server).
 */
export default function CollapsibleItems({
  children,
  initialCount,
  moreLabel,
  lessLabel,
  containerClassName = "",
}: {
  children:           React.ReactNode;
  initialCount:       number;
  moreLabel:          string;
  lessLabel:          string;
  containerClassName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const items   = Children.toArray(children);
  const hasMore = items.length > initialCount;
  const shown   = expanded ? items : items.slice(0, initialCount);

  return (
    <div>
      <div className={containerClassName}>{shown}</div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 text-sm font-medium text-gray-900 underline underline-offset-2 hover:text-gray-600"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}
