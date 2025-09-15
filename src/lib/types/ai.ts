// src/lib/types/ai.ts
export interface ProgrammePersonnalise {
  endurance: string;
  renforcement: string;
  etirements: string;
  equilibre: string;
}

export interface AIRecommendationResponse {
  conseils: string[];
  objectifs: string[];
  benefices: string[];
  programme_perso: ProgrammePersonnalise;
  planification: string;       // "Jour | Séance | Durée | Détails\n..."
  orientation: string[];
  contraindications: string[];
  medicaments?: string[];
  precautions?: string[];
}

// ===== View Models (frontend) =====
export type ProgrammeBlock = {
  frequence?: string;
  intensite?: string;
  temps?: string;
  type?: string;
  exemples?: string;
};

export type ProgrammeVM = {
  endurance: ProgrammeBlock;
  renforcement: ProgrammeBlock;
  etirements: ProgrammeBlock;
  equilibre: ProgrammeBlock;
};

export type PlanifRow = { jour: string; seance: string; duree: string; details: string };

export type PrescriptionVM = {
  programme: ProgrammeVM;
  planification: PlanifRow[];
  objectifs: string[];
  contraindications: string[];
  precautions?: string[];
  orientation: string[];
};

export type ConseilsVM = {
  conseils: string[];
  benefices: string[];
};