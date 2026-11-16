import type { Metadata } from 'next'
import './styles.css'
import '../components/my-mexico-redesign.css'

export const metadata: Metadata = {
  title: 'Mi México. A Mi Manera. · Travel México',
  description:
    'Diseña tu experiencia personalizada en México. Explora Baja California y el Caribe Mexicano a tu manera.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body data-site="travelmexico">
        <header>
          <a className="brand" href="/">
            TRAVEL MÉXICO
            <span>GUÍAS · CONTEXTO · FUENTES</span>
          </a>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
