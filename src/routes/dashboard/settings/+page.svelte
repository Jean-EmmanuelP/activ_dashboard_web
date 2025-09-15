<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { auth } from '$lib/stores/auth';
	import { Button, Alert } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { UserCircle, Mail, FileSignature, Calendar, Shield, Check } from 'lucide-svelte';

	let user = $state<any>(null);
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let signature = $state('');
	let loading = $state(false);
	let success = $state('');
	let error = $state('');

	onMount(async () => {
		const unsubscribe = auth.subscribe((state) => {
			if (state.user) {
				user = state.user;
				firstName = state.user.first_name || '';
				lastName = state.user.last_name || '';
				email = state.user.email;
				signature = state.user.signature || '';
			}
		});

		return unsubscribe;
	});

	async function updateProfile() {
		if (!user) return;

		loading = true;
		error = '';
		success = '';

		try {
			const { data, error: updateError } = await supabase
				.from('users')
				.update({
					first_name: firstName,
					last_name: lastName,
					signature: signature,
					updated_at: new Date().toISOString()
				})
				.eq('id', user.id)
				.select()
				.single();

			if (updateError) throw updateError;

			auth.checkUser();
			success = 'Profil mis à jour avec succès';
			setTimeout(() => success = '', 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string | null) {
		if (!dateString) return 'Non disponible';
		return new Date(dateString).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<div class="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-gray-900">Paramètres du compte</h1>
			<p class="mt-2 text-gray-600">Gérez vos informations personnelles et vos préférences</p>
		</div>

		<!-- Success/Error Alerts -->
		{#if success}
			<div class="mb-6 animate-fade-in">
				<Alert color="green" class="border-l-4 border-green-500">
					<div class="flex items-center gap-2">
						<Check class="h-5 w-5" />
						<span>{success}</span>
					</div>
				</Alert>
			</div>
		{/if}

		{#if error}
			<div class="mb-6 animate-fade-in">
				<Alert color="red" class="border-l-4 border-red-500">
					{error}
				</Alert>
			</div>
		{/if}

		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Main Content Area -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Personal Information Card -->
				<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					<div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
						<div class="flex items-center gap-3">
							<div class="p-2 bg-blue-100 rounded-lg">
								<UserCircle class="h-5 w-5 text-blue-600" />
							</div>
							<h2 class="text-lg font-semibold text-gray-900">Informations personnelles</h2>
						</div>
					</div>

					<form onsubmit={(e) => { e.preventDefault(); updateProfile(); }} class="p-6 space-y-6">
						<div class="grid gap-6 md:grid-cols-2">
							<div class="space-y-2">
								<label for="firstName" class="block text-sm font-medium text-gray-700">
									Prénom
								</label>
								<input
									id="firstName"
									type="text"
									bind:value={firstName}
									disabled={loading}
									class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
									placeholder="Entrez votre prénom"
								/>
							</div>

							<div class="space-y-2">
								<label for="lastName" class="block text-sm font-medium text-gray-700">
									Nom
								</label>
								<input
									id="lastName"
									type="text"
									bind:value={lastName}
									disabled={loading}
									class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500"
									placeholder="Entrez votre nom"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<label for="email" class="block text-sm font-medium text-gray-700">
								<div class="flex items-center gap-2">
									<Mail class="h-4 w-4" />
									Adresse email
								</div>
							</label>
							<input
								id="email"
								type="email"
								value={email}
								disabled
								class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
							/>
							<p class="text-xs text-gray-500 mt-1">L'adresse email ne peut pas être modifiée pour des raisons de sécurité</p>
						</div>

						<div class="space-y-2">
							<label for="signature" class="block text-sm font-medium text-gray-700">
								<div class="flex items-center gap-2">
									<FileSignature class="h-4 w-4" />
									Signature électronique
								</div>
							</label>
							<textarea
								id="signature"
								bind:value={signature}
								disabled={loading}
								rows="4"
								class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
								placeholder="Votre signature sera ajoutée automatiquement aux documents générés"
							/>
							<p class="text-xs text-gray-500 mt-1">Cette signature apparaîtra sur les prescriptions et recommandations</p>
						</div>

						<div class="pt-4">
							<Button 
								type="submit" 
								disabled={loading}
								class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200"
							>
								{#if loading}
									<span class="flex items-center gap-2">
										<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Enregistrement...
									</span>
								{:else}
									Enregistrer les modifications
								{/if}
							</Button>
						</div>
					</form>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="space-y-6">
				<!-- Account Information Card -->
				<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					<div class="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
						<div class="flex items-center gap-3">
							<div class="p-2 bg-purple-100 rounded-lg">
								<Shield class="h-5 w-5 text-purple-600" />
							</div>
							<h2 class="text-lg font-semibold text-gray-900">Informations du compte</h2>
						</div>
					</div>
					
					<div class="p-6 space-y-4">
						<div class="flex items-start gap-3">
							<div class="mt-1">
								<div class="p-1.5 bg-gray-100 rounded">
									<UserCircle class="h-4 w-4 text-gray-600" />
								</div>
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">Rôle</p>
								<p class="text-sm text-gray-600 capitalize">{user?.role || 'Médecin'}</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<div class="mt-1">
								<div class="p-1.5 bg-gray-100 rounded">
									<Calendar class="h-4 w-4 text-gray-600" />
								</div>
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">Membre depuis</p>
								<p class="text-sm text-gray-600">{formatDate(user?.created_at)}</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<div class="mt-1">
								<div class="p-1.5 bg-gray-100 rounded">
									<Calendar class="h-4 w-4 text-gray-600" />
								</div>
							</div>
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-900">Dernière mise à jour</p>
								<p class="text-sm text-gray-600">{formatDate(user?.updated_at)}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Quick Stats Card -->
				<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm p-6 text-white">
					<h3 class="text-lg font-semibold mb-3">Statistiques rapides</h3>
					<div class="space-y-3">
						<div>
							<p class="text-sm opacity-90">Statut du compte</p>
							<p class="text-xl font-bold">Actif</p>
						</div>
						<div>
							<p class="text-sm opacity-90">Type de compte</p>
							<p class="text-xl font-bold">Professionnel</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>