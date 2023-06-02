<script lang="ts">
	import { page } from '$app/stores';
	import { Loading, Debug } from '@components';
	import { scenarios } from '@stores';
	import { onMount } from 'svelte';
	import type { Scenario } from '@prisma/client';
	import { AsyncOperationStatus, EntityOperationType } from '@shared';
	import { toastStore } from '@skeletonlabs/skeleton';
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

<div class="container h-full mx-auto flex justify-center items-center">
	{#if scenario}
		<form
			data-e2e="new-scenario-form"
			on:submit|preventDefault={() => void scenarios.update(scenario)}
		>
			<div class="card">
				<header class="card-header">Edit scenario</header>
				<section class="p-4">
					<div class="flex flex-col gap-5">
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

						<hr class="opacity-50" />

						<!-- scenes, similar to Actors, but each scene is a multiselect of actors + a text field "description" -->
						<div class="flex flex-col gap-5">
							<p>Scenes:</p>
							{#each scenario.scenes as scene, i}
								<div>
									<div>#{i + 1}</div>
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
									<button
										on:click={() =>
											(scenario.scenes = scenario.scenes.filter((a, index) => index !== i))}
										type="button"
										class="btn variant-ghost-surface"
									>
										Delete scene
									</button>
								</div>
							{/each}
							<button
								on:click={() =>
									(scenario.scenes = [
										...scenario.scenes,
										{ actor: scenario.actors[0], description: '' }
									])}
								type="button"
								class="btn variant-ghost-surface"
							>
								Add scene
							</button>
						</div>
					</div>
				</section>
				<hr class="opacity-50" />
				<footer class="card-footer p-4 flex justify-end gap-3">
					<a href="/scenarios" class="btn variant-ghost-tertiary">Cancel</a>
					<button class="btn variant-filled-primary">
						{#if $scenarios.operations[scenario.id]?.type === EntityOperationType.UPDATE && $scenarios.operations[scenario.id]?.status === AsyncOperationStatus.IN_PROGRESS}
							<Loading />
							Updating...
						{:else}
							Update
						{/if}
					</button>
				</footer>
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
