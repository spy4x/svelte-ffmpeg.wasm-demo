<script>
	import { goto } from '$app/navigation';
	import { AuthStatus, auth } from '@stores';
	import { onMount } from 'svelte';
	import Loading from '../loading.svelte';

	let email = '';
	let password = '';

	async function signIn() {
		const state = await auth.signIn(email, password);
		if (state.user) {
			goto('/proof-of-concept');
		}
	}

	async function signUp() {
		const state = await auth.signUp(email, password);
		if (state.user) {
			goto('/proof-of-concept');
		}
	}

	onMount(() => {
		// subscribe to state and redirect on success as well as remove the subscription
		const unsubscribe = auth.subscribe((state) => {
			if (state.user) {
				goto('/proof-of-concept');
				setTimeout(() => unsubscribe());
			}
		});
	});
</script>

<form data-e2e="sign-in-providers-form" class="max-w-sm mx-auto bg-surface-700 p-6 rounded-lg">
	<div data-e2e="email-and-password" class="flex flex-col gap-5">
		<label>
			<span>Email</span>
			<input bind:value={email} class="input" type="email" placeholder="Enter email" />
			{#if $auth.error?.email}
				<div class="text-red-500">{$auth.error.email._errors}</div>
			{/if}
		</label>
		<label>
			<span>Password</span>
			<input bind:value={password} class="input" type="password" placeholder="Enter password" />
			{#if $auth.error?.password}
				<div class="text-red-500">{$auth.error.password._errors}</div>
			{/if}
		</label>

		{#if $auth.status === AuthStatus.IN_PROGRESS}
			<button type="button" class="btn variant-ghost-surface">
				<Loading />
				<span>Loading...</span>
			</button>
		{:else}
			<div class="flex gap-3">
				<button on:click={signIn} type="button" class="btn variant-filled-primary grow">
					Sign in
				</button>
				<button on:click={signUp} type="button" class="btn variant-filled-secondary grow">
					Sign up
				</button>
			</div>
			{#if $auth.status === AuthStatus.ERROR}
				<p class="text-center variant-ghost-error p-4">
					{$auth.error?.message || 'Operation failed'}
				</p>
			{/if}
		{/if}
	</div>

	<p class="my-4 text-center text-surface-400">Or sign in with</p>

	<div class="flex items-center justify-around">
		<a href={auth.signInWithGoogleURL} class="btn bg-gradient-to-br variant-gradient-warning-error">
			Google
		</a>
		<a
			href={auth.signInWithFacebookURL}
			class="btn bg-gradient-to-br variant-gradient-tertiary-primary"
		>
			Facebook
		</a>
	</div>
</form>
