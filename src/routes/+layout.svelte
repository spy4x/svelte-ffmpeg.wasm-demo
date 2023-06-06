<script lang="ts">
	// The ordering of these imports is critical to your app working properly
	import '@skeletonlabs/skeleton/themes/theme-modern.css';
	// If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	// Most of your app wide CSS should be put in this file
	import '../app.postcss';
	import { AppShell, AppBar, Toast } from '@skeletonlabs/skeleton';
	import { AuthOperation, auth } from '@stores';
	import { Loading } from '@components';
	import { goto } from '$app/navigation';
	import { AsyncOperationStatus } from '@shared';
	import { page } from '$app/stores'

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
					<strong class="text-xl uppercase tracking-wide">Roley</strong>
				</a>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				{#if $auth.user}
					<div class="flex items-center gap-8 text-sm">
						<a class="hover:underline underline-offset-2" class:underline={$page.url.pathname.startsWith("/scenarios")} href="/scenarios"> Scenarios </a>
						<a class="hover:underline underline-offset-2" class:underline={$page.url.pathname.startsWith("/movies")} href="/movies"> Movies </a>
						<button class="btn btn-sm variant-ghost-secondary" on:click={signOut}>
							{#if $auth.status === AsyncOperationStatus.IN_PROGRESS && ($auth.operation === AuthOperation.SIGN_OUT || $auth.operation === AuthOperation.FETCH_ME)}
								<Loading /> Processing...
							{:else}
								{#if $auth.user.photoURL}
									<img src={$auth.user.photoURL} class="w-6 h-6 rounded-full mr-2" alt="avatar" />
								{/if}
								Sign out
							{/if}
						</button>
					</div>
				{:else}
					<a class="btn btn-sm variant-ghost-primary" href="/auth"> Sign in / up </a>
				{/if}
			</svelte:fragment>
		</AppBar>
	</svelte:fragment>

	<!-- Page Route Content -->
	<div class="px-4 lg:px-6 pb-6 h-full">
		<slot />
	</div>
</AppShell>

<Toast />
