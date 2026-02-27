"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModeratedFormValues } from "@/lib/types/moderated";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  objective: z.string().min(10, "Décrivez l'objectif de recherche (min 10 car.)"),
  product_name: z.string().min(2, "Le nom du produit est requis"),
  platform: z.enum(["web", "mobile", "desktop"]),
  fidelity: z.enum(["live_product", "prototype_hifi", "prototype_lowfi"]),
  think_aloud: z.enum(["concurrent", "retrospective", "none"]),
  audience: z.string().min(3, "L'audience cible est requise"),
  duration: z.coerce.number().int().min(30, "Minimum 30 min").max(300, "Maximum 5h"),
  participants: z.coerce.number().int().min(1).max(50),
});

type FormSchema = z.infer<typeof formSchema>;

interface ModeratedFormProps {
  onSubmit: (values: ModeratedFormValues) => void;
  isLoading: boolean;
}

const PLATFORM_OPTIONS = [
  { value: "web" as const, label: "Web", desc: "Navigateur desktop ou mobile" },
  { value: "mobile" as const, label: "Mobile", desc: "Application native iOS / Android" },
  { value: "desktop" as const, label: "Desktop", desc: "Application locale (Mac, Windows)" },
];

const FIDELITY_OPTIONS = [
  { value: "live_product" as const, label: "Produit live", desc: "Version en production, fonctionnelle" },
  { value: "prototype_hifi" as const, label: "Prototype hi-fi", desc: "Figma, InVision — interactions simulées" },
  { value: "prototype_lowfi" as const, label: "Prototype lo-fi", desc: "Maquette papier ou wireframe basique" },
];

const THINK_ALOUD_OPTIONS = [
  {
    value: "concurrent" as const,
    label: "Concurrent",
    desc: "Le participant pense à voix haute pendant qu'il exécute les tâches.",
  },
  {
    value: "retrospective" as const,
    label: "Rétrospectif",
    desc: "Le participant commente après chaque tâche, en relisant son enregistrement.",
  },
  {
    value: "none" as const,
    label: "Aucun",
    desc: "Observation silencieuse — questions réservées au debrief.",
  },
];

function ButtonGroup<T extends string>({
  field,
  options,
  cols = 3,
}: {
  field: { value: T; onChange: (v: T) => void };
  options: { value: T; label: string; desc: string }[];
  cols?: number;
}) {
  return (
    <div className={`grid grid-cols-${cols} gap-2`}>
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

export function ModeratedForm({ onSubmit, isLoading }: ModeratedFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema) as Resolver<FormSchema>,
    defaultValues: {
      objective: "",
      product_name: "",
      platform: "web",
      fidelity: "live_product",
      think_aloud: "concurrent",
      audience: "",
      duration: 60,
      participants: 5,
    },
  });

  function handleSubmit(values: FormSchema) {
    onSubmit({ ...values, studyType: "moderated_usability" });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

        {/* Objectif */}
        <FormField
          control={form.control}
          name="objective"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objectif de recherche</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Ex : Évaluer la facilité d'onboarding de nouveaux utilisateurs sur l'application mobile. Identifier les frictions lors de la première commande.`}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Ce que vous cherchez à apprendre — pas les tâches à faire tester.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nom du produit */}
        <FormField
          control={form.control}
          name="product_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produit testé</FormLabel>
              <FormControl>
                <Input placeholder="Ex : Alma Pay, Dashboard Admin v2, App mobile Decathlon" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Plateforme */}
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plateforme</FormLabel>
              <ButtonGroup field={field} options={PLATFORM_OPTIONS} cols={3} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Fidélité */}
        <FormField
          control={form.control}
          name="fidelity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Support de test</FormLabel>
              <ButtonGroup field={field} options={FIDELITY_OPTIONS} cols={3} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Think-aloud */}
        <FormField
          control={form.control}
          name="think_aloud"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verbalisation</FormLabel>
              <ButtonGroup field={field} options={THINK_ALOUD_OPTIONS} cols={3} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Audience */}
        <FormField
          control={form.control}
          name="audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profil des participants</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex : Acheteurs en ligne 25–45 ans, nouveaux inscrits depuis moins de 30 jours"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée (min)</FormLabel>
                <FormControl>
                  <Input type="number" min={30} max={300} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="participants"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Participants prévus</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={50} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Génération du protocole…" : "Générer le protocole de test"}
        </Button>
      </form>
    </Form>
  );
}
