"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // The session is fetched once on mount and refreshed by next-auth after
  // sign-in / sign-out. The default window-focus refetch and polling caused
  // repeated /api/auth/session requests; disabling them does not change
  // login/logout or role behaviour.
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
