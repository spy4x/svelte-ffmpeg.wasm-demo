<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Loading } from '@components';
	import { AsyncOperationStatus, EntityOperationType, type ScenarioUpdate } from '@shared';
	import {AppBar, Avatar, toastStore} from '@skeletonlabs/skeleton';
	import { movies, scenarios } from '@stores';
	import { generateRandomString } from 'lucia-auth';
	import { onMount } from 'svelte';

	let id: string;
	let scenario: null | ScenarioUpdate;
	let creatingMovieId = '';

	onMount(() => {
		id = $page.params.id;
		const unsubscribe = scenarios.subscribe((s) => {
			const isListLoaded = s.list.status === AsyncOperationStatus.SUCCESS;
			const isUpdateInProgress =
				s.operations[id]?.type === EntityOperationType.UPDATE &&
				s.operations[id]?.status === AsyncOperationStatus.IN_PROGRESS;
			if (isListLoaded && !isUpdateInProgress) {
				const sc = s.getById(id);
				if (!sc) {
					toastStore.trigger({
						message: 'Scenario not found',
						background: 'variant-filled-warning'
					});
					goto('/scenarios');
				}
				scenario = structuredClone(sc) as unknown as ScenarioUpdate;
			}
		});
		return unsubscribe;
	});

	async function createMovie(scenarioId: string) {
		if (!scenario || !scenarioId) {
			return;
		}
		await scenarios.update(scenario);
		creatingMovieId = generateRandomString(15);
		await movies.createFromScenario(creatingMovieId, scenarioId);
		goto(`/movies/${creatingMovieId}`);
	}
	export const scrollEnd = () => {
		console.log("scrollTo", document.documentElement.scrollHeight)
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: "smooth"
		});
	};
</script>

<div class="container h-full mx-auto">
	{#if scenario}
		<AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
			<svelte:fragment slot="lead">
				<a class="hover:opacity-50" href="/scenarios">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8 mr-2 lg:h-12 lg:w-12 lg:mr-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
				</a>
			</svelte:fragment>
			<h1 class="h2">Edit scenario</h1>
			<svelte:fragment slot="trail">
				<button
					on:click|preventDefault={() => createMovie(scenario?.id || 'unexpected id')}
					type="button"
					class="btn variant-filled-primary text-white"
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
			</svelte:fragment>
		</AppBar>

		<form
			data-e2e="new-scenario-form"
			on:submit|preventDefault={() => void scenarios.update(scenario)}
			class="grid grid-cols-1 lg:grid-cols-3 gap-y-8 lg:gap-12"
		>
			<div class="card p-4 lg:p-8 flex flex-col gap-5">
				<label>
					<span>Title</span>
					<input bind:value={scenario.title} class="input" type="text" placeholder="Enter title" />
				</label>
				<label>
					<span>Description</span>
					<textarea
						bind:value={scenario.description}
						class="textarea"
						rows="5"
						placeholder="Enter description"></textarea>
				</label>

				<hr class="opacity-50" />

				<div class="flex flex-col gap-5">
					<p>Actors</p>
					{#each scenario.actors as actor, i}
						<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
							<div class="input-group-shim">#{i + 1}</div>
							<input bind:value={actor} type="text" placeholder="Enter actors" />
							<button
								on:click={() =>
									(scenario.actors = scenario.actors.filter((a, index) => index !== i))}
								type="button"
								class="variant-ghost-surface"
							>
								X
							</button>
						</div>
					{/each}
					<button
						on:click={() => (scenario.actors = [...scenario.actors, ''])}
						type="button"
						class="btn variant-ghost-surface">Add actor</button
					>
				</div>
			</div>

			<div class="col-span-2 space-y-6">
				<div class="card p-4 lg:p-8">
					<div class="flex flex-col gap-5">
						{#each scenario.scenes as scene, i}
							<div
								class="grid gap-2 {i % 2 !== 0
										? 'grid-cols-[1fr_auto]'
										: 'grid-cols-[auto_1fr]'}"
						>
							{#if i % 2 === 0}
								<Avatar
										initials={typeof scene.actor === 'number'
												? scenario?.actors[scene.actor]
												: '---No actor---'}
										width="w-8 lg:w-12"
								/>
							{/if}
							<div
									class="card p-4 space-y-2 {i % 2 !== 0
											? 'variant-soft-primary rounded-tr-none'
											: 'variant-soft rounded-tl-none'}"
							>
								<header class="flex justify-between items-center">
									<select bind:value={scene.actor} class="select">
										<option value={undefined}>---No actor---</option>
										{#each scenario.actors as actor, ai}
											<option value={ai}>{actor}</option>
										{/each}
									</select>
									<small class="opacity-50 srink-0 whitespace-nowrap pl-3"
									>Scene #{i + 1}</small
									>
								</header>
								<textarea
										bind:value={scene.description}
										class="textarea"
										placeholder="Enter description"></textarea>
							</div>
							{#if i % 2 !== 0}
								<Avatar
										initials={scene.actor === undefined
												? '---No actor---'
												: scenario?.actors[scene.actor]}
										width="w-8 lg:w-12"
								/>
							{/if}
						</div>
							<div class="text-center">
								<button
										on:click={() =>
													(scenario.scenes = scenario.scenes.filter((a, index) => index !== i))}
										type="button"
										class="btn variant-soft-error"
								>
									Delete scene
								</button>
							</div>
						{/each}
					</div>
				</div>

				<div class="card px-8 py-6 flex items-center">
					<button
						on:click={() =>
							(scenario.scenes = [
								...scenario.scenes,
								{ actor: scenario.actors[0], description: '' }
							],
							  scrollEnd())}
						type="button"
						class="btn variant-filled-secondary"
					>
						Add scene
					</button>

					<button class="ml-auto btn variant-filled-primary">
						{#if $scenarios.operations[scenario.id]?.type === EntityOperationType.UPDATE && $scenarios.operations[scenario.id]?.status === AsyncOperationStatus.IN_PROGRESS}
							<Loading />
							Saving...
						{:else}
							Save
						{/if}
					</button>
				</div>
			</div>
		</form>
	{:else if $scenarios.list.status === AsyncOperationStatus.IN_PROGRESS}
		<Loading />
	{:else if $scenarios.list.status === AsyncOperationStatus.ERROR}
		<p class="variant-filled-danger">
			Failed to load scenario with id <code>{id}</code>
		</p>
	{/if}
</div>
