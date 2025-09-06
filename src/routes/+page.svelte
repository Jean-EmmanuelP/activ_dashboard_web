<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let isSignUp = $state(false);
	let error = $state('');
	let loading = $state(false);

	onMount(async () => {
		const user = await auth.checkUser();
		if (user) {
			goto('/dashboard');
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			if (isSignUp) {
				await auth.signUp(email, password, firstName, lastName);
			} else {
				await auth.signIn(email, password);
			}
			goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Une erreur est survenue';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8" style="background: linear-gradient(135deg, #60CDFF 0%, #012991 100%);">
	<div class="card w-full max-w-md" style="box-shadow: var(--shadow-xl); padding: 2.5rem;">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style="background-color: var(--color-primary-light);">
				<svg class="w-10 h-10" style="color: var(--color-primary);" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
				</svg>
			</div>
			<h2 class="lato-black text-2xl" style="color: var(--color-gray-900);">
				{isSignUp ? 'Créer un compte médecin' : 'Connexion médecin'}
			</h2>
			<p class="lato-regular text-sm mt-2" style="color: var(--color-gray-600);">
				{isSignUp ? 'Rejoignez notre plateforme médicale' : 'Accédez à votre espace sécurisé'}
			</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-5">
			{#if isSignUp}
				<div class="grid grid-cols-2 gap-4">
					<div class="form-group">
						<label for="firstName" class="form-label">Prénom</label>
						<input
							id="firstName"
							type="text"
							bind:value={firstName}
							required={isSignUp}
							disabled={loading}
							class="form-input"
							placeholder="Jean"
						/>
					</div>

					<div class="form-group">
						<label for="lastName" class="form-label">Nom</label>
						<input
							id="lastName"
							type="text"
							bind:value={lastName}
							required={isSignUp}
							disabled={loading}
							class="form-input"
							placeholder="Dupont"
						/>
					</div>
				</div>
			{/if}

			<div class="form-group">
				<label for="email" class="form-label">Adresse email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					disabled={loading}
					placeholder="medecin@example.com"
					class="form-input"
				/>
			</div>

			<div class="form-group">
				<label for="password" class="form-label">Mot de passe</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					disabled={loading}
					minlength="6"
					placeholder="••••••••"
					class="form-input"
				/>
				{#if !isSignUp}
					<p class="text-xs mt-2" style="color: var(--color-gray-500);">
						Minimum 6 caractères
					</p>
				{/if}
			</div>

			{#if error}
				<div class="alert alert-error">
					<svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
					</svg>
					{error}
				</div>
			{/if}

			<button type="submit" class="btn btn-primary w-full btn-lg" disabled={loading}>
				{#if loading}
					<div class="spinner" style="width: 20px; height: 20px;"></div>
					Chargement...
				{:else}
					{isSignUp ? "S'inscrire" : 'Se connecter'}
				{/if}
			</button>
		</form>

		<div class="mt-6 pt-6" style="border-top: 1px solid var(--color-gray-200);">
			<button
				type="button"
				onclick={() => {
					isSignUp = !isSignUp;
					error = '';
				}}
				class="w-full text-center lato-regular text-sm"
				style="color: var(--color-primary);"
				disabled={loading}
			>
				{isSignUp ? 'Déjà un compte? Se connecter' : "Pas de compte? S'inscrire"}
			</button>
		</div>
	</div>
</div>