import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Personvernerklæring
          </h1>
          <p className="text-lg text-gray-600">
            Sist oppdatert: {new Date().toLocaleDateString("nb-NO")}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              1. Innledning
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Denne personvernerklæringen beskriver hvordan DinLinks ("vi", "oss" eller "vår") samler inn, bruker og beskytter dine personopplysninger når du bruker vår plattform.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Vi er forpliktet til å beskytte personvernet ditt og behandler alle personopplysninger i samsvar med gjeldende personvernlovgivning, inkludert GDPR.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              2. Informasjon vi samler inn
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi samler inn følgende typer informasjon:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Kontaktinformasjon (navn, e-post, telefonnummer)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Bedriftsinformasjon (for bedriftskontoer)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Bruksdata og preferanser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Teknisk informasjon (IP-adresse, nettlesertype)</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              3. Hvordan vi bruker informasjonen
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vi bruker dine personopplysninger til:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Å tilby og forbedre våre tjenester</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Å kommunisere med deg om din konto og tjenester</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Å personalisere din opplevelse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Å sikre plattformens sikkerhet og forebygge svindel</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              4. Deling av informasjon
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Vi selger ikke dine personopplysninger. Vi kan dele informasjon med tjenesteleverandører som hjelper oss med å drive plattformen, men kun i den grad det er nødvendig for å levere våre tjenester.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              5. Dine rettigheter
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Du har rett til å:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Få tilgang til dine personopplysninger</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Rette unøyaktige opplysninger</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Slette dine personopplysninger</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Trekke tilbake samtykke</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              6. Kontakt oss
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Hvis du har spørsmål om denne personvernerklæringen, vennligst kontakt oss på{" "}
              <a href="mailto:privacy@dinlinks.no" className="text-primary-600 hover:text-primary-700 font-medium">
                privacy@dinlinks.no
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
