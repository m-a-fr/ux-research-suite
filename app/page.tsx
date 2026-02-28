import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const GITHUB_URL = "https://github.com/m-a-fr/ux-research-suite";

function IconCode() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function IconUserOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="8" x2="23" y2="14" />
      <line x1="23" y1="8" x2="17" y2="14" />
    </svg>
  );
}

function IconServer() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="8" rx="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function IconZap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

const PAIN_POINTS = [
  {
    number: "01",
    title: "Des heures sur un protocole de zéro",
    description:
      "Chaque étude recommence de la même façon : page blanche, structure à inventer, questions à formuler.",
  },
  {
    number: "02",
    title: "Des stakeholders difficiles à aligner",
    description:
      "Expliquer la méthodologie, justifier les décisions, convaincre de la valeur de la recherche.",
  },
  {
    number: "03",
    title: "Des données brutes sans structure",
    description:
      "Verbatims, CSV Maze, notes d'observation — transformer tout ça en insights prend autant de temps que l'étude.",
  },
];

const FEATURES = [
  {
    number: "01",
    title: "Générateur de protocole",
    description:
      "Entretien exploratoire, test modéré ou non-modéré, survey — obtenez un protocole complet adapté à votre contexte en quelques secondes.",
    details: [
      "Guide animateur rédigé",
      "Scénarios et questions adaptés au contexte",
      "Export Word prêt à l'emploi",
    ],
    href: "/tools/protocol-generator",
    available: true,
  },
  {
    number: "02",
    title: "Brief Builder",
    description:
      "Générez les slides de brief qui expliquent pourquoi vous faites l'étude, avec qui, et ce que vous attendez comme décisions.",
    details: [
      "Slides PowerPoint auto-générées",
      "Layouts visuels adaptés au contenu",
      "Ton calibré par Claude AI",
    ],
    href: "#",
    available: false,
  },
  {
    number: "03",
    title: "Analyseur de résultats",
    description:
      "Importez vos données brutes — CSV, verbatims, notes — et obtenez un rapport d'insights structuré avec recommandations prioritisées.",
    details: [
      "Analyse de verbatims et données quantitatives",
      "Rapport Excel + Word",
      "Insights priorisés par impact",
    ],
    href: "#",
    available: false,
  },
];

const DIFFERENTIATORS = [
  {
    icon: <IconCode />,
    title: "Open-source",
    description: "Code source sur GitHub. Auditez, forkez, contribuez librement.",
  },
  {
    icon: <IconUserOff />,
    title: "Sans compte",
    description: "Aucune inscription. Ouvrez, générez, téléchargez.",
  },
  {
    icon: <IconServer />,
    title: "Self-hostable",
    description: "Vos données restent dans votre infrastructure.",
  },
  {
    icon: <IconZap />,
    title: "Claude AI intégré",
    description: "Propulsé par claude-sonnet-4-6, en streaming temps réel.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero dark ── */}
      <section
        style={{
          background:
            "radial-gradient(ellipse 80% 55% at 50% -5%, oklch(0.45 0.1 240 / 0.22) 0%, transparent 65%), oklch(0.09 0 0)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left */}
          <div>
            <div className="flex items-center gap-2 mb-8 flex-wrap">
              {["Open-source", "Sans compte", "claude-sonnet-4-6"].map((label) => (
                <span
                  key={label}
                  className="text-xs font-mono px-2.5 py-1 rounded-full border border-white/15 text-white/50"
                >
                  {label}
                </span>
              ))}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.1] text-white mb-6">
              Votre assistant{" "}
              <span className="text-white/85">UX research</span>
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.72 0.13 240), oklch(0.78 0.09 275))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                propulsé par Claude AI.
              </span>
            </h1>
            <p className="text-base text-white/45 max-w-md leading-relaxed mb-10">
              Générez protocoles d'étude, slides de brief et analyses de
              résultats en minutes — sans compte, sans abonnement, open-source.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                asChild
                size="lg"
                className="bg-white text-black hover:bg-white/90 font-medium"
              >
                <Link href="/tools/protocol-generator">Essayer maintenant</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/20 text-white/70 hover:bg-white/10 hover:text-white bg-transparent"
              >
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  Voir sur GitHub
                </a>
              </Button>
            </div>
          </div>

          {/* Right — mock protocol output */}
          <div className="hidden lg:block">
            <div
              className="rounded-xl border border-white/10 p-6 font-mono text-sm"
              style={{ background: "oklch(1 0 0 / 0.04)", backdropFilter: "blur(8px)" }}
            >
              <div className="flex items-center gap-2 text-xs text-white/30 pb-4 border-b border-white/10 mb-5">
                <span className="w-2 h-2 rounded-full bg-emerald-400/80 shrink-0" />
                <span>claude-sonnet-4-6 · Protocole généré en 4s</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: "type", value: "Exploratoire" },
                  { label: "durée", value: "45 min" },
                  { label: "participants", value: "8" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-white/30 text-xs mb-1">{item.label}</p>
                    <p className="text-white/80 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-white/10 pt-5 mb-5">
                {[
                  { title: "Introduction", duration: "5 min", type: "intro" },
                  { title: "Mise en contexte", duration: "10 min", type: "warmup" },
                  { title: "Exploration des thèmes", duration: "25 min", type: "themes" },
                  { title: "Clôture", duration: "5 min", type: "closing" },
                ].map((s) => (
                  <div key={s.type} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                      <span className="text-white/60">{s.title}</span>
                    </div>
                    <span className="text-white/25">{s.duration}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/25 pt-4 border-t border-white/10 font-sans">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export Word disponible
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pain points ── */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-12">
            Le quotidien du UX researcher
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {PAIN_POINTS.map((item) => (
              <div key={item.number} className="bg-background p-8">
                <span className="text-6xl font-bold text-muted-foreground/15 font-mono block mb-6 leading-none">
                  {item.number}
                </span>
                <h3 className="font-semibold mb-3 leading-snug">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-14">
            Ce que fait UX Research Suite
          </p>
          <div className="space-y-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="grid grid-cols-1 lg:grid-cols-[260px_1fr] border rounded-xl overflow-hidden"
              >
                <div className="bg-muted/40 p-8 flex flex-col justify-between gap-8">
                  <div>
                    <span className="text-xs font-mono text-muted-foreground/60">
                      {feature.number}
                    </span>
                    <h2 className="text-base font-semibold mt-1 mb-2">{feature.title}</h2>
                    {!feature.available && (
                      <Badge variant="secondary" className="text-xs">
                        Bientôt
                      </Badge>
                    )}
                  </div>
                  {feature.available && (
                    <Button asChild variant="outline" size="sm" className="self-start">
                      <Link href={feature.href}>Ouvrir l'outil →</Link>
                    </Button>
                  )}
                </div>
                <div className="p-8 border-l">
                  <p className="text-muted-foreground leading-relaxed mb-6 text-sm">
                    {feature.description}
                  </p>
                  <ul className="space-y-2.5">
                    {feature.details.map((d) => (
                      <li key={d} className="text-sm flex items-center gap-3">
                        <span className="w-1 h-1 rounded-full bg-foreground/25 shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Differentiators ── */}
      <section className="border-b bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-12">
            Pourquoi pas un template Notion ?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {DIFFERENTIATORS.map((item) => (
              <div key={item.title} className="space-y-3">
                <div className="w-9 h-9 rounded-lg bg-background border flex items-center justify-center text-muted-foreground shadow-sm">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA dark ── */}
      <section
        style={{
          background:
            "radial-gradient(ellipse 70% 90% at 50% 110%, oklch(0.45 0.1 240 / 0.15) 0%, transparent 55%), oklch(0.09 0 0)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-28 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-white/25 mb-6">
            Gratuit · Open-source · Prêt maintenant
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
            Prêt à gagner du temps
            <br />
            sur vos recherches ?
          </h2>
          <p className="text-white/35 mb-10 text-sm">
            Aucune installation. Aucun compte. Juste l'outil.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-black hover:bg-white/90 font-medium"
          >
            <Link href="/tools/protocol-generator">Essayer maintenant</Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-muted-foreground">
            UX Research Suite — Open-source, MIT License
          </p>
          <p className="text-xs text-muted-foreground">
            Propulsé par{" "}
            <a
              href="https://anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              Claude AI
            </a>{" "}
            · Construit avec Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
