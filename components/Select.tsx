"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  /** Shown when value is "" — the empty option is part of `options`, not this. */
  placeholder?: string;
  disabled?: boolean;
  /** Same text as the visible field label; the trigger has no <label> of its own. */
  ariaLabel: string;
  className?: string;
}

/**
 * A listbox that looks like the rest of the editor.
 *
 * A native <select> renders its menu with the operating system's own chrome —
 * on macOS Safari that means a large grey panel in the system accent colour,
 * which is the one place the workspace stopped looking like DinLinks. Only the
 * menu is the problem, so only the menu is replaced: this is presentation, and
 * the value it reports is the same string a <select> would have reported.
 *
 * Follows the ARIA combobox pattern with aria-activedescendant: focus stays on
 * the trigger the whole time and the active option is named rather than
 * focused. That keeps one focus stop, so Tab moves past the field as expected
 * and closing never has to hunt for where focus went.
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ariaLabel,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef   = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef   = useRef<HTMLUListElement>(null);

  const baseId     = useId();
  const listboxId  = `${baseId}-listbox`;
  const optionId   = (i: number) => `${baseId}-option-${i}`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected      = selectedIndex >= 0 ? options[selectedIndex] : null;

  const close = useCallback((refocus = true) => {
    setOpen(false);
    setActiveIndex(-1);
    if (refocus) buttonRef.current?.focus();
  }, []);

  // Opening lands on the current choice rather than the top of the list, so
  // the first arrow press moves from where the user already is.
  const openList = useCallback(() => {
    if (disabled) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }, [disabled, selectedIndex]);

  // Pointer down rather than click: a click that starts inside the list and
  // ends outside it should not read as an outside dismissal.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  // Keep the active option in view when arrowing past either end of the
  // scrollable area. Layout effect so it never paints at the wrong offset.
  useLayoutEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)
      ?.scrollIntoView({ block: "nearest" });
    // optionId is derived from baseId, which is stable for this instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!open) {
      // Enter is deliberately absent: inside a form it must keep submitting.
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        // Let focus leave, but do not leave a menu hanging over the page.
        close(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? close(false) : openList())}
        onKeyDown={onKeyDown}
        className="input flex items-center justify-between gap-2 text-left disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${selected ? "text-gray-900" : "text-gray-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          className="absolute z-40 mt-1.5 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-[0_4px_16px_rgba(17,24,39,0.08)]"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isActive   = i === activeIndex;
            return (
              <li
                key={option.value || "__empty__"}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                // Pointer-down commits before the outside handler can see it,
                // and keeps the trigger's focus ring from flickering.
                onPointerDown={(e) => { e.preventDefault(); commit(i); }}
                onPointerEnter={() => setActiveIndex(i)}
                className={`flex items-center justify-between gap-2 px-3.5 min-h-[40px] py-2 text-[0.9375rem] cursor-pointer transition-colors ${
                  isActive ? "bg-gray-50" : ""
                } ${isSelected ? "font-semibold text-gray-900" : "text-gray-700"}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && (
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
