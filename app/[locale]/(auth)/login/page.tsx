"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth.login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fallback state from signup: account created but auto sign-in did not
  // complete. Success-neutral, informational — not an error.
  const registered = searchParams.get("registered") === "1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errorInvalid"));
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">DinLinks</h1>
          </Link>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t("title")}</h2>
          <p className="text-gray-500">{t("subtitle")}</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 md:p-10">
          {registered && (
            <div
              role="status"
              className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-xl text-sm mb-6"
            >
              {t("registeredNotice")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="label">
                  {t("email")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-lg focus:!border-gray-900 focus:!ring-gray-200"
                  placeholder={t("emailPlaceholder")}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  {t("password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-lg focus:!border-gray-900 focus:!ring-gray-200"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-xl bg-gray-900 text-white font-semibold py-3.5 text-base hover:bg-gray-800 active:scale-[0.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-8"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("submitting")}
                </>
              ) : (
                t("submit")
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              {t("noAccount")}{" "}
              <Link
                href="/signup"
                className="font-semibold text-gray-900 underline underline-offset-2 hover:text-gray-600 transition-colors"
              >
                {t("signUp")}
              </Link>
            </p>
          </div>
        </div>

        {/* Legal */}
        <p className="text-center text-xs text-gray-500 mt-8">
          {t.rich("terms", {
            terms: (chunks) => (
              <Link href="/terms" className="underline underline-offset-2 hover:text-gray-700">{chunks}</Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline underline-offset-2 hover:text-gray-700">{chunks}</Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
