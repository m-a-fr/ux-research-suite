import * as fs from "fs";
import * as path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { Protocol } from "@/lib/types/protocol";

const STUDY_TYPE_LABELS: Record<string, string> = {
  moderated_usability: "Test d'utilisabilité modéré",
  exploratory_interview: "Entretien exploratoire",
  unmoderated_usability: "Test d'utilisabilité non-modéré",
  survey: "Sondage / Survey",
  diary_study: "Diary Study",
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  intro: "Introduction",
  warmup: "Mise en chauffe",
  tasks: "Tâches",
  debrief: "Debriefing",
};

function formatDate(): string {
  return new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function buildDocxData(protocol: Protocol) {
  const sections = protocol.sections.map((section, sIdx) => {
    const questions = (section.questions ?? []).map((q, qIdx) => ({
      q_index: qIdx + 1,
      text: q.text,
      modality: q.modality ?? "",
      has_modality: Boolean(q.modality),
      options: (q.options ?? []).map((opt, oIdx) => ({
        option_letter: String.fromCharCode(65 + oIdx),
        text: opt,
      })),
    }));

    return {
      section_type_label: SECTION_TYPE_LABELS[section.type] ?? section.type,
      title: section.title,
      duration_minutes: section.duration_minutes,
      script: section.script ?? "",
      has_questions: questions.length > 0,
      questions,
      tips: section.tips ?? "",
      has_tips: Boolean(section.tips),
      // unused but safe to include
      _idx: sIdx,
    };
  });

  const tasks = (protocol.tasks ?? []).map((t, i) => ({
    task_index: i + 1,
    task: t.task,
    scenario: t.scenario,
    success_criteria: t.success_criteria,
  }));

  const materials_needed = (protocol.materials_needed ?? []).map((m) => ({
    text: m,
  }));

  return {
    title: protocol.title,
    study_type_label: STUDY_TYPE_LABELS[protocol.study_type] ?? protocol.study_type,
    duration_minutes: protocol.duration_minutes,
    date: formatDate(),
    sections,
    tasks,
    has_tasks: tasks.length > 0,
    observer_guide: protocol.observer_guide ?? "",
    has_observer_guide: Boolean(protocol.observer_guide),
    consent_note: protocol.consent_note ?? "",
    has_consent_note: Boolean(protocol.consent_note),
    materials_needed,
    has_materials: materials_needed.length > 0,
  };
}

export async function generateProtocolDocx(protocol: Protocol): Promise<Buffer> {
  const templatePath = path.join(
    process.cwd(),
    "lib",
    "templates",
    "protocol-template.docx"
  );

  const templateBinary = fs.readFileSync(templatePath, "binary");
  const zip = new PizZip(templateBinary);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  const data = buildDocxData(protocol);
  doc.render(data);

  const output = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
  return Buffer.from(output);
}
