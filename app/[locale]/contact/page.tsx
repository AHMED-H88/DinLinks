import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("contact");
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              {t("title")}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {t("subtitle")}
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">
                {t("info.heading")}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t("info.email")}</h3>
                    <a href="mailto:support@dinlinks.no" className="text-primary-600 hover:text-primary-700 transition-colors">
                      support@dinlinks.no
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t("info.address")}</h3>
                    <p className="text-gray-600">
                      {t("info.company")}<br />
                      {t("info.location")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{t("info.hours")}</h3>
                    <p className="text-gray-600">
                      {t("info.weekdays")}<br />
                      {t("info.weekend")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
                {t("form.heading")}
              </h2>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="label">
                    {t("form.name")}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input"
                    placeholder={t("form.namePlaceholder")}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="label">
                    {t("form.email")}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input"
                    placeholder={t("form.emailPlaceholder")}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="label">
                    {t("form.subject")}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="input"
                    placeholder={t("form.subjectPlaceholder")}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="label">
                    {t("form.message")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="input resize-none"
                    placeholder={t("form.messagePlaceholder")}
                    required
                  />
                </div>

                <button type="submit" className="w-full btn btn-primary btn-lg">
                  {t("form.submit")}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center tracking-tight">
              {t("faq.heading")}
            </h2>
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("faq.q1")}
                </h3>
                <p className="text-gray-600">
                  {t("faq.a1")}
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("faq.q2")}
                </h3>
                <p className="text-gray-600">
                  {t("faq.a2")}
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("faq.q3")}
                </h3>
                <p className="text-gray-600">
                  {t("faq.a3")}
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t("faq.q4")}
                </h3>
                <p className="text-gray-600">
                  {t("faq.a4")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
