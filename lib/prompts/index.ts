import { StudyType } from "@/lib/types/protocol";
import { moderatedUsabilityPrompt } from "./moderated_usability";
import { exploratoryInterviewPrompt } from "./exploratory_interview";
import { unmoderatedUsabilityPrompt } from "./unmoderated_usability";
import { surveyPrompt } from "./survey";
import { diaryStudyPrompt } from "./diary_study";

const JSON_SCHEMA_REMINDER = `

Schéma JSON attendu :
{
  "study_type": string,
  "title": string,
  "duration_minutes": number,
  "sections": [{
    "type": "intro|warmup|tasks|debrief",
    "title": string,
    "duration_minutes": number,
    "script": string,
    "questions": [{ "text": string, "modality": string, "options": [string] }],
    "tips": string
  }],
  "tasks": [{
    "task": string,
    "scenario": string,
    "success_criteria": string,
    "behavioral_metrics": [string],
    "declarative_metrics": [{ "text": string, "modality": string, "options": [string] }]
  }],
  "observer_guide": string,
  "consent_note": string,
  "materials_needed": [string]
}

Règles importantes :
- "questions[].text" : texte complet de la question.
- "questions[].modality" : modalité de réponse claire et concise. Exemples : "Réponse libre", "Échelle de 1 à 7 (1 = très difficile, 7 = très facile) — SEQ", "QCM — choix unique", "QCM — choix multiple", "Note de 0 à 10 — NPS", "Oui / Non", "Évaluation de 1 à 5 étoiles".
- "questions[].options" : OBLIGATOIRE pour toute question de type QCM (choix unique ou multiple). Tableau des options de réponse telles qu'elles apparaîtront au participant. Laisser [] pour les autres types (Réponse libre, échelles, Oui/Non, NPS).
- "declarative_metrics" : questions post-tâche auto-reportées (SEQ, CSAT, NPS, verbatims). Même format { text, modality, options }.
- "behavioral_metrics" : métriques collectées automatiquement par l'outil (taux de complétion, temps sur tâche, clics, erreurs). Tableau de strings simples.
- "success_criteria" : critère global de réussite de la tâche (une phrase synthétique).`;

export function getSystemPrompt(studyType: StudyType): string {
  const promptMap: Record<StudyType, string> = {
    moderated_usability: moderatedUsabilityPrompt,
    exploratory_interview: exploratoryInterviewPrompt,
    unmoderated_usability: unmoderatedUsabilityPrompt,
    survey: surveyPrompt,
    diary_study: diaryStudyPrompt,
  };

  return promptMap[studyType] + JSON_SCHEMA_REMINDER;
}
