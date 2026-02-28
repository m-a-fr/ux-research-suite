"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export interface BriefContext {
  business_context: string;
  restitution_date?: string;
  stakeholders?: string;
}

interface Props {
  onSubmit: (context: BriefContext) => void;
  onCancel: () => void;
}

export function BriefContextForm({ onSubmit, onCancel }: Props) {
  const [businessContext, setBusinessContext] = useState("");
  const [restitutionDate, setRestitutionDate] = useState("");
  const [stakeholders, setStakeholders] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessContext.trim()) return;
    onSubmit({
      business_context: businessContext.trim(),
      restitution_date: restitutionDate || undefined,
      stakeholders: stakeholders.trim() || undefined,
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Contexte du brief</CardTitle>
        <CardDescription className="text-sm">
          Ces informations permettront à Claude de générer un brief ancré dans votre contexte réel,
          et non des formulations génériques.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="business_context">
              Contexte &amp; enjeu business{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="business_context"
              placeholder="Ex : Nous envisageons de refondre notre tunnel de commande avant le lancement Q3. Cette étude doit valider nos hypothèses de design et permettre une décision go/no-go avant le 15 mars."
              rows={3}
              value={businessContext}
              onChange={(e) => setBusinessContext(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="restitution_date">Date de restitution</Label>
              <Input
                id="restitution_date"
                type="date"
                value={restitutionDate}
                onChange={(e) => setRestitutionDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stakeholders">Destinataires</Label>
              <Input
                id="stakeholders"
                placeholder="Ex : Direction Produit, Marketing"
                value={stakeholders}
                onChange={(e) => setStakeholders(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={!businessContext.trim()}>
              Générer le brief
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
