<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	
	let { children } = $props();
	let user = $state<any>(null);

	onMount(async () => {
		auth.subscribe((state) => {
			user = state.user;
			if (!state.user && !state.loading) {
				goto('/');
			}
		});

		await auth.checkUser();
	});
</script>

{#if user}
	<div class="flex h-screen bg-gray-50">
		<Sidebar />

		<!-- Main Content Area -->
		<main class="flex-1 overflow-auto">
			<div class="h-full">
				{@render children?.()}
			</div>
		</main>
	</div>
{/if}

