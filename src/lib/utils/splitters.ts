// src/lib/utils/splitters.ts
import type {
  AIRecommendationResponse,
  ProgrammeBlock,
  ProgrammeVM,
  PlanifRow,
  PrescriptionVM,
  ConseilsVM,
} from '$lib/types/ai';

// Parse un bloc multi-ligne en 5 lignes labellisées
export function parseProgrammeBlock(text: string): ProgrammeBlock {
  const out: ProgrammeBlock = {};
  if (!text) return out;

  const norm = text
    .split('\n')
    .map((l) => l.trim().replace(/^[•\-–—]\s?/, ''));

  const get = (label: string) =>
    norm
      .find((l) => l.toLowerCase().startsWith(label.toLowerCase()))
      ?.split(':')
      .slice(1)
      .join(':')
      .trim();

  out.frequence = get('Fréquence');
  out.intensite = get('Intensité');
  out.temps = get('Temps');
  out.type = get('Type');
  out.exemples = get('Exemples guidés') ?? get('Exemples');
  return out;
}

// Parse le tableau texte "Jour | Séance | Durée | Détails"
export function parsePlanificationTable(planif: string): PlanifRow[] {
  if (!planif) return [];
  const lines = planif.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const startIdx = lines[0].toLowerCase().includes('jour |') ? 1 : 0;
  const rows: PlanifRow[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const cells = lines[i].split('|').map((c) => c.trim());
    if (cells.length < 4) continue;
    const [jour, seance, duree, details] = cells;
    rows.push({ jour, seance, duree, details });
  }
  return rows;
}

// Split principal (API → 2 VMs prêtes à afficher)
export function splitRecommendation(data: AIRecommendationResponse): {
  prescription: PrescriptionVM;
  conseils: ConseilsVM;
} {
  const programme: ProgrammeVM = {
    endurance: parseProgrammeBlock(data.programme_perso?.endurance ?? ''),
    renforcement: parseProgrammeBlock(data.programme_perso?.renforcement ?? ''),
    etirements: parseProgrammeBlock(data.programme_perso?.etirements ?? ''),
    equilibre: parseProgrammeBlock(data.programme_perso?.equilibre ?? '')
  };

  const planification = parsePlanificationTable(data.planification);

  const prescription: PrescriptionVM = {
    programme,
    planification,
    objectifs: data.objectifs ?? [],
    contraindications: data.contraindications ?? [],
    precautions: data.precautions ?? undefined,
    orientation: data.orientation ?? []
  };

  const conseils: ConseilsVM = {
    conseils: data.conseils ?? [],
    benefices: data.benefices ?? []
  };

  return { prescription, conseils };
}