<script lang="ts">
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import type { Submission, Answer, Question, Section } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { Button, Card, Badge, Alert } from 'flowbite-svelte';
	import QuestionItem from '$lib/components/QuestionItem.svelte';
	import { goto } from '$app/navigation';
	
	let submission = $state<Submission | null>(null);
	let sections = $state<Section[]>([]);
	let questions = $state<Question[]>([]);
	let answers = $state<Answer[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let editMode = $state(true);
	let showAiResponse = $state(false);
	let error = $state('');
	let success = $state('');
	
	// Mock AI response
	let aiResponse = $state({
		conseils: [
			"Commencer par des activités douces comme la marche 30 min/jour",
			"Augmenter progressivement l'intensité sur 4 semaines",
			"Maintenir une régularité dans la pratique (minimum 3x/semaine)"
		],
		objectifs: [
			"Améliorer la condition cardiovasculaire",
			"Renforcer la masse musculaire",
			"Réduire le stress quotidien",
			"Perdre 5kg en 3 mois"
		],
		benefices: [
			"Réduction du risque cardiovasculaire de 30%",
			"Amélioration de la qualité de sommeil",
			"Augmentation de l'énergie quotidienne",
			"Meilleure régulation de la glycémie"
		],
		programme_perso: "Programme personnalisé de 12 semaines avec progression adaptée à votre condition physique actuelle. Phase 1 (semaines 1-4): Adaptation avec marche et exercices légers. Phase 2 (semaines 5-8): Intensification progressive. Phase 3 (semaines 9-12): Consolidation et maintien.",
		planification: "3 séances par semaine de 30-45 minutes. Lundi: Cardio léger. Mercredi: Renforcement musculaire. Vendredi: Activité mixte.",
		orientation: "Consultation recommandée avec un kinésithérapeute pour l'accompagnement initial et un suivi médical régulier."
	});
	
	onMount(async () => {
		await loadData();
	});
	
	async function loadData() {
		loading = true;
		try {
			const submissionId = $page.params.id;
			
			// Load submission
			const { data: subData, error: subError } = await supabase
				.from('submissions')
				.select('*')
				.eq('id', submissionId)
				.single();
				
			if (subError || !subData) {
				throw new Error('Submission non trouvée');
			}
			
			submission = subData;
			
			// Load sections
			const { data: sectionsData } = await supabase
				.from('sections')
				.select('*')
				.order('order_index');
			
			sections = sectionsData || [];
			
			// Load questions with proper ordering
			const { data: questionsData } = await supabase
				.from('questions')
				.select('*')
				.order('section_id', { ascending: true, nullsFirst: true })
				.order('order_index', { ascending: true });
			
			questions = questionsData || [];
			
			// Check if there are questions without section
			const questionsWithoutSection = questions.filter(q => !q.section_id || q.section_id === null);
			
			// Add a default section for questions without section if needed
			if (questionsWithoutSection.length > 0) {
				// Check if we already have the default section
				if (!sections.find(s => s.id === 0)) {
					sections = [{
						id: 0,
						name: 'Questions générales',
						description: '',
						order_index: -1
					}, ...sections];
				}
			}
			
			// If no sections at all, create default one
			if (sections.length === 0 && questions.length > 0) {
				sections = [{
					id: 0,
					name: 'Toutes les questions',
					description: '',
					order_index: 0
				}];
			}
			
			
			// Load answers for this specific submission
			const { data: answersData, error: answersError } = await supabase
				.from('answers')
				.select('*')
				.eq('submission_id', submissionId);
			
			if (answersError) {
				console.error('Error loading answers:', answersError);
			}
			
			answers = answersData || [];
			
			// Create answers map for quick lookup
			const answersMap: Record<number, string> = {};
			answers.forEach(a => {
				answersMap[a.question_id] = a.value;
			});
			
			// Debug log
			console.log('=== LOADED DATA SUMMARY ===');
			console.log('Submission ID:', submission?.id);
			console.log('Sections:', sections.length, sections.map(s => `${s.id}: ${s.name}`));
			console.log('Total Questions:', questions.length);
			console.log('Total Answers:', answers.length);
			
			// Log questions by section
			sections.forEach(section => {
				const sectionQs = questions.filter(q => q.section_id === section.id);
				console.log(`Section "${section.name}" has ${sectionQs.length} questions`);
			});
			
			// Log orphan questions
			const orphanQs = questions.filter(q => !q.section_id);
			if (orphanQs.length > 0) {
				console.log(`Orphan questions (no section): ${orphanQs.length}`);
			}
			
			// Log answers mapping
			console.log('Answers Map:', answersMap);
			
			// Verify answers are for correct questions
			let matchedAnswers = 0;
			answers.forEach(a => {
				const q = questions.find(q => q.id === a.question_id);
				if (q) {
					matchedAnswers++;
					console.log(`Answer for Q${a.question_id}: "${q.text.substring(0, 30)}..." = "${a.value}"`);
				} else {
					console.warn(`Answer for unknown question ID ${a.question_id}`);
				}
			});
			console.log(`Matched ${matchedAnswers}/${answers.length} answers to questions`);
			console.log('=========================');
			
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement';
		} finally {
			loading = false;
		}
	}
	
	// Build hierarchical structure
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
		// Get all questions for this section (root questions only)
		const rootQuestions = questions.filter(q => {
			const matchesSection = sectionId === 0 
				? (!q.section_id || q.section_id === null)
				: q.section_id === sectionId;
			return matchesSection && (!q.parent_id || q.parent_id === null);
		});
		
		console.log(`Section ${sectionId} (${sections.find(s => s.id === sectionId)?.name}):`, {
			rootQuestions: rootQuestions.length,
			rootIds: rootQuestions.map(q => q.id)
		});
		
		// Build tree with ALL questions (not filtered by section) to include children
		return buildQuestionTree(questions, null).filter(q => {
			if (sectionId === 0) {
				return !q.section_id || q.section_id === null;
			}
			return q.section_id === sectionId;
		});
	}
	
	
	async function handleUpdateAnswer(questionId: number, value: string) {
		if (!submission) return;
		
		console.log(`Updating answer for Q${questionId} to: "${value}"`);
		
		try {
			const { error: err } = await supabase
				.from('answers')
				.upsert({
					submission_id: submission.id,
					question_id: questionId,
					value: value,
					updated_at: new Date().toISOString()
				}, {
					onConflict: 'submission_id,question_id'
				});
			
			if (err) {
				console.error('Error saving answer:', err);
				error = 'Erreur lors de la sauvegarde de la réponse';
			} else {
				// Update local state
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
				console.log('Answer saved successfully');
			}
		} catch (err) {
			console.error('Error updating answer:', err);
			error = 'Erreur lors de la sauvegarde';
		}
	}
	
	async function handleSubmit() {
		if (!submission) return;
		
		saving = true;
		error = '';
		success = '';
		
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
					showAiResponse = true;
					editMode = false;
					success = 'Questionnaire soumis avec succès';
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la soumission';
		} finally {
			saving = false;
		}
	}
	
	function getStatusColor(status: string) {
		switch(status) {
			case 'submitted': return 'green';
			case 'draft': return 'yellow';
			default: return 'dark';
		}
	}
</script>

<div class="container mx-auto p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Questionnaire Patient</h1>
			{#if submission}
				<div class="mt-2 flex items-center gap-4">
					<Badge color={getStatusColor(submission.status)}>
						{submission.status}
					</Badge>
					<span class="text-sm text-gray-600">
						ID: {submission.secure_key.slice(0, 8)}...
					</span>
					<span class="text-sm text-gray-600">
						Soumissions: {submission.submission_count}
					</span>
				</div>
			{/if}
		</div>
		<Button onclick={() => goto('/dashboard')} color="light">
			← Retour au dashboard
		</Button>
	</div>
	
	{#if error}
		<Alert color="red" class="mb-4">{error}</Alert>
	{/if}
	
	{#if success}
		<Alert color="green" class="mb-4">{success}</Alert>
	{/if}
	
	{#if loading}
		<div class="flex justify-center py-12">
			<svg class="animate-spin h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
			</svg>
		</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			<!-- Left column: Questionnaire -->
			<div class="h-full">
				<Card class="shadow-lg h-full" style="max-height: 85vh; overflow-y: auto;">
					<div class="mb-4 flex items-center justify-between border-b pb-4">
						<div>
							<h2 class="text-xl font-semibold">Questionnaire</h2>
							<p class="text-sm text-gray-600">
								{questions.length} questions, <span class="font-semibold text-blue-600">{answers.length} réponses</span>
							</p>
						</div>
						<div class="flex gap-2">
							{#if !editMode}
								<Button size="sm" onclick={() => editMode = true}>
									Modifier
								</Button>
							{:else}
								<Button size="sm" color="light" onclick={() => { editMode = false; loadData(); }}>
									Annuler
								</Button>
								<Button size="sm" color="blue" onclick={handleSubmit} disabled={saving}>
									{saving ? 'Soumission...' : 'Soumettre'}
								</Button>
							{/if}
						</div>
					</div>
					
					<!-- Display all sections and questions -->
					<div class="space-y-6">
						{#each sections as section}
							{@const sectionQuestions = getQuestionsForSection(section.id)}
							<div class="bg-white border border-gray-200 rounded-lg p-4">
								<h3 class="text-lg font-semibold mb-4 text-blue-700">
									{section.name}
									<span class="text-sm font-normal text-gray-500 ml-2">({sectionQuestions.length} questions)</span>
								</h3>
								{#if section.description}
									<p class="mb-4 text-sm text-gray-600">{section.description}</p>
								{/if}
								
								<div class="space-y-4">
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
						
						<!-- Show orphan questions if any -->
						{#each [buildQuestionTree(questions.filter(q => !q.section_id && !q.parent_id), null)] as orphanQuestions}
							{#if orphanQuestions.length > 0}
							<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
								<h3 class="text-lg font-semibold mb-4 text-gray-700">Autres questions</h3>
								<div class="space-y-4">
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
				</Card>
			</div>
			
			<!-- Right column: AI Response -->
			<div class="h-full">
				<Card class="shadow-lg h-full" style="max-height: 85vh; overflow-y: auto;">
					<h2 class="mb-4 text-xl font-semibold border-b pb-4">Recommandations IA</h2>
					
					{#if showAiResponse}
						<div class="space-y-6">
							<div>
								<h3 class="mb-3 font-semibold text-blue-600">📋 Conseils</h3>
								<ul class="list-disc pl-5 space-y-1">
									{#each aiResponse.conseils as conseil}
										<li class="text-sm text-gray-700">{conseil}</li>
									{/each}
								</ul>
							</div>
							
							<div>
								<h3 class="mb-3 font-semibold text-green-600">🎯 Objectifs</h3>
								<ul class="list-disc pl-5 space-y-1">
									{#each aiResponse.objectifs as objectif}
										<li class="text-sm text-gray-700">{objectif}</li>
									{/each}
								</ul>
							</div>
							
							<div>
								<h3 class="mb-3 font-semibold text-purple-600">✨ Bénéfices attendus</h3>
								<ul class="list-disc pl-5 space-y-1">
									{#each aiResponse.benefices as benefice}
										<li class="text-sm text-gray-700">{benefice}</li>
									{/each}
								</ul>
							</div>
							
							<div>
								<h3 class="mb-3 font-semibold text-orange-600">💪 Programme personnalisé</h3>
								<p class="text-sm text-gray-700 bg-orange-50 p-3 rounded-lg">{aiResponse.programme_perso}</p>
							</div>
							
							<div>
								<h3 class="mb-3 font-semibold text-indigo-600">📅 Planification</h3>
								<p class="text-sm text-gray-700 bg-indigo-50 p-3 rounded-lg">{aiResponse.planification}</p>
							</div>
							
							<div>
								<h3 class="mb-3 font-semibold text-red-600">🏥 Orientation médicale</h3>
								<p class="text-sm text-gray-700 bg-red-50 p-3 rounded-lg">{aiResponse.orientation}</p>
							</div>
						</div>
					{:else}
						<div class="text-center py-12 text-gray-500">
							<svg class="mx-auto h-24 w-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
							</svg>
							<p class="text-lg font-medium mb-2">Recommandations IA</p>
							<p class="text-sm">Soumettez le questionnaire pour obtenir des recommandations personnalisées</p>
						</div>
					{/if}
				</Card>
			</div>
		</div>
	{/if}
</div>