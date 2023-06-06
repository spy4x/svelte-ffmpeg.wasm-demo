<script lang="ts">
	import { page } from '$app/stores';
	import { Loading, Debug } from '@components';
	import {movies, scenarios} from '@stores';
	import { onMount } from 'svelte';
	import type { Scenario } from '@prisma/client';
	import { AsyncOperationStatus, EntityOperationType } from '@shared';
	import {AppBar, Step, Stepper, toastStore} from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';

	let id: string;
	let scenario: null | Scenario;
	onMount(() => {
		id = $page.params.id;
		const unsubscribe = scenarios.subscribe((s) => {
			const isListLoaded = s.list.status === AsyncOperationStatus.SUCCESS;
			const isUpdateInProgress =
				s.operations[id]?.type === EntityOperationType.UPDATE &&
				s.operations[id]?.status === AsyncOperationStatus.IN_PROGRESS;
			if (s.list.status === AsyncOperationStatus.SUCCESS && !isUpdateInProgress) {
				const sc = s.getById(id);
				if (!sc) {
					toastStore.trigger({
						message: 'Scenario not found',
						background: 'variant-filled-warning'
					});
					goto('/scenarios');
				}
				scenario = structuredClone(sc);
			}
		});
		return unsubscribe;
	});
</script>

<div class="container h-full mx-auto">
	{#if scenario}

		<AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
			<svelte:fragment slot="lead">
				<a class="hover:opacity-50" href="/scenarios">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-2 lg:h-12 lg:w-12 lg:mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
				</a>
			</svelte:fragment>
			<h1 class="h2">Edit scenario</h1>
			<svelte:fragment slot="trail">
				<button type="button" class="btn variant-filled-primary text-white">Create movie</button>
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
					<input
							bind:value={scenario.title}
							class="input"
							type="text"
							placeholder="Enter title"
					/>
				</label>
				<label>
					<span>Description</span>
					<textarea
							bind:value={scenario.description}
							class="textarea"
							rows="5"
							placeholder="Enter description"
					/>
				</label>

				<hr class="opacity-50" />

				<div class="flex flex-col gap-5">
					<p>Actors</p>
					{#each scenario.actors as actor, i}
						<label>
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
						</label>
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
					<Stepper stepTerm="Scene">
						{#each scenario.scenes as scene, i}
							<Step>
								<svelte:fragment slot="header">Scene #{i+1}</svelte:fragment>
								<div class="my-8 lg:my-12 flex flex-col gap-4">
									<label>
										<span>Actor:</span>
										<select bind:value={scene.actor} class="select" placeholder="Select actor(s)">
											<option value={undefined}>---No actor---</option>
											{#each scenario.actors as actor, ai}
												<option value={ai}>{actor}</option>
											{/each}
										</select>
									</label>
									<label>
										<span>Description:</span>
										<textarea
												bind:value={scene.description}
												class="textarea"
												placeholder="Enter description"
										/>
									</label>

									<div class="text-center">
										<button
												on:click={() =>
										(scenario.scenes = scenario.scenes.filter((a, index) => index !== i))}
												type="button"
												class="btn variant-filled-error"
										>
											Delete scene
										</button>
									</div>
								</div>
							</Step>
						{/each}
					</Stepper>
				</div>


				<div class="card px-8 py-6 flex items-center">
					<button
							on:click={() =>
					(scenario.scenes = [
						...scenario.scenes,
						{ actor: scenario.actors[0], description: '' }
					])}
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

			<!-- <Debug data={scenario} />
			<Debug data={$scenarios} /> -->
		</form>
	{:else if $scenarios.list.status === AsyncOperationStatus.IN_PROGRESS}
		<Loading />
	{:else if $scenarios.list.status === AsyncOperationStatus.ERROR}
		<p class="variant-filled-danger">
			Failed to load scenario with id <code>{id}</code>
		</p>
	{/if}
</div>
