<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { auth } from '$lib/stores/auth';
	import { Button, Card, Input, Label, Alert, Textarea } from 'flowbite-svelte';
	import { onMount } from 'svelte';

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
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto max-w-4xl p-6">
	<h1 class="mb-6 text-3xl font-bold">Paramètres du compte</h1>

	<Card>
		<h2 class="mb-4 text-xl font-semibold">Informations personnelles</h2>

		<form onsubmit={(e) => { e.preventDefault(); updateProfile(); }} class="space-y-4">
			<div class="grid gap-4 md:grid-cols-2">
				<div>
					<Label for="firstName">Prénom</Label>
					<Input
						id="firstName"
						type="text"
						bind:value={firstName}
						disabled={loading}
					/>
				</div>

				<div>
					<Label for="lastName">Nom</Label>
					<Input
						id="lastName"
						type="text"
						bind:value={lastName}
						disabled={loading}
					/>
				</div>
			</div>

			<div>
				<Label for="email">Email</Label>
				<Input
					id="email"
					type="email"
					value={email}
					disabled
					class="bg-gray-50"
				/>
				<p class="mt-1 text-sm text-gray-500">L'email ne peut pas être modifié</p>
			</div>

			<div>
				<Label for="signature">Signature électronique</Label>
				<Textarea
					id="signature"
					bind:value={signature}
					disabled={loading}
					rows="4"
					placeholder="Votre signature sera ajoutée aux documents générés"
				/>
			</div>

			{#if success}
				<Alert color="green">{success}</Alert>
			{/if}

			{#if error}
				<Alert color="red">{error}</Alert>
			{/if}

			<Button type="submit" disabled={loading}>
				{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
			</Button>
		</form>
	</Card>

	<Card class="mt-6">
		<h2 class="mb-4 text-xl font-semibold">Informations du compte</h2>
		
		<div class="space-y-2 text-sm">
			<p><span class="font-semibold">Rôle:</span> {user?.role || 'Médecin'}</p>
			<p><span class="font-semibold">Membre depuis:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : ''}</p>
			<p><span class="font-semibold">Dernière mise à jour:</span> {user?.updated_at ? new Date(user.updated_at).toLocaleDateString('fr-FR') : ''}</p>
		</div>
	</Card>
</div>