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
	let searchSuggestions = $state<Submission[]>([]);
	let showSuggestions = $state(false);
	let allSubmissions = $state<Submission[]>([]);
	let searchTimeout: number;
	
	onMount(async () => {
		await loadRecentSubmissions();
	});

	async function loadRecentSubmissions() {
		loadingSubmissions = true;
		try {
			const { data, error: err } = await supabase
				.from('submissions')
				.select('*')
				.order('created_at', { ascending: false });
			
			if (!err && data) {
				allSubmissions = data;
				submissionsList = data.slice(0, 10); // Affiche les 10 plus récentes par défaut
			}
		} finally {
			loadingSubmissions = false;
		}
	}

	function searchSubmissionsLive() {
		clearTimeout(searchTimeout);
		
		if (!searchKey.trim() || searchKey.trim().length < 2) {
			showSuggestions = false;
			searchSuggestions = [];
			return;
		}

		searchTimeout = setTimeout(() => {
			const searchValue = searchKey.trim().toLowerCase();
			
			// Filtrage côté client pour les UUIDs
			let matchedSubmissions = allSubmissions.filter(submission => {
				const key = submission.secure_key?.toLowerCase() || '';
				return key.startsWith(searchValue) || key.includes(searchValue);
			});
			
			// Tri par pertinence : exact match > commence par > contient
			matchedSubmissions.sort((a, b) => {
				const aKey = a.secure_key?.toLowerCase() || '';
				const bKey = b.secure_key?.toLowerCase() || '';
				
				// Correspondance exacte en premier
				if (aKey === searchValue && bKey !== searchValue) return -1;
				if (bKey === searchValue && aKey !== searchValue) return 1;
				
				// Ensuite ceux qui commencent par la valeur recherchée
				const aStarts = aKey.startsWith(searchValue);
				const bStarts = bKey.startsWith(searchValue);
				if (aStarts && !bStarts) return -1;
				if (bStarts && !aStarts) return 1;
				
				// Enfin par date de création (plus récent en premier)
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			});

			searchSuggestions = matchedSubmissions.slice(0, 5); // Limite à 5 suggestions
			showSuggestions = searchSuggestions.length > 0;
		}, 300); // Délai de 300ms pour éviter trop de requêtes
	}

	function selectSuggestion(submission: Submission) {
		searchKey = '';
		showSuggestions = false;
		searchSuggestions = [];
		selectSubmission(submission);
	}

	function hideSuggestions() {
		// Délai pour permettre le clic sur une suggestion
		setTimeout(() => {
			showSuggestions = false;
		}, 200);
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
	<h1 class="mb-8 inter-black" style="color: var(--color-gray-900); padding-top: 2rem;">
		Rechercher le questionnaire d'un patient
	</h1>

	<div class="card mb-8">
		<div class="mb-4">
			<p class="inter-regular text-sm" style="color: var(--color-gray-600);">
				💡 Tapez les premiers caractères de la clé sécurisée du patient (ex: 7d2 pour 7d27eb11...)
			</p>
		</div>
		
		<!-- Nouvelle barre de recherche avec suggestions -->
		<div class="relative">
			<div class="relative">
				<input
					placeholder="Rechercher une submission... (ex: 7d2, c5df)"
					bind:value={searchKey}
					oninput={searchSubmissionsLive}
					onfocus={() => { if (searchSuggestions.length > 0) showSuggestions = true; }}
					onblur={hideSuggestions}
					class="search-input"
					autocomplete="off"
				/>
				<div class="search-icon">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<circle cx="11" cy="11" r="8"></circle>
						<path d="m21 21-4.35-4.35"></path>
					</svg>
				</div>
			</div>
			
			<!-- Suggestions dropdown -->
			{#if showSuggestions && searchSuggestions.length > 0}
				<div class="suggestions-dropdown">
					{#each searchSuggestions as suggestion}
						<button 
							class="suggestion-item"
							onclick={() => selectSuggestion(suggestion)}
						>
							<div class="suggestion-content">
								<div class="suggestion-key">
									{suggestion.secure_key}
								</div>
								<div class="suggestion-meta">
									<span class="suggestion-status badge {getStatusColor(suggestion.status)}">
										{suggestion.status}
									</span>
									<span class="suggestion-date">
										{new Date(suggestion.created_at).toLocaleDateString('fr-FR')}
									</span>
									{#if suggestion.patient_info?.firstName || suggestion.patient_info?.lastName}
										<span class="suggestion-patient">
											{suggestion.patient_info.firstName} {suggestion.patient_info.lastName}
										</span>
									{/if}
								</div>
							</div>
							<div class="suggestion-arrow">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<polyline points="9,18 15,12 9,6"></polyline>
								</svg>
							</div>
						</button>
					{/each}
					
					{#if searchKey.trim().length >= 2 && searchSuggestions.length === 0}
						<div class="suggestion-empty">
							Aucune submission trouvée avec "{searchKey}"
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if error}
			<div class="alert {error.startsWith('✓') ? 'alert-success' : error.includes('correspondances trouvées') ? 'alert-warning' : 'alert-error'} mt-4">
				{error}
			</div>
		{/if}
	</div>

	<div class="card">
		<div class="mb-6 text-center">
			<h2 class="inter-bold text-xl" style="color: var(--color-gray-800);">
				Submissions récentes
			</h2>
			<p class="inter-regular text-sm mt-1" style="color: var(--color-gray-600);">
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
								<p class="mt-3 inter-regular" style="color: var(--color-gray-500);">
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
								<span class="inter-regular" style="font-family: monospace; font-size: 0.875rem; color: var(--color-gray-600);">
									{submission.secure_key.slice(0, 8)}...
								</span>
							</td>
							<td>
								<span class="inter-regular" style="color: var(--color-gray-600);">
									{new Date(submission.updated_at || '').toLocaleDateString('fr-FR')}
								</span>
							</td>
							<td>
								<span class="inter-regular" style="color: var(--color-gray-700);">
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

<style>
	/* Classes Inter */
	:global(.inter-regular) {
		font-family: "Inter", sans-serif;
		font-optical-sizing: auto;
		font-weight: 400;
		font-style: normal;
	}

	:global(.inter-bold) {
		font-family: "Inter", sans-serif;
		font-optical-sizing: auto;
		font-weight: 700;
		font-style: normal;
	}

	:global(.inter-black) {
		font-family: "Inter", sans-serif;
		font-optical-sizing: auto;
		font-weight: 900;
		font-style: normal;
	}

	/* Barre de recherche moderne */
	.search-input {
		width: 100%;
		padding: 1rem 1rem 1rem 3rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		font-family: 'Inter', sans-serif;
		font-optical-sizing: auto;
		font-weight: 400;
		font-style: normal;
		color: #374151;
		background-color: #ffffff;
		transition: all 0.2s ease;
		outline: none;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.search-input:focus {
		border-color: #3b82f6;
		box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
	}

	.search-input::placeholder {
		color: #9ca3af;
		font-style: italic;
	}

	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: #6b7280;
		pointer-events: none;
		z-index: 1;
	}

	/* Dropdown des suggestions */
	.suggestions-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
		z-index: 50;
		margin-top: 0.5rem;
		max-height: 400px;
		overflow-y: auto;
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.suggestion-item {
		width: 100%;
		padding: 1rem;
		border: none;
		background: none;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #f3f4f6;
	}

	.suggestion-item:last-child {
		border-bottom: none;
		border-radius: 0 0 12px 12px;
	}

	.suggestion-item:first-child {
		border-radius: 12px 12px 0 0;
	}

	.suggestion-item:hover {
		background-color: #f8fafc;
	}

	.suggestion-item:active {
		background-color: #e2e8f0;
	}

	.suggestion-content {
		flex: 1;
	}

	.suggestion-key {
		font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
		font-size: 0.875rem;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.25rem;
	}

	.suggestion-meta {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.75rem;
	}

	.suggestion-status {
		font-size: 0.65rem;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.suggestion-date {
		color: #6b7280;
		font-weight: 400;
	}

	.suggestion-patient {
		color: #374151;
		font-weight: 500;
		font-style: italic;
	}

	.suggestion-arrow {
		color: #9ca3af;
		margin-left: 1rem;
		transition: color 0.15s ease;
	}

	.suggestion-item:hover .suggestion-arrow {
		color: #6b7280;
	}

	.suggestion-empty {
		padding: 1.5rem;
		text-align: center;
		color: #6b7280;
		font-style: italic;
		background-color: #f9fafb;
		border-radius: 12px;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.search-input {
			padding: 0.875rem 0.875rem 0.875rem 2.75rem;
			font-size: 0.925rem;
		}

		.search-icon {
			left: 0.875rem;
		}

		.suggestion-item {
			padding: 0.875rem;
		}

		.suggestion-meta {
			flex-wrap: wrap;
			gap: 0.5rem;
		}
	}
</style>