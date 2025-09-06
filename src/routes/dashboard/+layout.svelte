<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	let { children } = $props();
	let user = $state<any>(null);
	let currentPath = $state('');
	let isInSubmission = $state(false);
	let submissionId = $state<string | null>(null);
	let hasAIRecommendations = $state(false);

	onMount(async () => {
		auth.subscribe((state) => {
			user = state.user;
			if (!state.user && !state.loading) {
				goto('/');
			}
		});

		await auth.checkUser();
		
		// Track current path for active state
		currentPath = window.location.pathname;
		
		// Subscribe to page changes
		page.subscribe(async ($page) => {
			currentPath = $page.url.pathname;
			
			// Check if we're in a submission page
			const match = currentPath.match(/\/dashboard\/submission\/([^\/]+)/);
			if (match) {
				isInSubmission = true;
				submissionId = match[1];
				
				// Check if AI recommendations exist for this submission
				const { data: llmData } = await supabase
					.from('llm_responses')
					.select('id')
					.eq('submission_id', submissionId)
					.limit(1);
				
				hasAIRecommendations = llmData && llmData.length > 0;
			} else {
				isInSubmission = false;
				submissionId = null;
				hasAIRecommendations = false;
			}
		});
	});

	async function handleLogout() {
		await auth.signOut();
		goto('/');
	}
</script>

{#if user}
	<div class="flex h-screen" style="background-color: var(--color-gray-50);">
		<!-- Modern Sidebar -->
		<aside class="w-72 bg-white shadow-xl" style="border-right: 1px solid var(--color-gray-200);">
			<div class="flex flex-col h-full">
				<!-- Logo/Header Section -->
				<div class="p-6 border-b" style="border-color: var(--color-gray-200);">
					<h2 class="lato-black text-2xl" style="color: var(--color-primary);">
						Dashboard Médecin
					</h2>
					<div class="mt-4 p-3 rounded-modern" style="background-color: var(--color-gray-50);">
						<p class="lato-bold text-sm" style="color: var(--color-gray-900);">
							{user.first_name} {user.last_name}
						</p>
						<p class="lato-regular text-xs mt-1" style="color: var(--color-gray-600);">
							{user.email}
						</p>
					</div>
				</div>

				<!-- Navigation Menu -->
				<nav class="flex-1 p-4">
					<div class="space-y-2">
						<a 
							href="/dashboard" 
							class="nav-link flex items-center gap-3 {currentPath === '/dashboard' ? 'active' : ''}"
							style="padding: 0.875rem 1rem;"
						>
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
								<path fill-rule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100-4h-.09A1.65 1.65 0 0010 4.65v1.7A1.65 1.65 0 0011.65 8H14a2 2 0 110 4h-2.35a1.65 1.65 0 00-1.65 1.65v1.7c0 .9.73 1.65 1.65 1.65H14a2 2 0 012 2v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1a2 2 0 012-2h2.35a1.65 1.65 0 001.65-1.65v-1.7A1.65 1.65 0 008.35 12H6a2 2 0 01-2-2V5z" clip-rule="evenodd"></path>
							</svg>
							<span class="lato-regular">Submissions</span>
						</a>
						
						<!-- Submission Sub-Navigation -->
						{#if isInSubmission && submissionId}
							<div class="ml-4 pl-4 border-l-2" style="border-color: var(--color-gray-300);">
								<a 
									href="/dashboard/submission/{submissionId}?view=questionnaire" 
									class="nav-link flex items-center gap-3 text-sm {currentPath.includes(`/submission/${submissionId}`) && !currentPath.includes('view=prescription') && !currentPath.includes('view=conseils') ? 'active' : ''}"
									style="padding: 0.625rem 0.875rem;"
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd"></path>
									</svg>
									<span class="lato-regular">Questionnaire</span>
								</a>
								
								{#if hasAIRecommendations}
									<div style="margin-top: 0.5rem; padding-left: 0.5rem;">
										<div style="font-size: 0.75rem; color: var(--color-gray-500); margin-bottom: 0.375rem; font-weight: 600;">
											Recommandations IA
										</div>
										<a 
											href="/dashboard/submission/{submissionId}?view=prescription" 
											class="nav-link flex items-center gap-3 text-sm {currentPath.includes('view=prescription') ? 'active' : ''}"
											style="padding: 0.5rem 0.75rem;"
										>
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
												<path fill-rule="evenodd" d="M9 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H9zM7 8a1 1 0 000 2v1a1 1 0 001 1h1a1 1 0 001-1v-1a1 1 0 100-2H8zm5-1a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-1 4a1 1 0 100 2h1a1 1 0 100-2h-1z" clip-rule="evenodd"></path>
											</svg>
											<span class="lato-regular">Prescription Médicale</span>
										</a>
										
										<a 
											href="/dashboard/submission/{submissionId}?view=conseils" 
											class="nav-link flex items-center gap-3 text-sm {currentPath.includes('view=conseils') ? 'active' : ''}"
											style="padding: 0.5rem 0.75rem;"
										>
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
											</svg>
											<span class="lato-regular">Conseils APA</span>
										</a>
									</div>
								{:else}
									<div style="margin-top: 0.5rem; padding-left: 0.5rem;">
										<span class="text-xs" style="color: var(--color-gray-500); font-style: italic;">
											Soumettez le questionnaire pour générer les recommandations IA
										</span>
									</div>
								{/if}
							</div>
						{/if}
						
						<a 
							href="/dashboard/settings" 
							class="nav-link flex items-center gap-3 {currentPath === '/dashboard/settings' ? 'active' : ''}"
							style="padding: 0.875rem 1rem;"
						>
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>
							</svg>
							<span class="lato-regular">Paramètres</span>
						</a>
					</div>
				</nav>

				<!-- Logout Button -->
				<div class="p-4 border-t" style="border-color: var(--color-gray-200);">
					<button 
						onclick={handleLogout} 
						class="btn btn-danger w-full"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
						</svg>
						Déconnexion
					</button>
				</div>
			</div>
		</aside>

		<!-- Main Content Area -->
		<main class="flex-1 overflow-auto">
			<div class="h-full">
				{@render children?.()}
			</div>
		</main>
	</div>
{/if}

<style>
	aside {
		transition: transform 0.3s ease;
	}
	
	@media (max-width: 768px) {
		aside {
			position: fixed;
			left: 0;
			top: 0;
			height: 100vh;
			z-index: 30;
			transform: translateX(-100%);
		}
		
		aside.open {
			transform: translateX(0);
		}
	}
</style>