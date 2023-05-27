<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-skeleton.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';
	import { AppShell, AppBar, Toast } from '@skeletonlabs/skeleton';
	import { AuthStatus, auth } from '@stores';
	import Loading from './loading.svelte';
	import { goto } from '$app/navigation';

	async function signOut() {
		await auth.signOut();
		goto('/');
	}
</script>

<!-- App Shell -->
<AppShell slotSidebarLeft="bg-surface-500/5 w-56 p-4">
	<svelte:fragment slot="header">
		<!-- App Bar -->
		<AppBar>
			<svelte:fragment slot="lead">
				<a href="/">
					<strong class="text-xl uppercase">Roley</strong>
				</a>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				{#if $auth.user}
					<a class="btn btn-sm variant-ghost-primary" href="/proof-of-concept">
						Proof of concept
					</a>
					<button class="btn btn-sm variant-ghost-secondary" on:click={signOut}>
						{#if $auth.status === AuthStatus.IN_PROGRESS}
							<Loading /> Processing...
						{:else}
							{$auth.user.email}, Sign out
						{/if}
					</button>
				{:else}
					<a class="btn btn-sm variant-ghost-primary" href="/auth"> Sign in / up </a>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>

	<!-- Page Route Content -->
	<div class="p-6">
		<slot />
	</div>
</AppShell>

<Toast />
