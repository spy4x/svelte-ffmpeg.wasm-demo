<script lang="ts">
	import { goto } from '$app/navigation';
	import { AuthOperation, auth } from '@stores';
	import { onMount } from 'svelte';
	import { Loading } from '@components';
	import { AsyncOperationStatus } from '@shared';

	let email = '';
	let password = '';

	function signIn() {
		void auth.signIn(email, password);
	}

	function signUp() {
		void auth.signUp(email, password);
	}

	onMount(() => {
		// subscribe to state and redirect on success as well as remove the subscription
		const unsubscribe = auth.subscribe((state) => {
			if (state.user) {
				goto('/scenarios');
				setTimeout(() => unsubscribe());
			}
		});
	});
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<form
		data-e2e="sign-in-providers-form"
		class="max-w-sm mx-auto bg-surface-700 p-6 rounded-lg"
		on:submit|preventDefault={signUp}
	>
		<div data-e2e="email-and-password" class="flex flex-col gap-5">
			<label>
				<span>Email</span>
				<!-- add onKeyUp Enter - execute signUp -->
				<input
					on:keyup={(e) => e.key === 'Enter' && signUp()}
					bind:value={email}
					class="input"
					type="email"
					placeholder="Enter email"
				/>
				{#if $auth.error?.body?.email}
					<div class="text-red-500">{$auth.error.body?.email._errors}</div>
				{/if}
			</label>
			<label>
				<span>Password</span>
				<input
					on:keyup={(e) => e.key === 'Enter' && signUp()}
					bind:value={password}
					class="input"
					type="password"
					placeholder="Enter password"
				/>
				{#if $auth.error?.body?.password}
					<div class="text-red-500">{$auth.error.body?.password._errors}</div>
				{/if}
			</label>

			<!-- Grid of two 50% columns -->
			<div class="grid grid-cols-2 gap-3">
				<button on:click={signIn} type="button" class="btn variant-ringed-primary">
					{#if $auth.status === AsyncOperationStatus.IN_PROGRESS && $auth.operation === AuthOperation.SIGN_IN}
						<Loading />
						<span>Signing in...</span>
					{:else}
						Sign in
					{/if}
				</button>
				<button on:click={signUp} type="button" class="btn variant-filled-primary">
					{#if $auth.status === AsyncOperationStatus.IN_PROGRESS && $auth.operation === AuthOperation.SIGN_UP}
						<Loading />
						<span>Signing up...</span>
					{:else}
						Sign up
					{/if}
				</button>
			</div>
			{#if $auth.status === AsyncOperationStatus.ERROR}
				<p class="text-center variant-ghost-error p-4">
					{$auth.error?.body?.message || 'Operation failed'}
				</p>
			{/if}
		</div>

		<p class="my-4 text-center text-surface-400">Or continue with</p>

		<div class="grid grid-cols-2 gap-3">
			<a
				on:click={() => auth.oauth(AuthOperation.GOOGLE)}
				href={auth.signInWithGoogleURL}
				class="btn variant-filled-surface"
			>
				{#if $auth.status === AsyncOperationStatus.IN_PROGRESS && $auth.operation === AuthOperation.GOOGLE}
					<Loading />
				{:else}
					<img src="/img/google.svg" class="w-6 h-6 mr-1" alt="Google logo" />
				{/if}
				Google
			</a>
			<a
				on:click={() => auth.oauth(AuthOperation.FACEBOOK)}
				href={auth.signInWithFacebookURL}
				class="btn variant-filled-surface"
			>
				{#if $auth.status === AsyncOperationStatus.IN_PROGRESS && $auth.operation === AuthOperation.FACEBOOK}
					<Loading />
				{:else}
					<img src="/img/facebook.svg" class="w-6 h-6 mr-1" alt="Facebook logo" />
				{/if}
				Facebook
			</a>
		</div>
	</form>
</div>
