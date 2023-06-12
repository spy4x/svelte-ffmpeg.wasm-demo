<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton';
	import { AuthOperation, auth } from '@stores';
	import { toastStore } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';
	import { Debug } from '@components';

	function askForDeleteAccountConfirmation() {
		toastStore.trigger({
			message: 'Are you sure? All your data will be lost permanently.',
			background: 'variant-filled-error',
			action: {
				label: 'Delete account',
				response: deleteAccount
			}
		});
	}

	async function deleteAccount() {
		const isSuccess = await auth.delete();
		if (isSuccess) {
			toastStore.trigger({
				message: 'Account deleted',
				background: 'variant-filled-success',
				timeout: 10000
			});
			goto('/auth');
		} else {
			toastStore.trigger({
				message: 'Error deleting account',
				background: 'variant-filled-warning'
			});
		}
	}
</script>

{#if $auth.user}
	<div class="container h-full mx-auto flex flex-col items-center mt-4">
		<div class="card p-4 flex flex-col gap-4">
			<Avatar
				class="mx-auto"
				width="w-32"
				initials={$auth.user.firstName || $auth.user.email || '--'}
				src={$auth.user.photoURL ?? undefined}
				alt="User avatar"
			/>

			<h1 class="h3 text-center">
				{$auth.user.firstName || ''}
				{$auth.user.lastName || ''}
				{#if $auth.user.email}
					<p class="h4">{$auth.user.email}</p>
				{/if}
			</h1>

			<button
				on:click|preventDefault={askForDeleteAccountConfirmation}
				type="button"
				class="btn variant-filled-error">Delete account</button
			>

			{#if $auth.operation === AuthOperation.DELETE && $auth.error}
				<p class="variant-ghost-error p-4">
					{#if $auth.error.body.message}
						{$auth.error.body.message}
					{:else}
						<Debug data={$auth.error} />
					{/if}
				</p>
			{/if}
		</div>
	</div>
{/if}
