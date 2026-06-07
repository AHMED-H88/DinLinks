import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Vilkår og betingelser
          </h1>
          <p className="text-lg text-gray-600">
            Sist oppdatert: {new Date().toLocaleDateString("nb-NO")}
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              1. Aksept av vilkår
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Ved å bruke DinLinks ("tjenesten") godtar du å være bundet av disse vilkårene og betingelsene. Hvis du ikke godtar disse vilkårene, vennligst ikke bruk tjenesten.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              2. Bruk av tjenesten
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Du godtar å bruke tjenesten kun til lovlige formål og på en måte som ikke krenker rettighetene til, eller begrenser eller hemmer bruken av tjenesten av andre.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Du må ikke bruke tjenesten på en måte som kan skade, deaktivere, overbelaste eller forringe tjenesten, eller forstyrre andre parters bruk av tjenesten.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              3. Brukerkontoer
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              For å få tilgang til visse funksjoner i tjenesten, kan du bli pålagt å opprette en konto. Du godtar å:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Oppgi nøyaktig, fullstendig og oppdatert informasjon</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Opprettholde sikkerheten til passordet ditt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Umiddelbart varsle oss om uautorisert bruk av din konto</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              4. Bedriftsprofiler
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hvis du registrerer en bedriftsprofil, godtar du:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>At all informasjon du oppgir er sann og nøyaktig</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>At du har rett til å representere bedriften</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>At du vil holde informasjonen oppdatert</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>At profilen kan bli verifisert før godkjenning</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              5. Immaterielle rettigheter
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Tjenesten og dens originale innhold, funksjoner og funksjonalitet eies av DinLinks og er beskyttet av norske og internasjonale lover om opphavsrett, varemerke, patent, forretningshemmeligheter og andre immaterielle rettigheter.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              6. Ansvarsfraskrivelse
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Tjenesten leveres "som den er" og "som tilgjengelig" uten noen form for garanti. Vi garanterer ikke at tjenesten vil være uavbrutt, sikker eller feilfri.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              7. Ansvarsbegrensning
            </h2>
            <p className="text-gray-600 leading-relaxed">
              DinLinks skal ikke holdes ansvarlig for indirekte, tilfeldige, spesielle, følgeskader eller straffeskader, inkludert tap av fortjeneste, data, bruk eller andre immaterielle tap.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              8. Endringer i vilkår
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Vi forbeholder oss retten til å endre disse vilkårene når som helst. Vi vil varsle deg om endringer ved å publisere de nye vilkårene på denne siden.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              9. Kontakt oss
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Hvis du har spørsmål om disse vilkårene, vennligst kontakt oss på{" "}
              <a href="mailto:support@dinlinks.no" className="text-primary-600 hover:text-primary-700 font-medium">
                support@dinlinks.no
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
