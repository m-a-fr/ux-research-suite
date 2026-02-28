"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  UnmoderatedTestDesign,
  MonadicFormValues,
  ABFormValues,
  BenchmarkFormValues,
  UnmoderatedFormValues,
} from "@/lib/types/unmoderated";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// ─── Shared constants ──────────────────────────────────────────────────────

const PLATFORM_OPTIONS = [
  { value: "web" as const, label: "Web", desc: "Navigateur desktop ou mobile" },
  { value: "mobile" as const, label: "Mobile", desc: "Application native iOS / Android" },
  { value: "desktop" as const, label: "Desktop", desc: "Application locale (Mac, Windows)" },
];

const FIDELITY_OPTIONS = [
  { value: "live_product" as const, label: "Produit live", desc: "Version en production" },
  { value: "prototype_hifi" as const, label: "Prototype hi-fi", desc: "Figma, InVision…" },
  { value: "prototype_lowfi" as const, label: "Prototype lo-fi", desc: "Wireframe / maquette" },
];

const TOOL_OPTIONS = [
  { value: "Maze" },
  { value: "UserTesting" },
  { value: "Lookback" },
  { value: "Optimal Workshop" },
  { value: "Dovetail" },
  { value: "Useberry" },
  { value: "Hotjar" },
  { value: "Autre" },
];

const STANDARD_SCALES = ["SUS", "UMUX-Lite", "SUPR-Q", "CSAT"];

const PRODUCT_ROLE_OPTIONS = [
  { value: "our_product" as const, label: "Notre produit" },
  { value: "competitor" as const, label: "Concurrent" },
  { value: "previous_version" as const, label: "Version précédente" },
];

// ─── Shared sub-components ─────────────────────────────────────────────────

function ButtonGroup<T extends string>({
  field,
  options,
  cols = 3,
}: {
  field: { value: T; onChange: (v: T) => void };
  options: { value: T; label: string; desc: string }[];
  cols?: number;
}) {
  const gridClass =
    cols === 1 ? "grid-cols-1" :
    cols === 2 ? "grid-cols-2" :
    "grid-cols-1 sm:grid-cols-3";
  return (
    <div className={`grid ${gridClass} gap-2`}>
      {options.map((opt) => {
        const isSelected = field.value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => field.onChange(opt.value)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
              {opt.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
          </button>
        );
      })}
    </div>
  );
}

function ToolSelect({ field }: { field: { value: string; onChange: (v: string) => void } }) {
  return (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner un outil…" />
      </SelectTrigger>
      <SelectContent>
        {TOOL_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.value}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CommonFields<T extends { platform: string; fidelity: string; tool: string; audience: string; duration: number; participants: number }>({
  control,
  durationMin,
  durationMax,
  participantsMin,
  participantsLabel = "Taille d'échantillon",
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  durationMin?: number;
  durationMax?: number;
  participantsMin?: number;
  participantsLabel?: string;
}) {
  return (
    <>
      <FormField
        control={control}
        name="platform"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Plateforme</FormLabel>
            <ButtonGroup field={field} options={PLATFORM_OPTIONS} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="fidelity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Support de test</FormLabel>
            <ButtonGroup field={field} options={FIDELITY_OPTIONS} />
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="tool"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Outil de test</FormLabel>
            <FormControl>
              <ToolSelect field={field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="audience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Profil des participants</FormLabel>
            <FormControl>
              <Input placeholder="Ex : Adultes 25–45 ans, acheteurs en ligne réguliers" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durée estimée (min)</FormLabel>
              <FormControl>
                <Input type="number" min={durationMin ?? 5} max={durationMax ?? 90} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="participants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{participantsLabel}</FormLabel>
              <FormControl>
                <Input type="number" min={participantsMin ?? 5} max={1000} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}

// ─── Test design selector ──────────────────────────────────────────────────

const DESIGN_OPTIONS: { value: UnmoderatedTestDesign; label: string; desc: string }[] = [
  {
    value: "monadic",
    label: "Monadique",
    desc: "Un seul produit ou parcours testé sur grand échantillon. Métriques comportementales + SEQ par tâche.",
  },
  {
    value: "ab",
    label: "A/B comparatif",
    desc: "Deux versions du même parcours. Mêmes tâches, deux variantes. Within ou between subjects.",
  },
  {
    value: "benchmark",
    label: "Benchmark",
    desc: "2 à 5 produits testés avec tâches standardisées et échelles normées (SUS, UMUX-Lite…).",
  },
];

// ─── Monadic sub-form ──────────────────────────────────────────────────────

const monadicSchema = z.object({
  objective: z.string().min(10, "Décrivez l'objectif (min 10 car.)"),
  product_name: z.string().min(2, "Le nom du produit est requis"),
  platform: z.enum(["web", "mobile", "desktop"]),
  fidelity: z.enum(["live_product", "prototype_hifi", "prototype_lowfi"]),
  tool: z.string().min(2),
  audience: z.string().min(3),
  duration: z.coerce.number().int().min(5).max(90),
  participants: z.coerce.number().int().min(5).max(500),
});

function MonadicSubForm({ onSubmit, isLoading }: { onSubmit: (v: MonadicFormValues) => void; isLoading: boolean }) {
  const form = useForm<z.infer<typeof monadicSchema>>({
    resolver: zodResolver(monadicSchema) as Resolver<z.infer<typeof monadicSchema>>,
    defaultValues: { objective: "", product_name: "", platform: "web", fidelity: "live_product", tool: "Maze", audience: "", duration: 15, participants: 20 },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => onSubmit({ ...v, studyType: "unmoderated_usability", testDesign: "monadic" }))} className="space-y-5">
        <FormField control={form.control} name="objective" render={({ field }) => (
          <FormItem>
            <FormLabel>Objectif de recherche</FormLabel>
            <FormControl>
              <Textarea placeholder="Ex : Évaluer si les nouveaux utilisateurs trouvent et utilisent la fonctionnalité de filtre sans aide." rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="product_name" render={({ field }) => (
          <FormItem>
            <FormLabel>Produit testé</FormLabel>
            <FormControl>
              <Input placeholder="Ex : App mobile Decathlon, Site e-commerce v3" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <CommonFields control={form.control} durationMin={5} durationMax={90} participantsMin={5} />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Génération…" : "Générer le script monadique"}
        </Button>
      </form>
    </Form>
  );
}

// ─── A/B sub-form ──────────────────────────────────────────────────────────

const AB_DESIGN_OPTIONS = [
  {
    value: "within" as const,
    label: "Within-subjects",
    desc: "Un participant teste A et B (avec contrebalancement). Permet la comparaison directe. Risque d'effet d'apprentissage.",
  },
  {
    value: "between" as const,
    label: "Between-subjects",
    desc: "Deux cohortes séparées. Pas d'effet d'apprentissage. Nécessite un échantillon plus grand.",
  },
];

const abSchema = z.object({
  ab_design: z.enum(["within", "between"]),
  variant_a_name: z.string().min(1, "Nommez la variante A"),
  variant_a_description: z.string().min(5, "Décrivez ce qui est testé en variante A"),
  variant_b_name: z.string().min(1, "Nommez la variante B"),
  variant_b_description: z.string().min(5, "Décrivez ce qui est testé en variante B"),
  platform: z.enum(["web", "mobile", "desktop"]),
  fidelity: z.enum(["live_product", "prototype_hifi", "prototype_lowfi"]),
  tool: z.string().min(2),
  audience: z.string().min(3),
  duration: z.coerce.number().int().min(5).max(120),
  participants: z.coerce.number().int().min(10).max(500),
});

function ABSubForm({ onSubmit, isLoading }: { onSubmit: (v: ABFormValues) => void; isLoading: boolean }) {
  const form = useForm<z.infer<typeof abSchema>>({
    resolver: zodResolver(abSchema) as Resolver<z.infer<typeof abSchema>>,
    defaultValues: {
      ab_design: "within",
      variant_a_name: "Version A",
      variant_a_description: "",
      variant_b_name: "Version B",
      variant_b_description: "",
      platform: "web",
      fidelity: "live_product",
      tool: "Maze",
      audience: "",
      duration: 20,
      participants: 40,
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => onSubmit({ ...v, studyType: "unmoderated_usability", testDesign: "ab" }))}
        className="space-y-5"
      >
        {/* Design */}
        <FormField control={form.control} name="ab_design" render={({ field }) => (
          <FormItem>
            <FormLabel>Design expérimental</FormLabel>
            <div className="grid grid-cols-1 gap-2">
              {AB_DESIGN_OPTIONS.map((opt) => {
                const isSelected = field.value === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
                  >
                    <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        {/* Variants */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Variante A</p>
          <FormField control={form.control} name="variant_a_name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Nom</FormLabel>
              <FormControl><Input placeholder="Ex : Version actuelle, Navigation A…" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="variant_a_description" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Description (ce qui est testé)</FormLabel>
              <FormControl><Textarea placeholder="Ex : Navigation par catégories avec menu hamburger" rows={2} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Variante B</p>
          <FormField control={form.control} name="variant_b_name" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Nom</FormLabel>
              <FormControl><Input placeholder="Ex : Nouvelle version, Navigation B…" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="variant_b_description" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Description (ce qui est testé)</FormLabel>
              <FormControl><Textarea placeholder="Ex : Navigation par tags avec barre de recherche proéminente" rows={2} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <CommonFields control={form.control} durationMin={5} durationMax={120} participantsMin={10} participantsLabel="Taille d'échantillon" />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Génération…" : "Générer le script A/B"}
        </Button>
      </form>
    </Form>
  );
}

// ─── Benchmark sub-form ────────────────────────────────────────────────────

const BENCHMARK_TYPE_OPTIONS = [
  {
    value: "internal" as const,
    label: "Benchmark interne",
    desc: "Mesurer l'évolution de notre produit dans le temps (v1 → v2).",
  },
  {
    value: "competitive" as const,
    label: "Benchmark compétitif",
    desc: "Comparer notre produit à des solutions concurrentes sur le marché.",
  },
];

const benchmarkSchema = z.object({
  benchmark_type: z.enum(["internal", "competitive"]),
  benchmark_context: z.string().min(10, "Décrivez le contexte du benchmark"),
  standard_scales: z.array(z.string()).min(1),
  platform: z.enum(["web", "mobile", "desktop"]),
  fidelity: z.enum(["live_product", "prototype_hifi", "prototype_lowfi"]),
  tool: z.string().min(2),
  audience: z.string().min(3),
  duration: z.coerce.number().int().min(10).max(180),
  participants: z.coerce.number().int().min(10).max(1000),
});

function BenchmarkSubForm({ onSubmit, isLoading }: { onSubmit: (v: BenchmarkFormValues) => void; isLoading: boolean }) {
  const [products, setProducts] = useState<Array<{ name: string; role: "our_product" | "competitor" | "previous_version" }>>([
    { name: "", role: "our_product" },
    { name: "", role: "competitor" },
  ]);

  const form = useForm<z.infer<typeof benchmarkSchema>>({
    resolver: zodResolver(benchmarkSchema) as Resolver<z.infer<typeof benchmarkSchema>>,
    defaultValues: {
      benchmark_type: "competitive",
      benchmark_context: "",
      standard_scales: ["SUS"],
      platform: "web",
      fidelity: "live_product",
      tool: "Maze",
      audience: "",
      duration: 30,
      participants: 50,
    },
  });

  const selectedScales = form.watch("standard_scales");

  function handleSubmit(v: z.infer<typeof benchmarkSchema>) {
    const validProducts = products.filter((p) => p.name.trim().length > 0);
    if (validProducts.length < 2) {
      alert("Ajoutez au moins 2 produits avec un nom.");
      return;
    }
    onSubmit({ ...v, studyType: "unmoderated_usability", testDesign: "benchmark", products: validProducts });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Type */}
        <FormField control={form.control} name="benchmark_type" render={({ field }) => (
          <FormItem>
            <FormLabel>Type de benchmark</FormLabel>
            <div className="grid grid-cols-1 gap-2">
              {BENCHMARK_TYPE_OPTIONS.map((opt) => {
                const isSelected = field.value === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => field.onChange(opt.value)}
                    className={`rounded-lg border p-3 text-left transition-colors ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
                  >
                    <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            <FormMessage />
          </FormItem>
        )} />

        {/* Context */}
        <FormField control={form.control} name="benchmark_context" render={({ field }) => (
          <FormItem>
            <FormLabel>Contexte du benchmark</FormLabel>
            <FormControl>
              <Textarea placeholder="Ex : Suite à la refonte de notre navigation, mesurer notre progression vs les leaders du marché (Zalando, Asos) sur le parcours de recherche produit." rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {/* Products */}
        <div>
          <p className="text-sm font-medium mb-2">Produits à tester <span className="text-muted-foreground font-normal">(2 à 5)</span></p>
          <div className="space-y-2">
            {products.map((product, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <Input
                  placeholder={`Nom du produit ${idx + 1}`}
                  value={product.name}
                  onChange={(e) => {
                    const updated = [...products];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setProducts(updated);
                  }}
                  className="flex-1"
                />
                <Select
                  value={product.role}
                  onValueChange={(v) => {
                    const updated = [...products];
                    updated[idx] = { ...updated[idx], role: v as typeof product.role };
                    setProducts(updated);
                  }}
                >
                  <SelectTrigger className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {products.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setProducts(products.filter((_, i) => i !== idx))}
                    className="text-muted-foreground hover:text-destructive text-sm px-2 py-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {products.length < 5 && (
            <button
              type="button"
              onClick={() => setProducts([...products, { name: "", role: "competitor" }])}
              className="mt-2 text-xs text-primary hover:underline"
            >
              + Ajouter un produit
            </button>
          )}
        </div>

        {/* Standard scales */}
        <FormField control={form.control} name="standard_scales" render={({ field }) => (
          <FormItem>
            <FormLabel>Échelles normées</FormLabel>
            <div className="flex flex-wrap gap-2 mt-1">
              {STANDARD_SCALES.map((scale) => {
                const isSelected = selectedScales.includes(scale);
                return (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => {
                      const current = field.value as string[];
                      field.onChange(
                        isSelected ? current.filter((s) => s !== scale) : [...current, scale]
                      );
                    }}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {scale}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              SUS = 10 items (0–100) · UMUX-Lite = 2 items (1–7) · SUPR-Q = 8 items
            </p>
            <FormMessage />
          </FormItem>
        )} />

        <CommonFields control={form.control} durationMin={10} durationMax={180} participantsMin={10} participantsLabel="Taille d'échantillon" />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Génération…" : "Générer le script benchmark"}
        </Button>
      </form>
    </Form>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface UnmoderatedFormProps {
  onSubmit: (values: UnmoderatedFormValues) => void;
  isLoading: boolean;
}

export function UnmoderatedForm({ onSubmit, isLoading }: UnmoderatedFormProps) {
  const [testDesign, setTestDesign] = useState<UnmoderatedTestDesign>("monadic");

  return (
    <div className="space-y-5">
      {/* Test design selector */}
      <div>
        <p className="text-sm font-medium mb-2">Design de test</p>
        <div className="space-y-2">
          {DESIGN_OPTIONS.map((opt) => {
            const isSelected = testDesign === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isLoading}
                onClick={() => setTestDesign(opt.value)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </p>
                  {opt.value === "ab" && (
                    <Badge className="bg-blue-100 text-blue-800 border-0 text-xs">Within / Between</Badge>
                  )}
                  {opt.value === "benchmark" && (
                    <Badge className="bg-violet-100 text-violet-800 border-0 text-xs">SUS · UMUX-Lite</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Sub-form */}
      {testDesign === "monadic" && (
        <MonadicSubForm onSubmit={onSubmit} isLoading={isLoading} />
      )}
      {testDesign === "ab" && (
        <ABSubForm onSubmit={onSubmit} isLoading={isLoading} />
      )}
      {testDesign === "benchmark" && (
        <BenchmarkSubForm onSubmit={onSubmit} isLoading={isLoading} />
      )}
    </div>
  );
}
