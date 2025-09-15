// src/lib/stores/reco.ts
import { writable, derived } from 'svelte/store';
import type { AIRecommendationResponse, PrescriptionVM, ConseilsVM } from '$lib/types/ai';
import { splitRecommendation } from '$lib/utils/splitters';

export const rawRecommendation = writable<AIRecommendationResponse | null>(null);
export const loading = writable(false);
export const errorMsg = writable<string | null>(null);

// VM dérivés pour les deux pages
export const prescriptionVM = derived(rawRecommendation, (r): PrescriptionVM | null => {
  if (!r) return null;
  return splitRecommendation(r).prescription;
});

export const conseilsVM = derived(rawRecommendation, (r): ConseilsVM | null => {
  if (!r) return null;
  return splitRecommendation(r).conseils;
});