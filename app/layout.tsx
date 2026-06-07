// Root layout — bare shell only.
// All providers and locale setup live in app/[locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
