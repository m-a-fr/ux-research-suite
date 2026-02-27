"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  SurveyFormValues,
  SurveyDimension,
  SurveyStandardScale,
  SurveyDistributionChannel,
  SurveyTargetDuration,
} from "@/lib/types/survey";
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

// ─── Options ──────────────────────────────────────────────────────────────

const DIMENSION_OPTIONS: { value: SurveyDimension; label: string; desc: string }[] = [
  { value: "satisfaction", label: "Satisfaction produit", desc: "CSAT, sentiment global" },
  { value: "nps", label: "Net Promoter Score", desc: "Probabilité de recommandation" },
  { value: "usability", label: "Usabilité perçue", desc: "SUS, UMUX, facilité d'usage" },
  { value: "awareness", label: "Notoriété / perception", desc: "Image de marque, connaissance" },
  { value: "friction", label: "Points de friction", desc: "Blocages, irritants, abandons" },
  { value: "other", label: "Autre", desc: "Défini dans les questions de recherche" },
];

const SCALE_OPTIONS: { value: SurveyStandardScale; label: string; desc: string }[] = [
  { value: "NPS", label: "NPS", desc: "Net Promoter Score — échelle 0–10" },
  { value: "SUS", label: "SUS", desc: "System Usability Scale — 10 items Likert 1–5" },
  { value: "UMUX", label: "UMUX", desc: "Usability Metric for UX — 4 items Likert 1–7" },
  { value: "CSAT", label: "CSAT", desc: "Customer Satisfaction — échelle 1–5" },
  { value: "none", label: "Aucune échelle normée", desc: "Questions personnalisées uniquement" },
];

const DURATION_OPTIONS: { value: SurveyTargetDuration; label: string; hint: string }[] = [
  { value: "under_5", label: "< 5 min", hint: "~8–10 questions fermées" },
  { value: "5_to_10", label: "5–10 min", hint: "~15–25 questions" },
  { value: "10_to_15", label: "10–15 min", hint: "~25–40 questions" },
];

const CHANNEL_OPTIONS: { value: SurveyDistributionChannel; label: string }[] = [
  { value: "email", label: "Email (lien dans un email)" },
  { value: "in_app", label: "In-app (popup ou overlay)" },
  { value: "qr_intercept", label: "QR code / intercept présentiel" },
  { value: "external_panel", label: "Panel externe (Prolific, UserTesting…)" },
];

// ─── Schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
  research_questions: z.string().min(10, "Décrivez les questions auxquelles le sondage doit répondre"),
  dimensions: z
    .array(z.enum(["satisfaction", "nps", "usability", "awareness", "friction", "other"]))
    .min(1, "Sélectionnez au moins une dimension"),
  standard_scales: z
    .array(z.enum(["NPS", "SUS", "UMUX", "CSAT", "none"]))
    .default([]),
  needs_screening: z.boolean().default(false),
  screening_criteria: z.string().default(""),
  target_duration: z.enum(["under_5", "5_to_10", "10_to_15"]),
  distribution_channel: z.enum(["email", "in_app", "qr_intercept", "external_panel"]),
  audience: z.string().min(3, "L'audience cible est requise"),
});

type FormSchema = z.infer<typeof formSchema>;

interface SurveyFormProps {
  onSubmit: (values: SurveyFormValues) => void;
  isLoading: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────

export function SurveyForm({ onSubmit, isLoading }: SurveyFormProps) {
  const [showScreening, setShowScreening] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema) as Resolver<FormSchema>,
    defaultValues: {
      research_questions: "",
      dimensions: [],
      standard_scales: [],
      needs_screening: false,
      screening_criteria: "",
      target_duration: "5_to_10",
      distribution_channel: "email",
      audience: "",
    },
  });

  function handleSubmit(values: FormSchema) {
    onSubmit({ ...values, studyType: "survey" } as SurveyFormValues);
  }

  function toggleDimension(
    current: SurveyDimension[],
    value: SurveyDimension,
    onChange: (v: SurveyDimension[]) => void
  ) {
    onChange(
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    );
  }

  function toggleScale(
    current: SurveyStandardScale[],
    value: SurveyStandardScale,
    onChange: (v: SurveyStandardScale[]) => void
  ) {
    onChange(
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        {/* Questions de recherche */}
        <FormField
          control={form.control}
          name="research_questions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Questions de recherche</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Ex :\n- Quel est le niveau de satisfaction global des utilisateurs avec notre onboarding ?\n- Quels sont les points de friction principaux dans le parcours de paiement ?\n- Quelle est la probabilité de recommandation (NPS) de notre produit ?`}
                  rows={4}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Les hypothèses et questions auxquelles ce sondage doit répondre.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Dimensions */}
        <FormField
          control={form.control}
          name="dimensions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dimensions à mesurer</FormLabel>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {DIMENSION_OPTIONS.map((opt) => {
                  const checked = field.value.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleDimension(field.value, opt.value, field.onChange)}
                      className={`rounded-lg border p-2.5 text-left transition-colors ${
                        checked
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className={`text-sm font-medium ${checked ? "text-primary" : "text-foreground"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Échelles normées */}
        <FormField
          control={form.control}
          name="standard_scales"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Échelles normées{" "}
                <span className="font-normal text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <div className="flex flex-wrap gap-2 mt-1">
                {SCALE_OPTIONS.map((opt) => {
                  const checked = field.value.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleScale(field.value, opt.value, field.onChange)}
                      className={`rounded-md border px-3 py-1.5 text-left transition-colors ${
                        checked
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className={`text-sm font-medium ${checked ? "text-primary" : "text-foreground"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Screening */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>Questions de screening</FormLabel>
            <button
              type="button"
              onClick={() => {
                const next = !showScreening;
                setShowScreening(next);
                form.setValue("needs_screening", next);
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                showScreening ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                  showScreening ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {showScreening && (
            <FormField
              control={form.control}
              name="screening_criteria"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Ex : Avoir acheté en ligne au moins une fois dans les 3 derniers mois. Être âgé de 18 ans ou plus. Résider en France."
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Critères de qualification — les répondants qui ne les remplissent pas seront exclus.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Durée cible */}
        <FormField
          control={form.control}
          name="target_duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Durée cible de complétion</FormLabel>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {DURATION_OPTIONS.map((opt) => {
                  const selected = field.value === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`rounded-lg border p-2.5 text-center transition-colors ${
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${selected ? "text-primary" : "text-foreground"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.hint}</p>
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Canal de distribution */}
        <FormField
          control={form.control}
          name="distribution_channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canal de distribution</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <FormLabel>Profil des répondants</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex : Clients actifs, 18–55 ans, ayant utilisé le produit au moins une fois"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Génération du questionnaire…" : "Générer le sondage"}
        </Button>
      </form>
    </Form>
  );
}
