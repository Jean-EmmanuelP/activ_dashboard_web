<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { auth } from '$lib/stores/auth';
	import { Button, Alert } from 'flowbite-svelte';
	import { onMount } from 'svelte';
	import { UserCircle, Mail, FileSignature, Check, Upload, X } from 'lucide-svelte';

	let user = $state<any>(null);
	let firstName = $state('');
	let lastName = $state('');
	let email = $state('');
	let signature = $state('');
	let signatureFile = $state<File | null>(null);
	let signaturePreview = $state('');
	let uploadingSignature = $state(false);
	let loading = $state(false);
	let success = $state('');
	let error = $state('');
	

	async function loadSignaturePreview() {
		if (!signature) return;
		
		try {
			// Créer une URL signée pour afficher l'image
			const { data, error } = await supabase.storage
				.from('signatures')
				.createSignedUrl(signature, 600); // 10 minutes
			
			if (!error && data?.signedUrl) {
				signaturePreview = data.signedUrl;
			}
		} catch (err) {
			console.warn('Erreur chargement signature:', err);
		}
	}

	onMount(async () => {
		const unsubscribe = auth.subscribe(async (state) => {
			if (state.user) {
				user = state.user;
				firstName = state.user.first_name || '';
				lastName = state.user.last_name || '';
				email = state.user.email;
				signature = state.user.signature || '';
				
				// Charger la prévisualisation si une signature existe
				if (signature) {
					await loadSignaturePreview();
				}
			}
		});

		return unsubscribe;
	});

	async function handleSignatureUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		// Vérifier le type de fichier
		if (!file.type.startsWith('image/')) {
			error = 'Veuillez sélectionner un fichier image';
			setTimeout(() => error = '', 3000);
			return;
		}
		
		// Vérifier la taille (max 1MB)
		if (file.size > 1_000_000) {
			error = 'L\'image ne doit pas dépasser 1MB';
			setTimeout(() => error = '', 3000);
			return;
		}
		
		signatureFile = file;
		
		// Créer une preview
		const reader = new FileReader();
		reader.onload = (e) => {
			signaturePreview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	async function uploadSignatureImage() {
		if (!signatureFile || !user) return null;
		
		uploadingSignature = true;
		try {
			// Récupérer l'utilisateur authentifié
			const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
			if (authError || !authUser) throw new Error('Non authentifié');

			const path = `${authUser.id}/signature.png`; // chemin canonique

			const { error: uploadError } = await supabase.storage
				.from('signatures')
				.upload(path, signatureFile, {
					upsert: true,          // IMPORTANT: remplace l'ancienne
					cacheControl: '0',
					contentType: signatureFile.type || 'image/png'
				});

			if (uploadError) throw uploadError;

			return path; // Retourner le chemin, pas l'URL
		} catch (err) {
			console.error('Erreur upload:', err);
			throw err;
		} finally {
			uploadingSignature = false;
		}
	}

	async function removeSignature() {
		if (!user) return;
		
		try {
			// Récupérer l'utilisateur authentifié
			const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
			if (authError || !authUser) throw new Error('Non authentifié');

			const path = `${authUser.id}/signature.png`;
			
			// Supprimer du storage
			const { error: deleteError } = await supabase.storage
				.from('signatures')
				.remove([path]);
			
			if (deleteError) console.warn('Erreur suppression storage:', deleteError);

			// Nettoyer la colonne en base
			const { error: updateError } = await supabase
				.from('users')
				.update({ signature: null })
				.eq('auth_user_id', authUser.id);

			if (updateError) throw updateError;

			// Nettoyer les variables locales
			signatureFile = null;
			signaturePreview = '';
			signature = '';
			
			auth.checkUser();
		} catch (err) {
			console.error('Erreur suppression signature:', err);
			error = err instanceof Error ? err.message : 'Erreur lors de la suppression';
			setTimeout(() => error = '', 3000);
		}
	}

	async function updateProfile() {
		if (!user) return;

		loading = true;
		error = '';
		success = '';

		try {
			// Récupérer l'utilisateur authentifié
			const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
			if (authError || !authUser) throw new Error('Non authentifié');

			let signaturePath = signature;
			
			// Upload de la nouvelle signature si présente
			if (signatureFile) {
				const uploadedPath = await uploadSignatureImage();
				if (uploadedPath) {
					signaturePath = uploadedPath;
				}
			}

			const { data, error: updateError } = await supabase
				.from('users')
				.update({
					first_name: firstName,
					last_name: lastName,
					signature: signaturePath,
					updated_at: new Date().toISOString()
				})
				.eq('auth_user_id', authUser.id)
				.select()
				.single();

			if (updateError) throw updateError;

			// Mettre à jour les variables locales
			signature = signaturePath;
			signatureFile = null;
			
			auth.checkUser();
			success = 'Profil mis à jour avec succès';
			setTimeout(() => success = '', 3000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
		} finally {
			loading = false;
		}
	}



</script>

<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
	<div class="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8" style="padding-top: 2rem;">
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

		<div class="max-w-4xl mx-auto">
			<!-- Main Content Area -->
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

						<div class="space-y-3">
							<label class="block text-sm font-medium text-gray-700">
								<div class="flex items-center gap-2">
									<FileSignature class="h-4 w-4" />
									Signature électronique (image)
								</div>
							</label>
							
							<!-- Zone d'upload -->
							{#if !signaturePreview}
								<div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
									<Upload class="mx-auto h-12 w-12 text-gray-400 mb-3" />
									<div class="space-y-2">
										<p class="text-sm text-gray-600">Glissez-déposez votre signature ou</p>
										<label class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 cursor-pointer transition-colors">
											<Upload class="h-4 w-4 mr-2" />
											Choisir un fichier
											<input
												type="file"
												class="hidden"
												accept="image/*"
												onchange={handleSignatureUpload}
												disabled={loading || uploadingSignature}
											/>
										</label>
									</div>
									<p class="text-xs text-gray-500 mt-2">PNG, JPG, JPEG jusqu'à 1MB</p>
								</div>
							{:else}
								<!-- Prévisualisation de la signature -->
								<div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
									<div class="flex items-start justify-between mb-3">
										<p class="text-sm font-medium text-gray-700">Signature actuelle :</p>
										<button
											type="button"
											onclick={removeSignature}
											class="text-red-600 hover:text-red-800 transition-colors"
											disabled={loading}
										>
											<X class="h-4 w-4" />
										</button>
									</div>
									<div class="flex justify-center">
										<img 
											src={signaturePreview} 
											alt="Signature" 
											class="max-h-20 max-w-full object-contain border border-gray-200 rounded bg-white p-2"
										/>
									</div>
									{#if !signatureFile}
										<div class="mt-3 text-center">
											<label class="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded cursor-pointer hover:bg-gray-700 transition-colors">
												<Upload class="h-3 w-3 mr-1" />
												Changer
												<input
													type="file"
													class="hidden"
													accept="image/*"
													onchange={handleSignatureUpload}
													disabled={loading || uploadingSignature}
												/>
											</label>
										</div>
									{/if}
								</div>
							{/if}
							
							{#if uploadingSignature}
								<div class="flex items-center gap-2 text-sm text-blue-600">
									<svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Upload en cours...
								</div>
							{/if}
							
							<p class="text-xs text-gray-500">Cette signature apparaîtra sur les prescriptions et recommandations</p>
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