import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
// import { VertexAI } from '@google-cloud/vertexai'; // Désactivé temporairement - utilisation de données en dur

// Configuration Vertex AI - sera utilisée plus tard
// const vertex_ai = new VertexAI({
//   project: 'serious-mariner-425213-a1',
//   location: 'us-central1',
// });

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { answers, submissionData } = await request.json();
    
    if (!answers || !Array.isArray(answers)) {
      return json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Format answers for the prompt
    const formattedAnswers: any = {};
    answers.forEach((answer: any) => {
      formattedAnswers[answer.question_id] = {
        question_id: answer.question_id,
        question_text: answer.question?.text || '',
        question_type: answer.question?.type || '',
        answer: answer.value,
        section_id: answer.question?.section_id || null,
        parent_id: answer.question?.parent_id || null,
        is_required: answer.question?.is_required || false
      };
    });

    const submissionJson = {
      submission_id: submissionData?.id || '',
      secure_key: submissionData?.secure_key || '',
      submitted_at: new Date().toISOString(),
      answers_count: answers.length,
      answers: formattedAnswers
    };

    // Create the prompt for medical recommendations
    const prompt = `Vous êtes un expert en santé et activité physique, chargé de générer une prescription personnalisée basée sur les réponses d'un patient à un questionnaire médical. Utilisez les données fournies dans le JSON ci-dessous pour analyser l'état de santé, l'activité physique actuelle, les motivations, et les objectifs du patient. Fournissez une réponse structurée en français avec un ton empathique et professionnel, en utilisant des emojis pour les sections. Adaptez les recommandations aux pathologies, activités, et motivations du patient.

### Données du Patient (JSON de soumission) :
${JSON.stringify(submissionJson, null, 2)}

### Instructions :
- Analysez les réponses pour personnaliser la sortie.
- Traitez les valeurs de "textarea" comme des chaînes de caractères, mais interprétez les nombres comme des entiers si possible pour des calculs ou comparaisons.
- Fournissez une sortie structurée en format JSON selon le schéma ci-dessous.
- IMPORTANT: Répondez UNIQUEMENT avec le JSON structuré, sans texte avant ou après.

### Schéma de Sortie Structurée (JSON) :
{
  "conseils": [
    "Liste de 10 conseils pratiques personnalisés avec emojis"
  ],
  "objectifs": [
    "Liste de 5 objectifs personnalisés pour le patient"
  ],
  "benefices": [
    "Liste des bénéfices attendus personnalisés"
  ],
  "programme_perso": {
    "endurance": "Détails sur l'endurance",
    "renforcement": "Détails sur le renforcement musculaire",
    "etirements": "Détails sur les étirements",
    "equilibre": "Détails sur l'équilibre si applicable"
  },
  "planification": "Exemple de planning hebdomadaire (max 5 séances)",
  "orientation": [
    "Suggestions d'orientation vers professionnels ou structures"
  ],
  "disclaimer": "🩺 Ces conseils ne remplacent pas un avis médical. Ils doivent être validés par un professionnel de santé."
}`;

    const req = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    // Simulation de la réponse IA - Données en dur pour la démo
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simuler un délai
    
    let fullResponse = JSON.stringify({
      conseils: [
        "💪 Commencer par 30 minutes de marche rapide 3 fois par semaine",
        "🏊 Privilégier la natation pour renforcer sans impact",
        "🧘 15 minutes d'étirements quotidiens",
        "🥗 Alimentation équilibrée riche en protéines",
        "💧 Hydratation : 2-3 litres par jour"
      ],
      objectifs: [
        "Améliorer l'endurance cardiovasculaire",
        "Renforcer la masse musculaire",
        "Réduire les douleurs lombaires"
      ],
      benefices: [
        "Réduction du risque cardiovasculaire",
        "Amélioration de la qualité du sommeil",
        "Meilleur contrôle du poids"
      ],
      programme_perso: {
        endurance: "30 min de marche x3/semaine",
        renforcement: "Circuit training 2x/semaine",
        etirements: "15 min quotidiens",
        equilibre: "Exercices proprioceptifs 2x/semaine"
      },
      planification: "Lundi: Marche | Mardi: Renforcement | Mercredi: Repos | Jeudi: Natation | Vendredi: Marche",
      orientation: ["Kinésithérapeute", "Éducateur APA"],
      disclaimer: "🩺 Ces conseils ne remplacent pas un avis médical."
    });
    
    // Parse the JSON response
    let recommendations;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = fullResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.log('Raw response:', fullResponse);
      
      // Return default recommendations if parsing fails
      recommendations = {
        conseils: [
          "💪 Maintenir une activité physique régulière adaptée à votre condition",
          "🥗 Adopter une alimentation équilibrée et variée", 
          "💧 Bien s'hydrater avant, pendant et après l'effort",
          "😴 Respecter des temps de récupération suffisants",
          "📈 Augmenter progressivement l'intensité des exercices",
          "🧘 Intégrer des exercices de relaxation et d'étirement",
          "📊 Suivre régulièrement vos progrès et ajuster si nécessaire",
          "👥 Privilégier les activités en groupe pour la motivation",
          "🏥 Consulter régulièrement votre médecin traitant",
          "📝 Tenir un journal de vos activités physiques"
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

    return json({
      success: true,
      data: recommendations,
      raw_response: fullResponse
    });

  } catch (error) {
    console.error('Vertex AI Error:', error);
    
    // Return default recommendations on error
    return json({
      success: true,
      data: {
        conseils: [
          "💪 Maintenir une activité physique régulière adaptée à votre condition",
          "🥗 Adopter une alimentation équilibrée et variée",
          "💧 Bien s'hydrater avant, pendant et après l'effort",
          "😴 Respecter des temps de récupération suffisants",
          "📈 Augmenter progressivement l'intensité des exercices",
          "🧘 Intégrer des exercices de relaxation et d'étirement",
          "📊 Suivre régulièrement vos progrès et ajuster si nécessaire",
          "👥 Privilégier les activités en groupe pour la motivation",
          "🏥 Consulter régulièrement votre médecin traitant",
          "📝 Tenir un journal de vos activités physiques"
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
      },
      raw_response: "Using default recommendations due to API error: " + (error instanceof Error ? error.message : 'Unknown error')
    });
  }
};