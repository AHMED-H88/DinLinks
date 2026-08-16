"use client";

import { signOut } from "next-auth/react";

/**
 * Sign out from the Account surface, using the same next-auth call and
 * callback the Header already uses — no separate auth handling.
 */
export default function SignOutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="w-full py-3.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
    >
      {label}
    </button>
  );
}
