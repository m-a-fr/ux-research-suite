"use client";

import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExploratoryFormValues } from "@/lib/types/exploratory";
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
  interview_style: z.enum(["semi_directive", "non_directive"]),
  themes: z.string().min(5, "Décrivez au moins un thème à explorer"),
  hypotheses: z.string().default(""),
  sensitive_topics: z.string().default(""),
  audience: z.string().min(3, "L'audience cible est requise"),
  duration: z.coerce.number().int().min(30, "Minimum 30 min").max(240, "Maximum 4h"),
  participants: z.coerce.number().int().min(1).max(50),
});

type FormSchema = z.infer<typeof formSchema>;

interface ExploratoryFormProps {
  onSubmit: (values: ExploratoryFormValues) => void;
  isLoading: boolean;
}

const STYLE_OPTIONS = [
  {
    value: "semi_directive" as const,
    label: "Semi-directif",
    desc: "Guide structuré avec questions préparées et relances. Recommandé pour la plupart des contextes.",
  },
  {
    value: "non_directive" as const,
    label: "Non-directif",
    desc: "Structure souple, récit libre du participant. À privilégier pour l'exploration ouverte de vécus.",
  },
];

export function ExploratoryForm({ onSubmit, isLoading }: ExploratoryFormProps) {
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema) as Resolver<FormSchema>,
    defaultValues: {
      interview_style: "semi_directive",
      themes: "",
      hypotheses: "",
      sensitive_topics: "",
      audience: "",
      duration: 60,
      participants: 6,
    },
  });

  function handleSubmit(values: FormSchema) {
    onSubmit({ ...values, studyType: "exploratory_interview" });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

        {/* Style d'entretien */}
        <FormField
          control={form.control}
          name="interview_style"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Style d&apos;entretien</FormLabel>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {STYLE_OPTIONS.map((opt) => {
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Thèmes */}
        <FormField
          control={form.control}
          name="themes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thèmes à explorer</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Ex :\n- Rapport à l'argent et aux dépenses du quotidien\n- Habitudes d'achat en ligne et déclencheurs\n- Frictions ressenties lors du paiement`}
                  rows={4}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Listez les axes thématiques à aborder — pas des questions, juste les sujets.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hypothèses */}
        <FormField
          control={form.control}
          name="hypotheses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Hypothèses de départ{" "}
                <span className="font-normal text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={`Ex : On pense que les utilisateurs abandonnent à l'étape paiement par manque de confiance. On suppose que les 30–45 ans préfèrent PayPal à la CB.`}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Ce que vous croyez déjà savoir — Claude construira le guide pour les tester sans orienter les participants.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sujets sensibles */}
        <FormField
          control={form.control}
          name="sensitive_topics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Sujets sensibles{" "}
                <span className="font-normal text-muted-foreground">(optionnel)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ex : Questions sur les revenus, situations de dette, difficultés relationnelles avec l'argent."
                  rows={2}
                  {...field}
                />
              </FormControl>
              <p className="text-xs text-muted-foreground mt-1">
                Ces thèmes seront signalés dans le guide pour préparer le chercheur à les aborder avec précaution.
              </p>
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
                  placeholder="Ex : Adultes 25–45 ans, acheteurs en ligne réguliers, France métropolitaine"
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
                  <Input type="number" min={30} max={240} {...field} />
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
          {isLoading ? "Génération du guide…" : "Générer le guide d'entretien"}
        </Button>
      </form>
    </Form>
  );
}
