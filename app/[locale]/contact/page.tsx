import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Kontakt oss
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Har du spørsmål eller tilbakemeldinger? Vi hører gjerne fra deg!
            </p>
          </div>
        </section>

        {/* Contact Information */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">
                Kontaktinformasjon
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">E-post</h3>
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
                    <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
                    <p className="text-gray-600">
                      DinLinks AS<br />
                      Oslo, Norge
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
                    <h3 className="font-semibold text-gray-900 mb-1">Åpningstider</h3>
                    <p className="text-gray-600">
                      Mandag - fredag: 09:00 - 17:00<br />
                      Lørdag - søndag: Stengt
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="card p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">
                Send oss en melding
              </h2>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="label">
                    Navn
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="input"
                    placeholder="Ditt navn"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="label">
                    E-post
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="input"
                    placeholder="din@epost.no"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="label">
                    Emne
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    className="input"
                    placeholder="Hva gjelder henvendelsen?"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="label">
                    Melding
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="input resize-none"
                    placeholder="Skriv din melding her..."
                    required
                  />
                </div>

                <button type="submit" className="w-full btn btn-primary btn-lg">
                  Send melding
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center tracking-tight">
              Ofte stilte spørsmål
            </h2>
            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hvordan registrerer jeg min bedrift?
                </h3>
                <p className="text-gray-600">
                  Klikk på "Registrer deg" øverst på siden, fyll ut skjemaet med bedriftsinformasjon, og vent på godkjenning fra vårt team.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Er det gratis å registrere bedriften min?
                </h3>
                <p className="text-gray-600">
                  Ja, grunnleggende registrering er gratis. Vi tilbyr også premium-pakker med ekstra funksjoner og synlighet.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Hvor lang tid tar det før bedriften min blir godkjent?
                </h3>
                <p className="text-gray-600">
                  Vi behandler alle søknader innen 1-2 virkedager. Du vil motta en e-post når bedriften din er godkjent.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kan jeg redigere bedriftsprofilen min etter publisering?
                </h3>
                <p className="text-gray-600">
                  Ja, du kan når som helst logge inn på dashboardet ditt og oppdatere bedriftsinformasjonen din.
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
