export interface AIRecommendation {
  conseils: string[];
  objectifs: string[];
  benefices: string[];
  programme_perso: {
    endurance: string;
    renforcement: string;
    etirements: string;
    equilibre?: string;
  };
  planification: string;
  orientation: string[];
  disclaimer: string;
}

export async function generateRecommendations(
  answers: any[],
  submissionData?: any
): Promise<AIRecommendation> {
  try {
    const response = await fetch('/api/vertex-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers,
        submissionData
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || 'Failed to generate recommendations');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error calling Vertex AI:', error);
    
    // Return default recommendations if AI fails
    return {
      conseils: [
        "💪 Maintenir une activité physique régulière adaptée à votre condition",
        "🥗 Adopter une alimentation équilibrée et variée",
        "💧 Bien s'hydrater avant, pendant et après l'effort",
        "😴 Respecter des temps de récupération suffisants",
        "📈 Augmenter progressivement l'intensité des exercices"
      ],
      objectifs: [
        "Améliorer votre condition physique générale",
        "Développer votre endurance cardiovasculaire",
        "Renforcer votre masse musculaire",
        "Améliorer votre souplesse et mobilité",
        "Maintenir un poids santé"
      ],
      benefices: [
        "Amélioration de la santé cardiovasculaire",
        "Renforcement du système immunitaire",
        "Meilleure gestion du stress",
        "Amélioration de la qualité du sommeil",
        "Augmentation de l'énergie au quotidien"
      ],
      programme_perso: {
        endurance: "30 minutes d'activité cardiovasculaire modérée, 3-5 fois par semaine",
        renforcement: "2-3 séances de renforcement musculaire par semaine, ciblant tous les groupes musculaires",
        etirements: "10-15 minutes d'étirements après chaque séance, avec focus sur la souplesse",
        equilibre: "Exercices d'équilibre et de proprioception 2 fois par semaine"
      },
      planification: "Lundi: Endurance (30min) | Mercredi: Renforcement (45min) | Vendredi: Endurance (30min) | Weekend: Activité libre",
      orientation: [
        "Consultation avec un médecin du sport",
        "Évaluation par un kinésithérapeute si nécessaire",
        "Accompagnement par un éducateur sportif certifié"
      ],
      disclaimer: "🩺 Ces conseils ne remplacent pas un avis médical. Ils doivent être validés par un professionnel de santé."
    };
  }
}