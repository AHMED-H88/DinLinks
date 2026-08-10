"use client";

import { useEffect, useRef, useState } from "react";

export interface ProfileNavItem {
  id:    string;
  label: string;
}

/**
 * Horizontal, sticky section navigation for the public Company Profile.
 *
 * Rendering rules live entirely on the server: the page passes only the
 * `items` that correspond to sections it actually rendered, so this component
 * never produces a dead link. It is presentation + scroll-spy only — no data,
 * no business logic. Sticks below the global Header (`top-16`) at a lower
 * z-index (`z-40` < navbar `z-50`) so it can never overlap the Header.
 */
export default function ProfileNav({
  items,
  ariaLabel,
}: {
  items:     ProfileNavItem[];
  ariaLabel: string;
}) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  // Horizontal scroll container (<nav>) + one ref per tab, so we can keep the
  // active tab within view on small screens.
  const scrollRef = useRef<HTMLElement>(null);
  const tabRefs   = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const sections = items
      .map((it) => document.getElementById(it.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      // Top margin clears the sticky Header + this nav; bottom margin biases the
      // "active" section to the one currently near the top of the viewport.
      { rootMargin: "-128px 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [items]);

  // Keep the active tab within the horizontal viewport of the strip. This only
  // ever changes the container's own horizontal scroll position — it never
  // touches page vertical scroll (no scrollIntoView), so the reading position
  // is unaffected. Works generically for any current/future nav item.
  useEffect(() => {
    const container = scrollRef.current;
    const tab       = tabRefs.current[active];
    if (!container || !tab) return;

    const PAD = 20; // comfortable edge padding so the label isn't glued to the edge

    const tabLeft   = tab.offsetLeft;                 // position within scroll content
    const tabRight  = tabLeft + tab.offsetWidth;
    const viewLeft  = container.scrollLeft;            // current horizontal viewport
    const viewRight = viewLeft + container.clientWidth;

    let nextLeft = viewLeft;
    if (tabLeft < viewLeft + PAD) {
      // Active tab is off / near the LEFT edge → reveal it by scrolling left.
      nextLeft = tabLeft - PAD;
    } else if (tabRight > viewRight - PAD) {
      // Active tab is off / near the RIGHT edge → reveal it by scrolling right.
      nextLeft = tabRight - container.clientWidth + PAD;
    }

    // Clamp to the valid scroll range.
    nextLeft = Math.max(0, Math.min(nextLeft, container.scrollWidth - container.clientWidth));

    if (Math.abs(nextLeft - viewLeft) > 1) {
      container.scrollTo({ left: nextLeft, behavior: "smooth" });
    }
  }, [active]);

  if (items.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return; // fall back to native anchor jump
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
    if (typeof history !== "undefined") history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          ref={scrollRef}
          aria-label={ariaLabel}
          className="relative flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px"
        >
          {items.map((it) => (
            <a
              key={it.id}
              ref={(el) => { tabRefs.current[it.id] = el; }}
              href={`#${it.id}`}
              onClick={(e) => handleClick(e, it.id)}
              aria-current={active === it.id ? "true" : undefined}
              className={`whitespace-nowrap px-3.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                active === it.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {it.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
