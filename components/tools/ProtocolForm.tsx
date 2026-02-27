"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ProtocolFormValues, StudyType } from "@/lib/types/protocol";
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

const OBJECTIVE_TIPS = [
  {
    icon: "🎯",
    title: "Objectif principal",
    desc: "Quelle décision ou question centrale cette étude doit-elle résoudre ?",
    example: "Ex : Comprendre pourquoi les utilisateurs abandonnent le tunnel d'achat.",
  },
  {
    icon: "🔍",
    title: "Sous-objectifs",
    desc: "2 à 3 questions spécifiques auxquelles l'étude doit répondre.",
    example:
      "Ex : Identifier les frictions à l'étape paiement. Évaluer la clarté des options de livraison.",
  },
  {
    icon: "📦",
    title: "Contexte produit",
    desc: "Produit concerné, phase (discovery, validation, post-lancement) et enjeu business.",
    example:
      "Ex : App mobile e-commerce v2, phase post-lancement, objectif réduction du taux d'abandon.",
  },
  {
    icon: "⚠️",
    title: "Contraintes",
    desc: "Limites à respecter : temps, budget, accès aux participants, outils imposés, contraintes légales.",
    example:
      "Ex : Pas d'accès direct aux clients, outil Maze imposé, RGPD à respecter.",
  },
  {
    icon: "📐",
    title: "Structure attendue",
    desc: "Méthodologie, livrables ou format de restitution déjà définis.",
    example:
      "Ex : Rapport synthèse + présentation stakeholders, format UX review interne.",
  },
];

function ObjectiveTips() {
  return (
    <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs space-y-3">
      <p className="font-medium text-blue-800 text-xs">
        Plus votre objectif est riche, plus le protocole sera précis. Pensez à inclure :
      </p>
      <div className="space-y-2.5">
        {OBJECTIVE_TIPS.map((tip) => (
          <div key={tip.title}>
            <p className="font-semibold text-blue-900">
              {tip.icon} {tip.title}
            </p>
            <p className="text-blue-700 mt-0.5">{tip.desc}</p>
            <p className="text-blue-500 italic mt-0.5">{tip.example}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const formSchema = z.object({
  objective: z.string().min(10, "L'objectif doit faire au moins 10 caractères"),
  audience: z.string().min(3, "L'audience cible est requise"),
  duration: z.coerce.number().int().min(15, "Minimum 15 minutes").max(480, "Maximum 480 minutes"),
  participants: z.coerce.number().int().min(1, "Minimum 1 participant").max(500, "Maximum 500"),
});

type FormSchema = z.infer<typeof formSchema>;

interface ProtocolFormProps {
  studyType: Exclude<StudyType, "exploratory_interview">;
  onSubmit: (values: ProtocolFormValues) => void;
  isLoading: boolean;
}

export function ProtocolForm({ studyType, onSubmit, isLoading }: ProtocolFormProps) {
  const [showTips, setShowTips] = useState(false);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema) as Resolver<FormSchema>,
    defaultValues: {
      objective: "",
      audience: "",
      duration: 60,
      participants: 5,
    },
  });

  function handleSubmit(values: FormSchema) {
    onSubmit({ ...values, studyType } as ProtocolFormValues);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="objective"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Objectif de recherche</FormLabel>
                <button
                  type="button"
                  onClick={() => setShowTips((v) => !v)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <span className="text-sm">💡</span>
                  {showTips ? "Masquer le guide" : "Comment bien rédiger ?"}
                </button>
              </div>
              {showTips && <ObjectiveTips />}
              <FormControl>
                <Textarea
                  placeholder="Ex : Comprendre comment les utilisateurs trouvent un produit dans la catégorie et l'ajoutent au panier…"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="audience"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Audience cible</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex : Acheteurs en ligne, 25-45 ans, familiers avec le e-commerce"
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
                <FormLabel>Durée (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min={15} max={480} {...field} />
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
                <FormLabel>Participants</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={500} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Génération en cours…" : "Générer le protocole"}
        </Button>
      </form>
    </Form>
  );
}
