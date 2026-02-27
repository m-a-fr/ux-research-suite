import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TOOLS = [
  {
    href: "/tools/protocol-generator",
    title: "Générateur de protocole",
    description:
      "Créez des protocoles d'étude UX complets et professionnels en quelques secondes. Adapté à chaque type d'étude : entretien, test d'utilisabilité, survey, diary study.",
    badge: "Disponible",
    badgeVariant: "default" as const,
    icon: "📋",
  },
  {
    href: "#",
    title: "Brief Builder",
    description:
      "Générez des slides de brief claires pour aligner vos stakeholders sur les objectifs, la méthodologie et les décisions attendues.",
    badge: "Bientôt",
    badgeVariant: "secondary" as const,
    icon: "📊",
  },
  {
    href: "#",
    title: "Analyseur de résultats",
    description:
      "Importez vos données brutes (CSV, notes, verbatims) et obtenez un rapport d'insights structuré avec recommandations prioritisées.",
    badge: "Bientôt",
    badgeVariant: "secondary" as const,
    icon: "🔍",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-3">User Research Suite</h1>
        <p className="text-muted-foreground text-lg">
          Automatisez les tâches répétitives du UX research grâce à Claude AI.
          Gagnez du temps, gardez la rigueur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TOOLS.map((tool) => {
          const isAvailable = tool.href !== "#";
          const cardContent = (
            <Card
              className={`h-full transition-shadow ${
                isAvailable
                  ? "hover:shadow-md cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <span className="text-3xl mb-2 block">{tool.icon}</span>
                  <Badge variant={tool.badgeVariant}>{tool.badge}</Badge>
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          );

          return isAvailable ? (
            <Link key={tool.title} href={tool.href} className="block">
              {cardContent}
            </Link>
          ) : (
            <div key={tool.title}>{cardContent}</div>
          );
        })}
      </div>
    </div>
  );
}
