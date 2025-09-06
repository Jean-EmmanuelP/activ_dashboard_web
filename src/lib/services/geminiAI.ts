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

export async function generateRecommendations(answers: any[]): Promise<AIRecommendation> {
	console.log('📡 Frontend: Calling backend API with', answers.length, 'answers');
	try {
		// Call the backend API endpoint
		const response = await fetch('/api/generate-recommendations', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ answers }),
		});

		console.log('📡 Frontend: Response status:', response.status);
		
		if (!response.ok) {
			const errorText = await response.text();
			console.error('📡 Frontend: API error response:', errorText);
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();
		console.log('📡 Frontend: Received AI recommendations');
		return data as AIRecommendation;
	} catch (error) {
		console.error('📡 Frontend: Error calling AI API:', error);
		console.log('📡 Frontend: Using default recommendations');
		return getDefaultRecommendations();
	}
}

function getDefaultRecommendations(): AIRecommendation {
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
			endurance: "3 séances de 30-45 minutes par semaine d'activité aérobie modérée (marche rapide, natation, vélo). Commencer par 20 minutes et augmenter progressivement.",
			renforcement: "2 séances de 20-30 minutes ciblant tous les groupes musculaires majeurs. Utiliser le poids du corps ou des élastiques.",
			etirements: "10-15 minutes d'étirements après chaque séance, focus sur la souplesse générale. Tenir chaque position 20-30 secondes.",
			equilibre: "Exercices d'équilibre 2 fois par semaine : tenir sur une jambe, marche talon-pointe, exercices sur surface instable."
		},
		planification: "Lundi: Cardio léger 30min (marche/natation) | Mardi: Repos actif (étirements) | Mercredi: Renforcement musculaire 30min | Jeudi: Repos | Vendredi: Activité mixte cardio + renfo 45min | Samedi: Activité récréative au choix | Dimanche: Repos ou activité douce",
		orientation: [
			"Consultation avec un kinésithérapeute pour l'évaluation initiale et programme personnalisé",
			"Suivi médical régulier tous les 3 mois pour ajuster le programme",
			"Possibilité de rejoindre un club sportif ou association sportive adaptée",
			"Éducateur sportif spécialisé en activité physique adaptée si besoin",
			"Nutritionniste pour adapter l'alimentation aux objectifs"
		],
		disclaimer: "🩺 Ces conseils ne remplacent pas un avis médical. Ils doivent être validés par un professionnel de santé avant application."
	};
}