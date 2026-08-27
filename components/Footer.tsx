import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();

  const productLinks = [
    { labelKey: "searchBusinesses" as const, href: "/search"     },
    { labelKey: "about"            as const, href: "/about"       },
    { labelKey: "registerBusiness" as const, href: "/signup"      },
  ];

  const legalLinks = [
    { labelKey: "privacy" as const, href: "/privacy" },
    { labelKey: "terms"   as const, href: "/terms"   },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">DL</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                Din<span className="text-gray-900">Links</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-widest">
              {t("product")}
            </h3>
            <ul className="space-y-3">
              {productLinks.map(({ labelKey, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-widest">
              {t("legal")}
            </h3>
            <ul className="space-y-3">
              {legalLinks.map(({ labelKey, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — its own group, not under Legal */}
          <div>
            <h3 className="text-xs font-semibold text-gray-900 mb-4 uppercase tracking-widest">
              {t("contact")}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  {t("contactUs")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* "DinLinks" is the product name. No legal entity is asserted here,
              because none has been verified. */}
          <p className="text-xs text-gray-400">
            © {currentYear} DinLinks {t("rights")}
          </p>
          <p className="text-xs text-gray-400">{t("builtIn")}</p>
        </div>
      </div>
    </footer>
  );
}
