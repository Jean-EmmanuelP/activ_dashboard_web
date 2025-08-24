<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { Button, Card, Input, Label, Alert } from 'flowbite-svelte';

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

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12 sm:px-6 lg:px-8">
	<Card class="w-full max-w-md shadow-xl">
		<h2 class="mb-6 text-center text-2xl font-bold text-gray-900">
			{isSignUp ? 'Créer un compte médecin' : 'Connexion médecin'}
		</h2>

		<form onsubmit={handleSubmit} class="space-y-4">
			{#if isSignUp}
				<div>
					<Label for="firstName">Prénom</Label>
					<Input
						id="firstName"
						type="text"
						bind:value={firstName}
						required={isSignUp}
						disabled={loading}
					/>
				</div>

				<div>
					<Label for="lastName">Nom</Label>
					<Input
						id="lastName"
						type="text"
						bind:value={lastName}
						required={isSignUp}
						disabled={loading}
					/>
				</div>
			{/if}

			<div>
				<Label for="email">Email</Label>
				<Input
					id="email"
					type="email"
					bind:value={email}
					required
					disabled={loading}
					placeholder="medecin@example.com"
				/>
			</div>

			<div>
				<Label for="password">Mot de passe</Label>
				<Input
					id="password"
					type="password"
					bind:value={password}
					required
					disabled={loading}
					minlength="6"
				/>
			</div>

			{#if error}
				<Alert color="red">{error}</Alert>
			{/if}

			<Button type="submit" class="w-full py-3" disabled={loading} color="blue">
				{loading ? 'Chargement...' : isSignUp ? "S'inscrire" : 'Se connecter'}
			</Button>
		</form>

		<div class="mt-4 text-center">
			<button
				type="button"
				onclick={() => {
					isSignUp = !isSignUp;
					error = '';
				}}
				class="text-sm text-blue-600 hover:text-blue-500"
				disabled={loading}
			>
				{isSignUp ? 'Déjà un compte? Se connecter' : "Pas de compte? S'inscrire"}
			</button>
		</div>
	</Card>
</div>
