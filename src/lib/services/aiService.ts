// src/lib/services/aiService.ts
import type { AIRecommendationResponse } from '$lib/types/ai';
import type { Submission, Answer, Question } from '$lib/supabase';

/**
 * Service pour interagir avec l'API d'IA - Version sécurisée avec proxy
 */
export class AIService {
	/**
	 * Génère des recommandations IA via le proxy SvelteKit sécurisé (recommandé pour la production)
	 */
	static async generateRecommendations(
		submission: Submission,
		answers: Answer[],
		questions: Question[],
		doctorInfo?: {
			nom: string;
			prenom: string;
			email: string;
			signature?: string;
		}
	): Promise<AIRecommendationResponse> {
		console.log('⚙️ AIService.generateRecommendations - Début de l\'appel API via proxy');
		
		try {
			// Préparer les données au format attendu par l'API
			const formattedAnswers: Record<string, any> = {};
			answers.forEach((answer) => {
				const question = questions.find(q => q.id === answer.question_id);
				if (question) {
					formattedAnswers[answer.question_id.toString()] = {
						question_id: answer.question_id,
						question_text: question.text,
						question_type: question.type,
						answer: answer.value,
						section_id: question.section_id,
						parent_id: question.parent_id,
						is_required: question.is_required
					};
				}
			});

			const requestData = {
				submission_id: submission.id,
				secure_key: submission.secure_key || crypto.randomUUID(),
				submitted_at: new Date().toISOString(),
				answers_count: answers.length,
				answers: formattedAnswers
			};

			console.log('🚀 === APPEL API ACTIV VIA PROXY ===');
			console.log('🎯 URL API: /api/ai-proxy');
			console.log('📤 Payload envoyé:', JSON.stringify(requestData, null, 2));
			console.log('📈 Nombre de réponses:', requestData.answers_count);

			// Appel via le proxy SvelteKit sécurisé
			const response = await fetch('/api/ai-proxy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestData)
			});

			console.log('📝 Réponse API status:', response.status, response.statusText);

			if (!response.ok) {
				throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			console.log('📊 Réponse API reçue:', result);

			// Vérifier si la réponse contient success/data ou est directement les données
			if (result.success !== undefined) {
				// Format avec success/data
				if (!result.success || !result.data) {
					throw new Error(result.error?.message || 'Erreur lors de la génération des recommandations');
				}
				console.log('✅ Succès - Format success/data détecté');
				return result.data as AIRecommendationResponse;
			} else {
				// Format direct des données
				console.log('✅ Succès - Format direct des données détecté');
				return result as AIRecommendationResponse;
			}

		} catch (error) {
			console.error('❌ === ERREUR API ACTIV ===');
			console.error('Erreur détaillée:', error);
			console.error('Type d\'erreur:', typeof error);
			if (error instanceof Error) {
				console.error('Message:', error.message);
				console.error('Stack:', error.stack);
			}
			throw error;
		}
	}

	/**
	 * Version d'appel direct (pour développement uniquement - expose le bearer token)
	 * ⚠️ À éviter en production
	 */
	static async generateRecommendationsDirect(
		submission: Submission,
		answers: Answer[],
		questions: Question[],
		doctorInfo?: {
			nom: string;
			prenom: string;
			email: string;
			signature?: string;
		}
	): Promise<AIRecommendationResponse> {
		const endpoint = 'https://activ-ai-536318065020.europe-west1.run.app';
		const bearer = 'sRxw1AAUcZ90zMp1JQE99XjorzkHyxjk_9K4Gf-hFGSU_Bs2dQVk4jkXTqZfG6eo';

		console.log('⚙️ AIService.generateRecommendationsDirect - ⚠️ MODE DÉVELOPPEMENT');
		
		try {
			// Préparer les données au format attendu par l'API
			const formattedAnswers: Record<string, any> = {};
			answers.forEach((answer) => {
				const question = questions.find(q => q.id === answer.question_id);
				if (question) {
					formattedAnswers[answer.question_id.toString()] = {
						question_id: answer.question_id,
						question_text: question.text,
						question_type: question.type,
						answer: answer.value,
						section_id: question.section_id,
						parent_id: question.parent_id,
						is_required: question.is_required
					};
				}
			});

			const requestData = {
				submission_id: submission.id,
				secure_key: submission.secure_key || crypto.randomUUID(),
				submitted_at: new Date().toISOString(),
				answers_count: answers.length,
				answers: formattedAnswers
			};

			console.log('🚀 === APPEL API ACTIV DIRECT ===');
			console.log('🎯 URL API:', `${endpoint}/submission`);
			console.log('🔑 Token:', bearer ? 'Token présent' : 'Token manquant');
			console.log('📤 Payload envoyé:', JSON.stringify(requestData, null, 2));

			const response = await fetch(`${endpoint}/submission`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${bearer}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(requestData)
			});

			console.log('📝 Réponse API status:', response.status, response.statusText);

			if (!response.ok) {
				throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
			}

			const result = await response.json();
			console.log('📊 Réponse API reçue:', result);

			// Vérifier si la réponse contient success/data ou est directement les données
			if (result.success !== undefined) {
				if (!result.success || !result.data) {
					throw new Error(result.error?.message || 'Erreur lors de la génération des recommandations');
				}
				return result.data as AIRecommendationResponse;
			} else {
				return result as AIRecommendationResponse;
			}

		} catch (error) {
			console.error('❌ === ERREUR API ACTIV DIRECT ===');
			console.error('Erreur détaillée:', error);
			throw error;
		}
	}
}