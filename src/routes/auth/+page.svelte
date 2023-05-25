<script>
	import { goto } from '$app/navigation';
	import { auth } from '@stores';

	let isLoading = false;

	async function signIn() {
		isLoading = true;
		await new Promise((r) => setTimeout(r, 2000)); // Simulate a slow network
		auth.signIn();
		goto('/proof-of-concept');
		isLoading = false;
	}
</script>

<form
	data-e2e="sign-in-providers-form"
	class="max-w-sm mx-auto bg-surface-700 p-6 rounded-lg"
	on:submit={signIn}
>
	<div data-e2e="email-and-password" class="flex flex-col gap-5">
		<label>
			<span>Email</span>
			<input class="input" type="email" placeholder="Enter email" />
		</label>
		<label>
			<span>Password</span>
			<input class="input" type="password" placeholder="Enter password" />
		</label>

		<button class="btn variant-filled-primary">
			{#if isLoading}
				<svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
					<circle
						class="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						stroke-width="4"
					/>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					/>
				</svg>
				<span>Loading...</span>
			{:else}
				Sign in
			{/if}
		</button>
	</div>

	<p class="my-4 text-center text-surface-400">Or sign in with</p>

	<div class="flex items-center justify-around">
		<button class="btn bg-gradient-to-br variant-gradient-warning-error"> Google </button>
		<button class="btn bg-gradient-to-br variant-gradient-tertiary-primary"> Facebook </button>
	</div>
</form>
