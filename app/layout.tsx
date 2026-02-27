import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "User Research Suite",
  description:
    "Outil UX Research propulsé par Claude AI — génération de protocoles, slides de brief et analyse de résultats.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${geist.variable} font-sans antialiased min-h-screen bg-background`}>
        <header className="border-b">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-sm tracking-tight">
              User Research Suite
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/tools/protocol-generator"
                className="text-sm px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Protocole
              </Link>
              <span className="text-sm px-3 py-1.5 rounded-md text-muted-foreground/50 cursor-not-allowed">
                Brief
              </span>
              <span className="text-sm px-3 py-1.5 rounded-md text-muted-foreground/50 cursor-not-allowed">
                Analyse
              </span>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
