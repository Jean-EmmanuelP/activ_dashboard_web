<script lang="ts">
	import { Card, Button, Textarea, Badge, Modal, Input, Label } from 'flowbite-svelte';
	import type { AIRecommendation } from '$lib/services/vertexAI';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	let {
		aiResponse,
		submissionId,
		onUpdate
	}: {
		aiResponse: AIRecommendation;
		submissionId: string;
		onUpdate?: (response: AIRecommendation) => void;
	} = $props();
	
	// States
	let currentPage = $state(0);
	let editMode = $state(false);
	let editedResponse = $state<AIRecommendation>({ ...aiResponse });
	let doctorSignature = $state('');
	let showEmailModal = $state(false);
	let showPrintPreview = $state(false);
	let emailAddress = $state('');
	let phoneNumber = $state('');
	let sendingEmail = $state(false);
	
	// Pages configuration
	const pages = [
		{ 
			key: 'conseils', 
			title: '📋 Conseils Pratiques',
			icon: '📋',
			color: 'blue'
		},
		{ 
			key: 'objectifs', 
			title: '🎯 Objectifs',
			icon: '🎯',
			color: 'green'
		},
		{ 
			key: 'benefices', 
			title: '✨ Bénéfices Attendus',
			icon: '✨',
			color: 'purple'
		},
		{ 
			key: 'programme_perso', 
			title: '💪 Programme Personnalisé',
			icon: '💪',
			color: 'orange'
		},
		{ 
			key: 'planification', 
			title: '📅 Planification',
			icon: '📅',
			color: 'indigo'
		},
		{ 
			key: 'orientation', 
			title: '🏥 Orientation Médicale',
			icon: '🏥',
			color: 'red'
		}
	];
	
	onMount(async () => {
		// Load doctor signature
		const authUser = (await supabase.auth.getUser()).data.user;
		if (authUser) {
			const { data } = await supabase
				.from('users')
				.select('signature')
				.eq('email', authUser.email)
				.single();
			if (data?.signature) {
				doctorSignature = data.signature;
			}
		}
	});
	
	// Update edited response when aiResponse changes
	$effect(() => {
		editedResponse = { ...aiResponse };
	});
	
	function saveEdits() {
		aiResponse = { ...editedResponse };
		editMode = false;
		if (onUpdate) {
			onUpdate(aiResponse);
		}
		// Save to database
		saveToDatabase();
	}
	
	function cancelEdits() {
		editedResponse = { ...aiResponse };
		editMode = false;
	}
	
	async function saveToDatabase() {
		try {
			const { error } = await supabase
				.from('llm_responses')
				.update({
					response_content: aiResponse,
					updated_at: new Date().toISOString()
				})
				.eq('submission_id', submissionId);
				
			if (error) console.error('Error saving AI response:', error);
		} catch (err) {
			console.error('Error saving:', err);
		}
	}
	
	function printRecommendations() {
		showPrintPreview = true;
		setTimeout(() => {
			window.print();
			showPrintPreview = false;
		}, 500);
	}
	
	async function sendByEmail() {
		if (!emailAddress) return;
		
		sendingEmail = true;
		try {
			// Here you would implement the actual email sending logic
			// For now, we'll just simulate it
			console.log('Sending to:', emailAddress);
			console.log('Content:', aiResponse);
			
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 2000));
			
			showEmailModal = false;
			emailAddress = '';
		} catch (error) {
			console.error('Error sending email:', error);
		} finally {
			sendingEmail = false;
		}
	}
	
	function getPageContent(pageKey: string) {
		switch(pageKey) {
			case 'conseils':
				return editMode ? editedResponse.conseils : aiResponse.conseils;
			case 'objectifs':
				return editMode ? editedResponse.objectifs : aiResponse.objectifs;
			case 'benefices':
				return editMode ? editedResponse.benefices : aiResponse.benefices;
			case 'programme_perso':
				const prog = editMode ? editedResponse.programme_perso : aiResponse.programme_perso;
				return [
					`**Endurance:** ${prog.endurance}`,
					`**Renforcement:** ${prog.renforcement}`,
					`**Étirements:** ${prog.etirements}`,
					prog.equilibre ? `**Équilibre:** ${prog.equilibre}` : null
				].filter(Boolean);
			case 'planification':
				return [editMode ? editedResponse.planification : aiResponse.planification];
			case 'orientation':
				return editMode ? editedResponse.orientation : aiResponse.orientation;
			default:
				return [];
		}
	}
</script>

<div class="space-y-4">
	<!-- Action buttons -->
	<div class="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
		<div class="flex gap-2">
			<Button size="sm" color={editMode ? 'green' : 'blue'} onclick={() => editMode ? saveEdits() : editMode = true}>
				{editMode ? '💾 Sauvegarder' : '✏️ Modifier'}
			</Button>
			{#if editMode}
				<Button size="sm" color="light" onclick={cancelEdits}>
					Annuler
				</Button>
			{/if}
		</div>
		<div class="flex gap-2">
			<Button size="sm" color="dark" onclick={printRecommendations}>
				🖨️ Imprimer
			</Button>
			<Button size="sm" color="purple" onclick={() => showEmailModal = true}>
				📧 Envoyer
			</Button>
		</div>
	</div>
	
	<!-- Pagination tabs -->
	<div class="flex gap-2 overflow-x-auto pb-2">
		{#each pages as page, index}
			<button
				onclick={() => currentPage = index}
				class="px-4 py-2 rounded-lg whitespace-nowrap transition-all {
					currentPage === index 
						? 'bg-blue-500 text-white shadow-md' 
						: 'bg-gray-100 hover:bg-gray-200 text-gray-700'
				}"
			>
				{page.icon} {page.title}
			</button>
		{/each}
	</div>
	
	<!-- Content display -->
	<Card class="min-h-[400px]">
		<div class="space-y-4">
			<h3 class="text-xl font-semibold flex items-center gap-2">
				<span class="text-2xl">{pages[currentPage].icon}</span>
				{pages[currentPage].title}
			</h3>
			
			<div class="space-y-3">
				{#if editMode}
					{#if pages[currentPage].key === 'planification'}
						<Textarea
							bind:value={editedResponse.planification}
							rows="6"
							class="w-full"
							placeholder="Planning hebdomadaire..."
						/>
					{:else if pages[currentPage].key === 'programme_perso'}
						<div class="space-y-3">
							<div>
								<Label for="endurance">Endurance</Label>
								<Textarea
									id="endurance"
									bind:value={editedResponse.programme_perso.endurance}
									rows="2"
									class="w-full"
								/>
							</div>
							<div>
								<Label for="renforcement">Renforcement</Label>
								<Textarea
									id="renforcement"
									bind:value={editedResponse.programme_perso.renforcement}
									rows="2"
									class="w-full"
								/>
							</div>
							<div>
								<Label for="etirements">Étirements</Label>
								<Textarea
									id="etirements"
									bind:value={editedResponse.programme_perso.etirements}
									rows="2"
									class="w-full"
								/>
							</div>
							<div>
								<Label for="equilibre">Équilibre (optionnel)</Label>
								<Textarea
									id="equilibre"
									bind:value={editedResponse.programme_perso.equilibre}
									rows="2"
									class="w-full"
								/>
							</div>
						</div>
					{:else}
						{@const currentKey = pages[currentPage].key}
						{#each getPageContent(currentKey) as item, i}
							<div class="flex gap-2">
								<span class="text-gray-400">{i + 1}.</span>
								<Textarea
									value={item}
									oninput={(e) => {
										const newValue = e.currentTarget.value;
										if (currentKey === 'conseils') {
											editedResponse.conseils[i] = newValue;
										} else if (currentKey === 'objectifs') {
											editedResponse.objectifs[i] = newValue;
										} else if (currentKey === 'benefices') {
											editedResponse.benefices[i] = newValue;
										} else if (currentKey === 'orientation') {
											editedResponse.orientation[i] = newValue;
										}
									}}
									rows="2"
									class="flex-1"
								/>
							</div>
						{/each}
						<Button
							size="xs"
							color="light"
							onclick={() => {
								const key = pages[currentPage].key;
								if (key === 'conseils') editedResponse.conseils = [...editedResponse.conseils, ''];
								else if (key === 'objectifs') editedResponse.objectifs = [...editedResponse.objectifs, ''];
								else if (key === 'benefices') editedResponse.benefices = [...editedResponse.benefices, ''];
								else if (key === 'orientation') editedResponse.orientation = [...editedResponse.orientation, ''];
							}}
						>
							+ Ajouter un élément
						</Button>
					{/if}
				{:else}
					{#each getPageContent(pages[currentPage].key) as item}
						<div class="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
							<span class="text-lg">•</span>
							<p class="text-gray-700 flex-1">{@html item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
						</div>
					{/each}
				{/if}
			</div>
			
			<!-- Doctor signature -->
			{#if doctorSignature}
				<div class="mt-6 pt-4 border-t">
					<div class="flex justify-end">
						<div class="text-center">
							<p class="text-sm text-gray-600 mb-2">Signature du médecin</p>
							<div class="border-b-2 border-gray-400 w-48 mb-1"></div>
							<p class="text-sm font-semibold">{doctorSignature}</p>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Disclaimer -->
			<div class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
				<p class="text-sm text-yellow-800">
					{aiResponse.disclaimer}
				</p>
			</div>
		</div>
	</Card>
	
	<!-- Navigation buttons -->
	<div class="flex justify-between">
		<Button
			size="sm"
			color="light"
			disabled={currentPage === 0}
			onclick={() => currentPage--}
		>
			← Précédent
		</Button>
		<span class="text-sm text-gray-600 self-center">
			Page {currentPage + 1} / {pages.length}
		</span>
		<Button
			size="sm"
			color="light"
			disabled={currentPage === pages.length - 1}
			onclick={() => currentPage++}
		>
			Suivant →
		</Button>
	</div>
</div>

<!-- Email Modal -->
<Modal bind:open={showEmailModal} title="Envoyer les recommandations">
	<div class="space-y-4">
		<div>
			<Label for="email">Adresse email</Label>
			<Input
				id="email"
				type="email"
				bind:value={emailAddress}
				placeholder="patient@example.com"
			/>
		</div>
		<div>
			<Label for="phone">Numéro de téléphone (optionnel)</Label>
			<Input
				id="phone"
				type="tel"
				bind:value={phoneNumber}
				placeholder="+33 6 12 34 56 78"
			/>
		</div>
	</div>
	<svelte:fragment slot="footer">
		<Button color="green" onclick={sendByEmail} disabled={sendingEmail || !emailAddress}>
			{sendingEmail ? 'Envoi...' : 'Envoyer'}
		</Button>
		<Button color="light" onclick={() => showEmailModal = false}>
			Annuler
		</Button>
	</svelte:fragment>
</Modal>

<!-- Print styles -->
{#if showPrintPreview}
	<style>
		@media print {
			@page {
				margin: 2cm;
			}
			
			.no-print {
				display: none !important;
			}
			
			.page-break {
				page-break-after: always;
			}
		}
	</style>
{/if}