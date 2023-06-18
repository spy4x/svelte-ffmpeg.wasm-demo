<script lang="ts">
	import { goto } from '$app/navigation';
	import { Loading } from '@components';
	import { AsyncOperationStatus, EntityOperationType } from '@shared';
	import { AppBar, Avatar } from '@skeletonlabs/skeleton';
	import { auth, movies, scenarios, type ListViewState } from '@stores';
	import { format } from 'date-fns';
	import { generateRandomString } from 'lucia-auth';

	export let state: ListViewState;
	export let access: 'PRIVATE' | 'SHARED';

	let creatingMovieId = '';
	async function createMovie(scenarioId: string) {
		creatingMovieId = generateRandomString(15);
		await movies.createFromScenario(creatingMovieId, scenarioId);
		goto(`/movies/${creatingMovieId}`);
	}
</script>

{#if state.status === AsyncOperationStatus.IDLE || state.status === AsyncOperationStatus.IN_PROGRESS}
	<div class="flex justify-center items-center h-full"><Loading /></div>
{:else if state.status === AsyncOperationStatus.ERROR}
	<div class="text-center py-10 sm:px-4">
		<h1 class="h2">Failed to load scenarios</h1>
		<p class="text-lg">Please try again later</p>
	</div>
{:else if state.status === AsyncOperationStatus.SUCCESS}
	{#if state.data.length === 0}
		<div class="text-center py-10 sm:px-4">
			<h1 class="h2 mb-6">You haven’t created a scenario yet.</h1>
			{#if access === 'PRIVATE'}
				<a href="/scenarios/new" class="btn variant-filled-primary">Create</a>
			{/if}
		</div>
	{:else}
		<AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
			<svelte:fragment slot="lead">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-8 w-8"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</svelte:fragment>
			<h1 class="h2">
				{#if access === 'SHARED'}
					Shared
				{:else if $auth.user?.role === 'ADMIN'}
					Global
				{:else}
					My
				{/if}
				Scenarios
			</h1>
			<svelte:fragment slot="trail">
				{#if access === 'PRIVATE'}
					<a href="/scenarios/new" class="ml-auto btn variant-filled-primary">Create</a>
				{/if}
			</svelte:fragment>
		</AppBar>

		<div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each state.data as scenario}
				<a href={`/scenarios/${scenario.id}`} class="block">
					<div class="card">
						<header>
							{#if scenario.previewURL}
								<div
									class="rounded-t-3xl w-full h-48 bg-center bg-no-repeat bg-cover"
									style="background-image: url('{scenario.previewURL}')"
								/>
							{:else}
								<div class="flex items-center justify-center h-48 rounded-t-3xl bg-black/25">
									<span class="opacity-60">No preview</span>
								</div>
							{/if}
						</header>
						<div class="flex gap-1 p-4 space-y-4">
							<div class="truncate">
								<h3 class="h3">{scenario.title}</h3>
								<div class="text-xs">
									<span class="opacity-60">Updated at:</span>
									<span>
										{format(new Date(scenario.updatedAt), 'dd MMM h:mm aaa')}
									</span>
								</div>
							</div>
						</div>
						{#if $auth.user?.role === 'ADMIN'}
							<span class="chip variant-soft flex items-center gap-2 font-bold text-lg">
								{#if scenario.access === 'SHARED'}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-6 w-6 text-success-500"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5 text-warning-500"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fill-rule="evenodd"
											d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
								{scenario.access}
							</span>
						{/if}
						<section class="px-4">
							<div data-e2e="actors" class="py-4 px-0.5 isolate flex -space-x-2 overflow-hidden">
								{#if !scenario.actors.length}
									<span class="chip rounded-full p-0 pr-4 variant-soft">
										<span
											class="w-10 h-10 badge-icon bg-gradient-to-br variant-gradient-secondary-tertiary"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												class="text-white h-6 w-6"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
												stroke-width="2"
											>
												<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
											</svg>
										</span>

										<span class="ml-2">
											{#if access === 'PRIVATE'}
												Add actor
											{:else}
												No actors
											{/if}
										</span>
									</span>
								{/if}
								{#each scenario.actors as actor}
									{#if actor.length > 0}
										<Avatar
											width="w-10"
											initials={actor}
											background="bg-gradient-to-br variant-gradient-secondary-tertiary"
											class="ring-2 ring-white"
										/>
									{/if}
								{/each}
							</div>
						</section>
						<hr class="opacity-50" />
						<footer class="card-footer flex gap-2 p-4">
							{#if access === 'PRIVATE'}
								<button
									class="btn variant-soft-surface"
									on:click|stopPropagation|preventDefault={() => void scenarios.delete(scenario.id)}
								>
									{#if $scenarios.operations[scenario.id]?.type === EntityOperationType.DELETE && $scenarios.operations[scenario.id]?.status === AsyncOperationStatus.IN_PROGRESS}
										<Loading />
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-6 w-6"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									{/if}
								</button>
							{/if}

							{#if access === 'SHARED'}
								<button type="button" class="ml-auto btn variant-filled-secondary"> View </button>
							{:else}
								<button type="button" class="ml-auto btn variant-filled-warning"> Edit </button>
							{/if}
							<button
								on:click|preventDefault={() => createMovie(scenario.id)}
								type="button"
								class="btn variant-filled-primary"
							>
								{#if $movies.operations[creatingMovieId]?.type === EntityOperationType.CREATE && $movies.operations[creatingMovieId]?.status === AsyncOperationStatus.IN_PROGRESS}
									<Loading />
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-5 w-5 mr-1"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										stroke-width="2"
									>
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
									</svg>
									Movie
								{/if}
							</button>
						</footer>
					</div>
				</a>
			{/each}
		</div>
	{/if}
{/if}
