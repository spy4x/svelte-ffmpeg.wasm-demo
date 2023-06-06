<script lang="ts">
	import { movies, scenarios } from '@stores';
	import { Loading } from '@components';
	import {
		AsyncOperationStatus,
		EntityOperationType,
		type MovieCreate,
		type ScenarioCreate
	} from '@shared';
	import { generateRandomString } from 'lucia-auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {AppBar, toastStore} from '@skeletonlabs/skeleton';

	const movie: MovieCreate = {
		id: generateRandomString(15),
		title: '',
		actors: [],
		clips: [],
		durationSec: 0
	};

	onMount(() => {
		const unsubscribe = movies.subscribe(($movies) => {
			const op = $movies.operations[movie.id];
			if (
				op &&
				op.type === EntityOperationType.CREATE &&
				op.status === AsyncOperationStatus.SUCCESS
			) {
				goto(`/movies/${movie.id}`);
			}
		});
		return unsubscribe;
	});

	function create() {
		if (movie.scenarioId) {
			const scenario = $scenarios.list.data.find((s) => s.id === movie.scenarioId);
			if (!scenario) {
				toastStore.trigger({
					message: `Scenario with id ${movie.scenarioId} not found`,
					background: 'variant-filled-error'
				});
				return;
			}
			movie.actors = scenario.actors;
			movie.clips = (scenario.scenes as ScenarioCreate['scenes']).map((s) => ({
				description: s.description,
				actor: s.actor
			}));
		}
		movies.create(movie);
	}
</script>

<div class="container h-full mx-auto flex flex-col items-center">
	<AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
		<svelte:fragment slot="lead">
			<a class="hover:opacity-50" href="/movies">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-2 lg:h-12 lg:w-12 lg:mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
			</a>
		</svelte:fragment>
		<h1 class="h2">New movie</h1>
	</AppBar>
	<form data-e2e="new-movie-form" on:submit|preventDefault={create}>
		<div class="card">
			<section class="p-4">
				<div class="flex flex-col gap-5">
					<label>
						<span>Title</span>
						<input bind:value={movie.title} class="input" type="text" placeholder="Enter title" />
					</label>
					<label>
						<span>Scenario</span>
						<select bind:value={movie.scenarioId} class="select" placeholder="Select movie">
							<option value={undefined}>---Blank---</option>
							{#each $scenarios.list.data as scenario}
								<option value={scenario.id}>{scenario.title}</option>
							{/each}
						</select>
					</label>
				</div>
			</section>
			<footer class="card-footer flex justify-end gap-3">
				<a href="/movies" class="btn variant-ghost-tertiary">Cancel</a>
				<button class="btn variant-filled-primary">
					{#if $movies.operations[movie.id]?.type === EntityOperationType.CREATE && $movies.operations[movie.id]?.status === AsyncOperationStatus.IN_PROGRESS}
						<Loading />
						Creating...
					{:else}
						Create
					{/if}
				</button>
			</footer>
		</div>
	</form>
</div>
