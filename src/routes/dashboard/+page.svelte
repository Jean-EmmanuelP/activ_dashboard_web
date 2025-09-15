<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { Submission } from '$lib/supabase';
	import { onMount } from 'svelte';
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
			const { data: allSubmissions, error: subError } = await supabase
				.from('submissions')
				.select('*')
				.or(`secure_key.ilike.${searchValue}%,secure_key.ilike.%${searchValue}`);

			if (subError) throw subError;

			let matchedSubmissions = allSubmissions || [];
			
			matchedSubmissions.sort((a, b) => {
				const aKey = a.secure_key.toLowerCase();
				const bKey = b.secure_key.toLowerCase();
				
				if (aKey === searchValue) return -1;
				if (bKey === searchValue) return 1;
				
				if (aKey.startsWith(searchValue) && !bKey.startsWith(searchValue)) return -1;
				if (!aKey.startsWith(searchValue) && bKey.startsWith(searchValue)) return 1;
				
				return 0;
			});

			if (matchedSubmissions.length === 0) {
				throw new Error(`Aucune submission trouvée avec "${searchValue}" au début ou à la fin de la clé`);
			}

			const submission = matchedSubmissions[0];

			const { data: answersData } = await supabase
				.from('answers')
				.select('*')
				.eq('submission_id', submission.id)
				.order('question_id');

			selectedSubmission = submission;
			
			if (!submissionsList.find(s => s.id === submission.id)) {
				submissionsList = [submission, ...submissionsList];
			}

			searchKey = '';
			
			if (matchedSubmissions.length > 1) {
				const matchInfo = matchedSubmissions.slice(0, 3).map(s => {
					const key = s.secure_key;
					return `${key.slice(0, 4)}...${key.slice(-4)}`;
				}).join(', ');
				
				error = `${matchedSubmissions.length} correspondances trouvées (${matchInfo}${matchedSubmissions.length > 3 ? ', ...' : ''}). Affichage de la meilleure correspondance.`;
			} else {
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
		goto(`/dashboard/submission/${submission.id}`);
	}

	function getStatusColor(status: string) {
		switch(status) {
			case 'submitted': return 'badge-success';
			case 'draft': return 'badge-warning';
			default: return 'badge-primary';
		}
	}
</script>

<div class="container mx-auto p-8">
	<h1 class="mb-8 lato-black" style="color: var(--color-gray-900);">
		Rechercher le questionnaire d'un patient
	</h1>

	<div class="card mb-8">
		<div class="mb-4">
			<p class="lato-regular text-sm" style="color: var(--color-gray-600);">
				💡 Demandez au patient les 2-5 premiers ou derniers caractères de sa clé sécurisée
			</p>
		</div>
		<form onsubmit={(e) => { e.preventDefault(); searchSubmission(); }} class="flex gap-4">
			<div class="flex-1 gap-2">
				<div class="relative flex flex-row gap-4">
					<input
						placeholder="Ex: c5df (début) ou 0154 (fin) - Min. 2 caractères"
						bind:value={searchKey}
						disabled={loading}
						class="form-input pl-12"
						style="width: 100%;"
					/>
				</div>
			</div>
			<button type="submit" disabled={loading || !searchKey.trim()} class="btn btn-primary">
				{#if loading}
					<div class="spinner" style="width: 20px; height: 20px;"></div>
					Recherche...
				{:else}
					Rechercher
				{/if}
			</button>
		</form>

		{#if error}
			<div class="alert {error.startsWith('✓') ? 'alert-success' : error.includes('correspondances trouvées') ? 'alert-warning' : 'alert-error'} mt-4">
				{error}
			</div>
		{/if}
	</div>

	<div class="card">
		<div class="mb-6 text-center">
			<h2 class="lato-bold text-xl" style="color: var(--color-gray-800);">
				Submissions récentes
			</h2>
			<p class="lato-regular text-sm mt-1" style="color: var(--color-gray-600);">
				Les 10 dernières submissions créées
			</p>
		</div>

		<div class="overflow-x-auto">
			<table class="table">
				<thead>
					<tr>
						<th>Statut</th>
						<th>ID</th>
						<th>Date de mise à jour</th>
						<th>Soumissions</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if loadingSubmissions}
						<tr>
							<td colspan="5" class="text-center py-8">
								<div class="flex justify-center">
									<div class="spinner"></div>
								</div>
								<p class="mt-3 lato-regular" style="color: var(--color-gray-500);">
									Chargement des submissions...
								</p>
							</td>
						</tr>
					{:else}
						{#each submissionsList as submission}
						<tr>
							<td>
								<span class="badge {getStatusColor(submission.status)}">
									{submission.status}
								</span>
							</td>
							<td>
								<span class="lato-regular" style="font-family: monospace; font-size: 0.875rem; color: var(--color-gray-600);">
									{submission.secure_key.slice(0, 8)}...
								</span>
							</td>
							<td>
								<span class="lato-regular" style="color: var(--color-gray-600);">
									{new Date(submission.updated_at || '').toLocaleDateString('fr-FR')}
								</span>
							</td>
							<td>
								<span class="lato-regular" style="color: var(--color-gray-700);">
									{submission.submission_count}
								</span>
							</td>
							<td>
								<button onclick={() => selectSubmission(submission)} class="btn btn-sm btn-primary">
									Voir plus
								</button>
							</td>
						</tr>
						{/each}
					{/if}
					{#if !loadingSubmissions && submissionsList.length === 0}
						<tr>
							<td colspan="5" class="text-center" style="color: var(--color-gray-500);">
								Aucune submission trouvée
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>