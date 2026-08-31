import type { Metadata } from "next";

// Login and signup are for people who already chose DinLinks, not for search
// results: noindex keeps them out of the index, follow keeps their header and
// footer links passing signal. They stay crawlable on purpose — a robots.txt
// block would hide this very directive from the crawler (approved indexation
// policy). Both pages are client components and cannot export metadata
// themselves, so this route-group server layout is the metadata hook.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
