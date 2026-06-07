import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/routing";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Om DinLinks
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Vi kobler lokale bedrifter med kunder på en enkel, moderne og effektiv måte.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">
                Vår visjon
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                DinLinks ble grunnlagt med en enkel visjon: å gjøre det lettere for folk å finne og kontakte lokale bedrifter i sitt område.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Vi tror på å støtte lokale bedrifter og hjelpe dem med å vokse ved å gi dem en moderne, profesjonell plattform for å nå sine kunder.
              </p>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl h-80 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-xl font-semibold text-primary-900">Koble bedrifter med kunder</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center tracking-tight">
              Hvorfor velge DinLinks?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card p-8">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Enkel søk
                </h3>
                <p className="text-gray-600">
                  Finn lokale bedrifter raskt og enkelt med vårt intuitive søkesystem.
                </p>
              </div>
              <div className="card p-8">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Moderne plattform
                </h3>
                <p className="text-gray-600">
                  En profesjonell og brukervennlig plattform bygget med de nyeste teknologiene.
                </p>
              </div>
              <div className="card p-8">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Støtte lokale bedrifter
                </h3>
                <p className="text-gray-600">
                  Hjelp lokale bedrifter å vokse ved å gjøre dem mer synlige i ditt område.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              Klar til å komme i gang?
            </h2>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Enten du er en kunde som leter etter lokale tjenester, eller en bedrift som ønsker å nå flere kunder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/search" className="btn btn-primary btn-lg">
                Søk bedrifter
              </Link>
              <Link href="/signup" className="btn btn-outline btn-lg">
                Registrer bedrift
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
