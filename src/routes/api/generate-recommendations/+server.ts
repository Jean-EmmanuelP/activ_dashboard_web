import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { GoogleGenAI } from '@google/genai';

// Initialize Vertex with your Cloud project and location
const ai = new GoogleGenAI({
	vertexai: true,
	project: 'serious-mariner-425213-a1',
	location: 'global'
});

const model = 'gemini-2.5-flash-lite';

// Set up generation config
const generationConfig = {
	maxOutputTokens: 65535,
	temperature: 1,
	topP: 0.95,
	safetySettings: [
		{
			category: 'HARM_CATEGORY_HATE_SPEECH',
			threshold: 'OFF',
		},
		{
			category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
			threshold: 'OFF',
		},
		{
			category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
			threshold: 'OFF',
		},
		{
			category: 'HARM_CATEGORY_HARASSMENT',
			threshold: 'OFF',
		}
	],
};

export const POST: RequestHandler = async ({ request }) => {
	console.log('🚀 API Endpoint called');
	console.log('📍 Environment check:');
	console.log('  - GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
	console.log('  - NODE_ENV:', process.env.NODE_ENV);
	
	try {
		const { answers } = await request.json();
		console.log(`📊 Received ${answers.length} answers`);
		
		// Format answers data
		const formattedAnswers: Record<string, any> = {};
		answers.forEach((answer: any) => {
			const question = answer.question;
			if (question) {
				formattedAnswers[question.id] = {
					question_id: question.id,
					question_text: question.text,
					question_type: question.type,
					answer: answer.value,
					section_id: question.section_id,
					parent_id: question.parent_id,
					is_required: question.is_required
				};
			}
		});

		const submissionData = {
			submission_id: crypto.randomUUID(),
			secure_key: crypto.randomUUID(),
			submitted_at: new Date().toISOString(),
			answers_count: answers.length,
			answers: formattedAnswers
		};

		const promptText = `Vous êtes un expert en santé et activité physique, chargé de générer une prescription personnalisée basée sur les réponses d'un patient à un questionnaire médical. Utilisez les données fournies dans le JSON ci-dessous pour analyser l'état de santé, l'activité physique actuelle, les motivations, et les objectifs du patient. Fournissez une réponse structurée en français avec un ton empathique et professionnel, en utilisant des emojis pour les sections. Adaptez les recommandations aux pathologies, activités, et motivations du patient.

### Données du Patient (JSON de soumission) :
${JSON.stringify(submissionData, null, 2)}

### Instructions :
- Analysez les réponses pour personnaliser la sortie.
- Ignorer les champs absents sauf si pertinents.
- Fournissez une sortie structurée selon le schéma JSON ci-dessous.

### Schéma de Sortie Structurée (JSON) :
{
  "conseils": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "Dix conseils pratiques personnalisés, avec emojis, basés sur les réponses du patient."
  },
  "objectifs": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "Cinq objectifs personnalisés pour le patient."
  },
  "benefices": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "Bénéfices attendus personnalisés."
  },
  "programme_perso": {
    "type": "object",
    "properties": {
      "endurance": {
        "type": "string",
        "description": "Détails sur l'endurance."
      },
      "renforcement": {
        "type": "string",
        "description": "Détails sur le renforcement musculaire."
      },
      "etirements": {
        "type": "string",
        "description": "Détails sur les étirements."
      },
      "equilibre": {
        "type": "string",
        "description": "Détails sur l'équilibre si applicable."
      }
    },
    "required": ["endurance", "renforcement", "etirements"],
    "description": "Programme personnalisé indicatif, adapté aux réponses."
  },
  "planification": {
    "type": "string",
    "description": "Exemple de planning hebdomadaire (max 5 séances)."
  },
  "orientation": {
    "type": "array",
    "items": {
      "type": "string"
    },
    "description": "Suggestions d'orientation vers professionnels ou structures."
  },
  "disclaimer": {
    "type": "string",
    "description": "Disclaimer final obligatoire : 🩺 Ces conseils ne remplacent pas un avis médical. Ils doivent être validés par un professionnel de santé."
  }
}`;

		const req = {
			model: model,
			contents: [{
				parts: [{
					text: promptText
				}]
			}],
			config: generationConfig,
		};

		console.log('🤖 Calling Vertex AI with model:', model);
		const streamingResp = await ai.models.generateContentStream(req);
		console.log('✅ Vertex AI stream started');
		let fullResponse = '';
		
		for await (const chunk of streamingResp) {
			if (chunk.text) {
				fullResponse += chunk.text;
			}
		}

		// Parse the response
		try {
			// Clean the response - remove markdown code blocks if present
			const cleanedResponse = fullResponse
				.replace(/```json\n?/g, '')
				.replace(/```\n?/g, '')
				.trim();
			
			// Find JSON in the response
			const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error('No valid JSON found in response');
			}
			
			const parsed = JSON.parse(jsonMatch[0]);
			
			// Ensure all required fields
			if (!parsed.disclaimer) {
				parsed.disclaimer = "🩺 Ces conseils ne remplacent pas un avis médical. Ils doivent être validés par un professionnel de santé avant application.";
			}
			
			console.log('✅ Successfully parsed AI response');
			return json(parsed);
		} catch (parseError) {
			console.error('Error parsing AI response:', parseError);
			console.log('Raw response:', fullResponse);
			
			// Return default recommendations
			return json(getDefaultRecommendations());
		}
	} catch (error) {
		console.error('❌ Error in API endpoint:', error);
		console.error('Error details:', {
			name: error.name,
			message: error.message,
			stack: error.stack
		});
		console.log('⚠️ Returning default recommendations');
		return json(getDefaultRecommendations(), { status: 500 });
	}
};

function getDefaultRecommendations() {
	return {
		conseils: [
			"🚶 Commencer par des activités douces comme la marche 30 min/jour",
			"💧 Maintenir une hydratation adéquate (1.5-2L d'eau par jour)",
			"📈 Augmenter progressivement l'intensité sur 4 semaines",
			"🔄 Maintenir une régularité dans la pratique (minimum 3x/semaine)",
			"🍎 Adapter l'alimentation à l'activité physique",
			"😴 Respecter les temps de récupération entre les séances",
			"📝 Tenir un journal de progression",
			"👥 Envisager des activités en groupe pour la motivation",
			"🎯 Se fixer des objectifs réalistes et progressifs",
			"🩺 Consulter régulièrement pour un suivi médical"
		],
		objectifs: [
			"Améliorer la condition cardiovasculaire en 3 mois",
			"Renforcer la masse musculaire de façon progressive",
			"Réduire le stress quotidien par l'activité physique",
			"Améliorer la qualité de sommeil",
			"Maintenir un poids santé sur le long terme"
		],
		benefices: [
			"Réduction du risque cardiovasculaire de 30%",
			"Amélioration de la qualité de sommeil",
			"Augmentation de l'énergie quotidienne",
			"Meilleure régulation de la glycémie",
			"Renforcement du système immunitaire",
			"Amélioration de l'humeur et réduction de l'anxiété",
			"Augmentation de la densité osseuse"
		],
		programme_perso: {
			endurance: "3 séances de 30-45 minutes par semaine d'activité aérobie modérée",
			renforcement: "2 séances de 20-30 minutes ciblant tous les groupes musculaires",
			etirements: "10-15 minutes d'étirements après chaque séance",
			equilibre: "Exercices d'équilibre 2 fois par semaine si nécessaire"
		},
		planification: "Lundi: Cardio léger 30min | Mercredi: Renforcement 30min | Vendredi: Activité mixte 45min | Weekend: Activité récréative",
		orientation: [
			"Consultation avec un kinésithérapeute pour programme personnalisé",
			"Suivi médical régulier tous les 3 mois",
			"Possibilité de rejoindre un club sportif adapté"
		],
		disclaimer: "🩺 Ces conseils ne remplacent pas un avis médical. Ils doivent être validés par un professionnel de santé avant application."
	};
}