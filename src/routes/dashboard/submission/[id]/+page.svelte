<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import type { Submission, Answer, Question, Section } from '$lib/supabase';
	import { onMount } from 'svelte';
	import QuestionItem from '$lib/components/QuestionItem.svelte';
	import PrescriptionMedicale from '$lib/components/PrescriptionMedicale.svelte';
	import PageConseilsAPA from '$lib/components/PageConseilsAPA.svelte';
	import { goto } from '$app/navigation';
	import { generateRecommendations, type AIRecommendation } from '$lib/services/vertexAI';
	
	let submission = $state<Submission | null>(null);
	let sections = $state<Section[]>([]);
	let questions = $state<Question[]>([]);
	let answers = $state<Answer[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let editMode = $state(true);
	let error = $state('');
	let showToast = $state(false);
	let toastMessage = $state('');
	let generatingAI = $state(false);
	let aiResponseData = $state<AIRecommendation | null>(null);
	let currentView = $state<'questionnaire' | 'prescription' | 'conseils'>('questionnaire');
	
	let localAnswers = new Map<number, string>();
	let hasChanges = $state(false);
	
	onMount(async () => {
		// Get view parameter from URL
		const urlParams = new URLSearchParams(window.location.search);
		const viewParam = urlParams.get('view');
		if (viewParam === 'prescription') {
			currentView = 'prescription';
		} else if (viewParam === 'conseils') {
			currentView = 'conseils';
		} else {
			currentView = 'questionnaire';
		}
		
		await loadData();
		
		// Listen for URL changes
		page.subscribe($page => {
			const view = $page.url.searchParams.get('view');
			if (view === 'prescription') {
				currentView = 'prescription';
			} else if (view === 'conseils') {
				currentView = 'conseils';
			} else {
				currentView = 'questionnaire';
			}
		});
	});
	
	async function loadData() {
		loading = true;
		try {
			const submissionId = $page.params.id;
			
			const { data: subData, error: subError } = await supabase
				.from('submissions')
				.select('*')
				.eq('id', submissionId)
				.single();
				
			if (subError || !subData) {
				throw new Error('Submission non trouvée');
			}
			
			submission = subData;
			
			const { data: sectionsData } = await supabase
				.from('sections')
				.select('*')
				.order('order_index');
			
			sections = sectionsData || [];
			
			const { data: questionsData } = await supabase
				.from('questions')
				.select('*')
				.order('section_id', { ascending: true, nullsFirst: true })
				.order('order_index', { ascending: true });
			
			questions = questionsData || [];
			
			const questionsWithoutSection = questions.filter(q => !q.section_id || q.section_id === null);
			
			if (questionsWithoutSection.length > 0) {
				if (!sections.find(s => s.id === 0)) {
					sections = [{
						id: 0,
						name: 'Questions générales',
						description: '',
						order_index: -1
					}, ...sections];
				}
			}
			
			if (sections.length === 0 && questions.length > 0) {
				sections = [{
					id: 0,
					name: 'Toutes les questions',
					description: '',
					order_index: 0
				}];
			}
			
			const { data: answersData, error: answersError } = await supabase
				.from('answers')
				.select('*')
				.eq('submission_id', submissionId);
			
			if (answersError) {
				console.error('Error loading answers:', answersError);
			}
			
			answers = answersData || [];
			
			// Check if we already have AI recommendations
			const { data: llmData } = await supabase
				.from('llm_responses')
				.select('*')
				.eq('submission_id', submissionId)
				.order('generated_at', { ascending: false })
				.limit(1);
			
			if (llmData && llmData.length > 0) {
				aiResponseData = llmData[0].response_content as AIRecommendation;
			}
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement';
		} finally {
			loading = false;
		}
	}
	
	function buildQuestionTree(allQuestions: Question[], parentId: number | null = null): Question[] {
		return allQuestions
			.filter(q => q.parent_id === parentId)
			.sort((a, b) => a.order_index - b.order_index)
			.map(q => ({
				...q,
				children: buildQuestionTree(allQuestions, q.id)
			}));
	}
	
	function getQuestionsForSection(sectionId: number): Question[] {
		const rootQuestions = questions.filter(q => {
			const matchesSection = sectionId === 0 
				? (!q.section_id || q.section_id === null)
				: q.section_id === sectionId;
			return matchesSection && (!q.parent_id || q.parent_id === null);
		});
		
		return buildQuestionTree(questions, null).filter(q => {
			if (sectionId === 0) {
				return !q.section_id || q.section_id === null;
			}
			return q.section_id === sectionId;
		});
	}
	
	function handleUpdateAnswer(questionId: number, value: string) {
		if (!submission) return;
		
		const existingIndex = answers.findIndex(a => a.question_id === questionId);
		if (existingIndex >= 0) {
			answers[existingIndex].value = value;
		} else {
			answers.push({
				id: 0,
				submission_id: submission.id,
				question_id: questionId,
				value: value
			});
		}
		answers = [...answers];
		
		localAnswers.set(questionId, value);
		hasChanges = true;
	}
	
	async function saveAllChanges() {
		if (!submission || localAnswers.size === 0) return;
		
		saving = true;
		error = '';
		
		try {
			const updates = Array.from(localAnswers.entries()).map(([questionId, value]) => ({
				submission_id: submission.id,
				question_id: questionId,
				value: value,
				updated_at: new Date().toISOString()
			}));
			
			const { error: err } = await supabase
				.from('answers')
				.upsert(updates, {
					onConflict: 'submission_id,question_id'
				});
			
			if (err) {
				console.error('Error saving answers:', err);
				error = 'Erreur lors de la sauvegarde';
			} else {
				console.log(`Saved ${updates.length} modifications`);
				localAnswers.clear();
				hasChanges = false;
				showSuccessToast('Toutes les modifications ont été sauvegardées');
			}
		} catch (err) {
			console.error('Error batch saving:', err);
			error = 'Erreur lors de la sauvegarde';
		} finally {
			saving = false;
		}
	}
	
	function showSuccessToast(message: string) {
		toastMessage = message;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 4000);
	}
	
	function cancelChanges() {
		localAnswers.clear();
		hasChanges = false;
		editMode = false;
		loadData();
	}
	
	async function handleSubmit() {
		if (!submission) return;
		
		saving = true;
		error = '';
		
		try {
			const authUser = (await supabase.auth.getUser()).data.user;
			if (!authUser) throw new Error('Non authentifié');
			
			const { data: userData } = await supabase
				.from('users')
				.select('id')
				.eq('email', authUser.email)
				.single();
			
			if (userData) {
				const { error: err } = await supabase
					.from('submissions')
					.update({
						status: 'submitted',
						submission_count: submission.submission_count + 1,
						submitted_by_user_id: userData.id,
						locked_by_user_id: userData.id,
						updated_at: new Date().toISOString()
					})
					.eq('id', submission.id);
				
				if (!err) {
					submission.status = 'submitted';
					submission.submission_count++;
					editMode = false;
					showSuccessToast('Questionnaire soumis avec succès');
					
					generatingAI = true;
					try {
						// Simulation de délai pour l'effet de génération
						await new Promise(resolve => setTimeout(resolve, 2000));
						
						// Données en dur pour la démo
						aiResponseData = {
							conseils: [
								"💪 Commencer par 30 minutes de marche rapide 3 fois par semaine, en augmentant progressivement à 5 fois par semaine",
								"🏊 Privilégier la natation 2 fois par semaine pour renforcer les muscles sans impact sur les articulations",
								"🧘 Intégrer 15 minutes d'étirements quotidiens le matin pour améliorer la souplesse et réduire les tensions",
								"🥗 Maintenir une alimentation équilibrée riche en protéines pour soutenir le développement musculaire",
								"💧 Boire au minimum 2 litres d'eau par jour, augmenter à 3 litres les jours d'activité physique",
								"😴 Respecter 7-8 heures de sommeil par nuit pour optimiser la récupération musculaire",
								"📊 Tenir un journal d'activité physique pour suivre les progrès et ajuster l'intensité",
								"🚶 Utiliser les escaliers plutôt que l'ascenseur pour augmenter l'activité quotidienne",
								"⏰ Établir une routine fixe d'exercice pour créer une habitude durable",
								"👥 Rejoindre un groupe de sport adapté pour maintenir la motivation et le lien social"
							],
							objectifs: [
								"Améliorer l'endurance cardiovasculaire de 20% en 3 mois",
								"Renforcer la masse musculaire, particulièrement au niveau du tronc et des jambes",
								"Réduire les douleurs lombaires par le renforcement de la ceinture abdominale",
								"Atteindre 150 minutes d'activité physique modérée par semaine selon les recommandations OMS",
								"Améliorer la qualité de vie et l'autonomie dans les activités quotidiennes"
							],
							benefices: [
								"Réduction du risque cardiovasculaire de 30-40%",
								"Amélioration de la densité osseuse et prévention de l'ostéoporose",
								"Diminution du stress et amélioration de l'humeur grâce aux endorphines",
								"Meilleur contrôle du poids et de la composition corporelle",
								"Amélioration de la qualité du sommeil et de l'énergie quotidienne",
								"Renforcement du système immunitaire",
								"Prévention du diabète de type 2 et amélioration de la sensibilité à l'insuline"
							],
							programme_perso: {
								endurance: "Marche rapide : 30 min x 3/semaine en semaine 1-2, puis augmenter à 45 min x 4/semaine. Natation : 2 séances de 30 min/semaine. Vélo d'appartement : 20 min à intensité modérée 2 fois/semaine.",
								renforcement: "Circuit training 2x/semaine : squats (3x12), pompes murales (3x10), gainage (3x30sec), levées de jambes (3x10). Utiliser des bandes élastiques pour progresser. Séances de 30-40 minutes.",
								etirements: "Routine quotidienne de 15 min : étirements des ischio-jambiers, quadriceps, mollets, dos et épaules. Yoga doux 1x/semaine. Insister sur la respiration profonde pendant les étirements.",
								equilibre: "Exercices sur une jambe : 3x30 sec par jambe. Marche talon-pointe sur ligne droite. Tai-chi ou yoga 1x/semaine pour améliorer la proprioception."
							},
							planification: `
LUNDI : Marche rapide 30-45 min + Étirements 15 min
MARDI : Natation 30 min + Renforcement musculaire 30 min
MERCREDI : Repos actif (marche légère 20 min) + Étirements 15 min
JEUDI : Circuit training 40 min + Étirements 15 min
VENDREDI : Marche rapide 30-45 min ou Vélo 20 min
SAMEDI : Natation 30 min + Yoga/Tai-chi 45 min
DIMANCHE : Repos ou activité légère de loisir (jardinage, promenade)
							`,
							orientation: [
								"Consultation avec un kinésithérapeute pour évaluation posturale complète",
								"Rendez-vous avec un éducateur APA certifié pour personnalisation du programme",
								"Suivi médical trimestriel pour ajuster la prescription selon l'évolution",
								"Inscription recommandée dans une association sport-santé locale",
								"Bilan podologique si douleurs aux genoux ou hanches persistent"
							],
							contraindications: [
								"Éviter les exercices à impact élevé (course, sauts)",
								"Ne pas dépasser 70% de la fréquence cardiaque maximale",
								"Arrêter immédiatement en cas de douleur thoracique ou essoufflement anormal"
							],
							follow_up: {
								next_assessment: "3 mois",
								monitoring_points: [
									"Fréquence cardiaque de repos",
									"Tension artérielle",
									"Périmètre de marche",
									"Force musculaire",
									"Souplesse articulaire"
								],
								professional_referrals: [
									"Kinésithérapeute",
									"Éducateur APA",
									"Nutritionniste si besoin"
								]
							},
							disclaimer: "🩺 Ces conseils ne remplacent pas un avis médical. Ils doivent être validés par un professionnel de santé avant application. En cas de symptômes inhabituels, consultez immédiatement votre médecin."
						};
						
						const { error: aiError } = await supabase
							.from('llm_responses')
							.insert({
								submission_id: submission.id,
								response_content: aiResponseData,
								generated_at: new Date().toISOString()
							});
						
						if (aiError) {
							console.error('Error saving AI response:', aiError);
						}
						
						// Switch to prescription view after generation
						goto(`/dashboard/submission/${submission.id}?view=prescription`);
					} catch (aiErr) {
						console.error('Error generating AI recommendations:', aiErr);
						aiResponseData = null;
					} finally {
						generatingAI = false;
					}
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la soumission';
		} finally {
			saving = false;
		}
	}
	
	function handleAIUpdate(updatedResponse: AIRecommendation) {
		aiResponseData = updatedResponse;
	}
	
	function getStatusColor(status: string) {
		switch(status) {
			case 'submitted': return '#22c55e';
			case 'draft': return '#f59e0b';
			default: return '#6b7280';
		}
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
	
	:global(body) {
		font-family: "Lato", sans-serif;
	}
	
	.full-screen {
		min-height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
		padding-top: 1rem;
	}
	
	
	
	.content-area {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}
	
	.questionnaire-container {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		padding: 2rem;
		margin-bottom: 2rem;
	}
	
	.section-card {
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		transition: all 0.3s ease;
	}
	
	.section-card:hover {
		border-color: #003087;
		box-shadow: 0 4px 20px rgba(0, 48, 135, 0.1);
	}
	
	.section-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
	}
	
	.btn-primary {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(0, 48, 135, 0.2);
	}
	
	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 48, 135, 0.3);
	}
	
	.btn-secondary {
		background: white;
		color: #003087;
		border: 2px solid #003087;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.btn-secondary:hover {
		background: #003087;
		color: white;
	}
	
	.btn-ghost {
		background: transparent;
		color: #6b7280;
		border: 2px solid #e5e7eb;
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}
	
	.btn-ghost:hover {
		border-color: #9ca3af;
		background: #f9fafb;
	}
	
	.loading-spinner {
		display: inline-block;
		width: 50px;
		height: 50px;
		border: 3px solid rgba(0, 48, 135, 0.1);
		border-radius: 50%;
		border-top-color: #003087;
		animation: spin 1s ease-in-out infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
		font-weight: 500;
	}
	
	.alert-success {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #86efac;
	}
	
	.alert-error {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fca5a5;
	}
	
	.toast {
		position: fixed;
		top: 2rem;
		right: 2rem;
		background: white;
		padding: 1rem 1.5rem;
		border-radius: 0.75rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		gap: 0.75rem;
		min-width: 300px;
		max-width: 400px;
		z-index: 1000;
		animation: slideIn 0.3s ease-out;
		border-left: 4px solid #22c55e;
	}
	
	.toast-icon {
		width: 24px;
		height: 24px;
		background: #22c55e;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		flex-shrink: 0;
	}
	
	.toast-message {
		flex: 1;
		color: #1f2937;
		font-weight: 500;
	}
	
	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	
	.toast.fade-out {
		animation: fadeOut 0.3s ease-out forwards;
	}
	
	@keyframes fadeOut {
		to {
			transform: translateX(100%);
			opacity: 0;
		}
	}
</style>

<!-- Toast Notification -->
{#if showToast}
	<div class="toast {!showToast ? 'fade-out' : ''}">
		<div class="toast-icon">
			✓
		</div>
		<div class="toast-message">
			{toastMessage}
		</div>
	</div>
{/if}

<div class="full-screen">
	<!-- Content Area -->
	<div class="content-area">
		{#if error}
			<div class="alert alert-error">{error}</div>
		{/if}
		
		{#if loading}
			<div style="display: flex; justify-content: center; padding: 4rem;">
				<div class="loading-spinner"></div>
			</div>
		{:else if currentView === 'questionnaire'}
			<!-- Questionnaire View -->
			<div class="questionnaire-container">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb;">
					<div>
						<h2 style="font-size: 1.5rem; font-weight: 700; color: #111827;">
							Formulaire de santé
						</h2>
						<p style="color: #6b7280; margin-top: 0.25rem;">
							{questions.length} questions • {answers.length} réponses
							{#if hasChanges}
								<span style="color: #f59e0b; margin-left: 0.5rem;">⚠️ Modifications non sauvegardées</span>
							{/if}
						</p>
					</div>
					<div style="display: flex; gap: 0.75rem;">
						{#if !editMode}
							<button class="btn-primary" onclick={() => editMode = true}>
								✏️ Modifier
							</button>
						{:else}
							<button class="btn-ghost" onclick={cancelChanges}>
								Annuler
							</button>
							{#if hasChanges}
								<button class="btn-secondary" onclick={saveAllChanges} disabled={saving}>
									{saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
								</button>
							{/if}
							<button class="btn-primary" onclick={handleSubmit} disabled={saving}>
								{saving ? '⏳ En cours...' : '🚀 Soumettre & Générer IA'}
							</button>
						{/if}
					</div>
				</div>
				
				<!-- Sections and Questions -->
				{#each sections as section}
					{@const sectionQuestions = getQuestionsForSection(section.id)}
					<div class="section-card">
						<h3 class="section-title">
							{section.name}
							<span style="font-weight: 400; color: #9ca3af; margin-left: 0.5rem; font-size: 0.875rem;">
								({sectionQuestions.length} questions)
							</span>
						</h3>
						{#if section.description}
							<p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.875rem;">
								{section.description}
							</p>
						{/if}
						
						<div style="margin-top: 1rem;">
							{#each sectionQuestions as question}
								<QuestionItem
									question={question}
									answers={answers}
									editMode={editMode}
									onUpdate={handleUpdateAnswer}
								/>
							{/each}
						</div>
					</div>
				{/each}
				
				<!-- Orphan Questions -->
				{#each [buildQuestionTree(questions.filter(q => !q.section_id && !q.parent_id), null)] as orphanQuestions}
					{#if orphanQuestions.length > 0}
						<div class="section-card" style="background: #f9fafb;">
							<h3 class="section-title" style="color: #6b7280;">
								Autres questions
							</h3>
							<div style="margin-top: 1rem;">
								{#each orphanQuestions as question}
									<QuestionItem
										question={question}
										answers={answers}
										editMode={editMode}
										onUpdate={handleUpdateAnswer}
									/>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
			
		{:else if currentView === 'prescription'}
			<!-- Prescription Médicale View -->
			<div style="margin-bottom: 1rem;">
				<button class="btn-ghost" onclick={() => goto(`/dashboard/submission/${$page.params.id}?view=questionnaire`)}>
					← Retour au questionnaire
				</button>
				<button class="btn-secondary" onclick={() => goto(`/dashboard/submission/${$page.params.id}?view=conseils`)} style="margin-left: 0.5rem;">
					Voir les conseils →
				</button>
			</div>
			<PrescriptionMedicale 
				submission={submission}
				aiResponse={aiResponseData}
			/>
		{:else if currentView === 'conseils'}
			<!-- Page Conseils View -->
			<div style="margin-bottom: 1rem;">
				<button class="btn-secondary" onclick={() => goto(`/dashboard/submission/${$page.params.id}?view=prescription`)}>
					← Voir la prescription
				</button>
				<button class="btn-ghost" onclick={() => goto(`/dashboard/submission/${$page.params.id}?view=questionnaire`)} style="margin-left: 0.5rem;">
					Retour au questionnaire
				</button>
			</div>
			<PageConseilsAPA 
				submission={submission}
				aiResponse={aiResponseData}
			/>
		{/if}
	</div>
</div>