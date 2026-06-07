import createMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

// Routes that require a logged-in user to redirect away from
const AUTH_ROUTES   = ["/login", "/signup"];
// Routes that require any authenticated user
const PRIVATE_ROUTES = ["/dashboard"];
// Routes that require the ADMIN role
const ADMIN_ROUTES  = ["/admin"];

/** Strip the locale prefix so we can match clean paths */
function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(en|no)/, "") || "/";
}

/** Prefix a path with the detected locale */
function withLocale(locale: string, path: string): string {
  return `/${locale}${path}`;
}

export default auth((req: any) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn   = !!req.auth;
  const userRole     = req.auth?.user?.role as string | undefined;

  // Detect the locale present in the URL (default to "no")
  const localeMatch  = pathname.match(/^\/(en|no)/);
  const locale       = localeMatch ? localeMatch[1] : routing.defaultLocale;

  const clean = stripLocale(pathname);

  // Redirect logged-in users away from login/signup
  if (AUTH_ROUTES.some((r) => clean.startsWith(r)) && isLoggedIn) {
    const dest = userRole === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(
      new URL(withLocale(locale, dest), req.url)
    );
  }

  // Redirect unauthenticated users away from private routes
  if (PRIVATE_ROUTES.some((r) => clean.startsWith(r)) && !isLoggedIn) {
    return NextResponse.redirect(
      new URL(withLocale(locale, "/login"), req.url)
    );
  }

  // Admin-only routes
  if (ADMIN_ROUTES.some((r) => clean.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(withLocale(locale, "/login"), req.url)
      );
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(
        new URL(withLocale(locale, "/dashboard"), req.url)
      );
    }
  }

  // Hand off to next-intl for locale detection + redirection
  return handleI18n(req);
});

export const config = {
  // Run on all paths except static assets and API routes
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
