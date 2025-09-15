<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import type { Submission, Answer, Question, Section } from '$lib/supabase';
	import { onMount } from 'svelte';
	import QuestionItem from '$lib/components/QuestionItem.svelte';
	import QuestionnaireForm from '$lib/components/QuestionnaireForm.svelte';
	import PrescriptionMedicale from '$lib/components/PrescriptionMedicale.svelte';
	import PageConseilsAPA from '$lib/components/PageConseilsAPA.svelte';
	import { goto } from '$app/navigation';
	import { AIService } from '$lib/services/aiService';
	import type { AIRecommendationResponse } from '$lib/types/ai';
	import { auth } from '$lib/stores/auth';
	
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
	let aiResponseData = $state<AIRecommendationResponse | null>(null);
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
						// Récupérer les informations du médecin depuis Supabase
						const { data: userData } = await supabase
							.from('users')
							.select('*')
							.eq('email', authUser.email)
							.single();
							
						const doctorInfo = userData ? {
							nom: userData.last_name || '',
							prenom: userData.first_name || '',
							email: userData.email,
							signature: userData.signature
						} : undefined;

						// Appeler l'API pour générer les recommandations
						aiResponseData = await AIService.generateRecommendations(
							submission,
							answers,
							questions,
							doctorInfo
						);
						
						console.log('🔍 aiResponseData reçue:', aiResponseData);
						
						if (!aiResponseData) {
							throw new Error('Aucune donnée reçue de l\'API');
						}
						
						// Stocker la réponse dans la base de données
						console.log('💾 Sauvegarde dans llm_responses...');
						console.log('📋 Données à sauvegarder:', {
							submission_id: submission.id,
							response_content: aiResponseData,
							rag_used: null
						});
						
						const { data: insertData, error: llmError } = await supabase
							.from('llm_responses')
							.insert({
								submission_id: submission.id,
								response_content: aiResponseData,
								rag_used: null,
								generated_at: new Date().toISOString()
							})
							.select();
						
						console.log('📊 Résultat insert:', { data: insertData, error: llmError });
						
						if (llmError) {
							console.error('❌ Erreur lors de la sauvegarde de la réponse IA:', llmError);
						} else {
							console.log('✅ Réponse IA sauvegardée avec succès:', insertData);
						}
						
						showSuccessToast('Recommandations IA générées avec succès !');
						
						// Afficher un message de redirection
						setTimeout(() => {
							showSuccessToast('Redirection vers la prescription...');
						}, 1000);
						
						// Rediriger automatiquement vers la prescription
						console.log('🚀 Redirection vers la prescription...');
						setTimeout(() => {
							generatingAI = false;
							console.log('🚀 Redirection effective vers la prescription');
							goto(`/dashboard/submission/${submission.id}?view=prescription`);
						}, 2000);
					} catch (err) {
						console.error('Erreur lors de la génération IA:', err);
						error = err instanceof Error ? err.message : 'Erreur lors de la génération des recommandations';
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
	
	function handleAIUpdate(updatedResponse: AIRecommendationResponse) {
		aiResponseData = updatedResponse;
	}
	
	function getStatusColor(status: string) {
		switch(status) {
			case 'submitted': return '#22c55e';
			case 'draft': return '#f59e0b';
			default: return '#6b7280';
		}
	}
	
	function navigateToView(view: 'questionnaire' | 'prescription' | 'conseils') {
		if (!submission) return;
		
		if (view === 'questionnaire') {
			goto(`/dashboard/submission/${submission.id}`);
		} else {
			goto(`/dashboard/submission/${submission.id}?view=${view}`);
		}
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
	
	:global(body) {
		font-family: "Lato", sans-serif;
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
	
	@keyframes fadeOut {
		to {
			transform: translateX(100%);
			opacity: 0;
		}
	}
</style>

<!-- Toast Notification -->
{#if showToast}
	<div class="fixed top-8 right-8 bg-white p-4 pr-6 rounded-xl shadow-xl flex items-center gap-3 min-w-80 max-w-md z-50 border-l-4 border-green-500 {!showToast ? 'animate-[fadeOut_0.3s_ease-out_forwards]' : 'animate-[slideIn_0.3s_ease-out]'}">
		<div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
			✓
		</div>
		<div class="flex-1 text-gray-800 font-medium">
			{toastMessage}
		</div>
	</div>
{/if}

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-4">
	<!-- Content Area -->
	<div class="p-8 max-w-7xl mx-auto">
		{#if error}
			<div class="p-4 rounded-lg mb-4 font-medium bg-red-50 text-red-800 border border-red-200">{error}</div>
		{/if}
		
		{#if loading}
			<div class="flex justify-center py-16">
				<div class="inline-block w-12 h-12 border-3 border-blue-900/10 rounded-full border-t-blue-900 animate-spin"></div>
			</div>
		{:else if generatingAI}
			<!-- Loader spécial pour génération IA -->
			<div class="flex flex-col items-center justify-center py-16">
				<div class="inline-block w-12 h-12 border-3 border-blue-900/10 rounded-full border-t-blue-900 animate-spin"></div>
				<p class="mt-4 text-blue-900 font-semibold">🤖 Génération des recommandations IA en cours...</p>
				<p class="text-gray-600 text-sm text-center max-w-md">
					L'intelligence artificielle analyse vos réponses pour créer des recommandations personnalisées. 
					Cela peut prendre quelques secondes.
				</p>
			</div>
		{:else if currentView === 'questionnaire'}
			<!-- Questionnaire View -->
			<QuestionnaireForm
				bind:editMode
				{questions}
				{sections}
				{answers}
				{hasChanges}
				{saving}
				{generatingAI}
				onUpdateAnswer={handleUpdateAnswer}
				onCancelChanges={cancelChanges}
				onSaveChanges={saveAllChanges}
				onSubmit={handleSubmit}
			/>
			
		{:else if currentView === 'prescription'}
			<!-- Prescription Médicale View -->
			<PrescriptionMedicale 
				submission={submission}
				aiResponse={aiResponseData}
			/>
		{:else if currentView === 'conseils'}
			<!-- Page Conseils View -->
			<PageConseilsAPA 
				submission={submission}
				aiResponse={aiResponseData}
			/>
		{/if}
	</div>
</div>