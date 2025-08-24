<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper, Button } from 'flowbite-svelte';
	import { FileExportSolid, CogSolid } from 'flowbite-svelte-icons';
	
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

	async function handleLogout() {
		await auth.signOut();
		goto('/');
	}
</script>

{#if user}
	<div class="flex h-screen bg-gray-50">
		<Sidebar class="h-full">
			<SidebarWrapper>
				<SidebarGroup>
					<div class="mb-6 px-3">
						<h2 class="text-xl font-bold text-gray-900">Dashboard Médecin</h2>
						<div class="mt-2 text-sm text-gray-600">
							{user.first_name} {user.last_name}
							<br />
							{user.email}
						</div>
					</div>

					<SidebarItem label="Submissions" href="/dashboard">
						<FileExportSolid slot="icon" class="h-5 w-5" />
					</SidebarItem>

					<SidebarItem label="Settings" href="/dashboard/settings">
						<CogSolid slot="icon" class="h-5 w-5" />
					</SidebarItem>

					<div class="mt-auto px-3 pb-4">
						<Button onclick={handleLogout} color="red" size="sm" class="w-full">
							Déconnexion
						</Button>
					</div>
				</SidebarGroup>
			</SidebarWrapper>
		</Sidebar>

		<div class="flex-1 overflow-auto">
			{@render children?.()}
		</div>
	</div>
{/if}