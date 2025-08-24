<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { Submission } from '$lib/supabase';
	import { onMount } from 'svelte';
	import { Button, Card, Input, Label, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Alert } from 'flowbite-svelte';
	import { SearchOutline } from 'flowbite-svelte-icons';
	import { goto } from '$app/navigation';

	let searchKey = $state('');
	let submissionsList = $state<Submission[]>([]);
	let selectedSubmission = $state<Submission | null>(null);
	let loading = $state(false);
	let error = $state('');
	let loadingSubmissions = $state(true);
	onMount(async () => {
		await loadRecentSubmissions();
	});


	async function loadRecentSubmissions() {
		loadingSubmissions = true;
		try {
			// Load the 10 most recent submissions
			const { data, error: err } = await supabase
				.from('submissions')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(10);
			
			if (!err && data) {
				submissionsList = data;
			}
		} finally {
			loadingSubmissions = false;
		}
	}

	async function searchSubmission() {
		if (!searchKey.trim()) {
			error = 'Veuillez entrer au moins 2 caractères';
			return;
		}

		const searchValue = searchKey.trim().toLowerCase();
		
		if (searchValue.length < 2) {
			error = 'Veuillez entrer au moins 2 caractères (début ou fin de la clé)';
			return;
		}

		loading = true;
		error = '';

		try {
			// Search for submissions where secure_key starts with or ends with the search value
			// Using case-insensitive search with ilike
			const { data: allSubmissions, error: subError } = await supabase
				.from('submissions')
				.select('*')
				.or(`secure_key.ilike.${searchValue}%,secure_key.ilike.%${searchValue}`);

			if (subError) throw subError;

			// Filter to find best matches
			let matchedSubmissions = allSubmissions || [];
			
			// Sort by relevance: exact matches first, then starts with, then ends with
			matchedSubmissions.sort((a, b) => {
				const aKey = a.secure_key.toLowerCase();
				const bKey = b.secure_key.toLowerCase();
				
				// Exact match gets highest priority
				if (aKey === searchValue) return -1;
				if (bKey === searchValue) return 1;
				
				// Starts with gets second priority
				if (aKey.startsWith(searchValue) && !bKey.startsWith(searchValue)) return -1;
				if (!aKey.startsWith(searchValue) && bKey.startsWith(searchValue)) return 1;
				
				// Default order
				return 0;
			});

			if (matchedSubmissions.length === 0) {
				throw new Error(`Aucune submission trouvée avec "${searchValue}" au début ou à la fin de la clé`);
			}

			// Select the best match (first one after sorting)
			const submission = matchedSubmissions[0];

			const { data: answersData } = await supabase
				.from('answers')
				.select('*')
				.eq('submission_id', submission.id)
				.order('question_id');

			selectedSubmission = submission;
			answers = answersData || [];
			
			// Add to list if not already present
			if (!submissionsList.find(s => s.id === submission.id)) {
				submissionsList = [submission, ...submissionsList];
			}

			searchKey = '';
			
			// Show info about multiple matches
			if (matchedSubmissions.length > 1) {
				const matchInfo = matchedSubmissions.slice(0, 3).map(s => {
					const key = s.secure_key;
					return `${key.slice(0, 4)}...${key.slice(-4)}`;
				}).join(', ');
				
				error = `${matchedSubmissions.length} correspondances trouvées (${matchInfo}${matchedSubmissions.length > 3 ? ', ...' : ''}). Affichage de la meilleure correspondance.`;
			} else {
				// Show success with the found key
				const key = submission.secure_key;
				error = `✓ Submission trouvée: ${key.slice(0, 8)}...${key.slice(-8)}`;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la recherche';
		} finally {
			loading = false;
		}
	}

	async function selectSubmission(submission: Submission) {
		// Navigate to the submission detail page
		goto(`/dashboard/submission/${submission.id}`);
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
	<h1 class="mb-6 text-3xl font-bold text-gray-800">Rechercher le questionnaire d'un patient</h1>

	<Card class="mb-6 shadow-lg">
		<div class="mb-2">
			<p class="text-sm text-gray-600">💡 Demandez au patient les 2-5 premiers ou derniers caractères de sa clé sécurisée</p>
		</div>
		<form onsubmit={(e) => { e.preventDefault(); searchSubmission(); }} class="flex gap-4">
			<div class="flex-1">
				<div class="relative">
					<SearchOutline class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
					<Input
						placeholder="Ex: c5df (début) ou 0154 (fin) - Min. 2 caractères"
						bind:value={searchKey}
						disabled={loading}
						size="lg"
						class="w-full pl-10"
					/>
				</div>
			</div>
			<Button type="submit" disabled={loading || !searchKey.trim()} size="lg" color="blue">
				{#if loading}
					<svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
					</svg>
					Recherche...
				{:else}
					Rechercher
				{/if}
			</Button>
		</form>

		{#if error}
			<Alert color={error.startsWith('✓') ? 'green' : error.includes('correspondances trouvées') ? 'yellow' : 'red'} class="mt-4">
				{error}
			</Alert>
		{/if}
	</Card>

	<Card class="shadow-lg">
		<div class="mb-4 flex flex-col items-center justify-between border-b pb-4">
			<div class="flex flex-col items-center justify-center py-4">
				<h2 class="text-xl font-semibold text-gray-800">Submissions récentes</h2>
				<p class="text-sm text-gray-600">Les 10 dernières submissions créées</p>
			</div>
		</div>

		<Table hoverable={true} class="w-full">
			<TableHead class="bg-gray-50">
				<TableHeadCell class="font-semibold">Statut</TableHeadCell>
				<TableHeadCell class="font-semibold">ID</TableHeadCell>
				<TableHeadCell class="font-semibold">Date de mise à jour</TableHeadCell>
				<TableHeadCell class="font-semibold">Soumissions</TableHeadCell>
				<TableHeadCell class="font-semibold">Actions</TableHeadCell>
			</TableHead>
			<TableBody>
				{#if loadingSubmissions}
					<TableBodyRow>
						<TableBodyCell colspan="5" class="text-center py-8">
							<div class="flex justify-center">
								<svg class="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							</div>
							<p class="mt-2 text-gray-500">Chargement des submissions...</p>
						</TableBodyCell>
					</TableBodyRow>
				{:else}
					{#each submissionsList as submission}
					<TableBodyRow class="hover:bg-blue-50 transition-colors">
						<TableBodyCell>
							<Badge color={getStatusColor(submission.status)}>
								{submission.status}
							</Badge>
						</TableBodyCell>
						<TableBodyCell class="font-mono text-xs">
							{submission.secure_key.slice(0, 8)}...
						</TableBodyCell>
						<TableBodyCell>
							{new Date(submission.updated_at || '').toLocaleDateString('fr-FR')}
						</TableBodyCell>
						<TableBodyCell>
							{submission.submission_count}
						</TableBodyCell>
						<TableBodyCell>
							<Button size="xs" color="primary" onclick={() => selectSubmission(submission)} class="hover:shadow-md transition-shadow">
								Voir plus
							</Button>
						</TableBodyCell>
					</TableBodyRow>
					{/each}
				{/if}
				{#if !loadingSubmissions && submissionsList.length === 0}
					<TableBodyRow>
						<TableBodyCell colspan="5" class="text-center text-gray-500">
							Aucune submission trouvée
						</TableBodyCell>
					</TableBodyRow>
				{/if}
			</TableBody>
		</Table>
	</Card>
</div>