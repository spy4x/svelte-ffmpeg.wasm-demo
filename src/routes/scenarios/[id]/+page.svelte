<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Debug, Loading } from '@components';
	import { Role } from '@prisma/client';
	import { AsyncOperationStatus, EntityOperationType, type ScenarioUpdate } from '@shared';
	import { AppBar, Avatar, FileButton, toastStore } from '@skeletonlabs/skeleton';
	import { auth, movies, scenarios } from '@stores';
	import { generateRandomString } from 'lucia-auth';
	import { onMount } from 'svelte';

	let id: string;
	let scenario: ScenarioUpdate;
	let creatingMovieId = '';
	let addSceneButton: HTMLButtonElement;

	onMount(() => {
		id = $page.params.id;
		const unsubscribe = scenarios.subscribe((s) => {
			const isListLoaded = s.list.status === AsyncOperationStatus.SUCCESS;
			const isIdleOrUpdated =
				s.operations[id]?.type === EntityOperationType.UPDATE
					? s.operations[id]?.status === AsyncOperationStatus.IDLE ||
					  s.operations[id]?.status === AsyncOperationStatus.SUCCESS
					: true;
			if (isListLoaded && isIdleOrUpdated) {
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

	function addScene() {
		scenario.scenes = [
			...scenario.scenes,
			{ actor: scenario.actors[0], description: 'Directions: \n\n\nDialogue: \n\n\n' }
		];
		// wait a moment before DOM is updated with new scene
		setTimeout(() => addSceneButton.scrollIntoView({ behavior: 'smooth' }));
	}

	function deleteScene(index: number): void {
		scenario.scenes = scenario.scenes.filter((a, i) => index !== i);
	}

	function handleAttachments(e: Event): void {
		const target = e.target as HTMLInputElement;
		if (!target.files) {
			return;
		}
		const files = Array.from(target.files).map((file) => ({
			id: generateRandomString(15),
			title: file.name,
			url: null,
			file
		}));
		scenario.attachments = [...scenario.attachments, ...files];
		target.value = '';
	}
</script>

<div class="container h-full mx-auto">
	{#if scenario}
		<AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
			<svelte:fragment slot="lead">
				<a class="hover:opacity-50" href="/scenarios">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
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
				{#if $auth.user?.role === Role.ADMIN}
					<label class="flex items-center space-x-2 text-xl">
						<input
							class="checkbox w-6 h-6"
							type="checkbox"
							checked={scenario.access === 'SHARED'}
							on:change={(e) => (scenario.access = e.target.checked ? 'SHARED' : 'PRIVATE')}
						/>
						<p>Is public?</p>
					</label>
					{#if scenario.access === 'SHARED'}
						<p class="text-success-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6 inline-block"
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
							Users can see and use this scenario for their movies.
						</p>
					{:else}
						<p class="text-warning-500">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 inline-block"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
									clip-rule="evenodd"
								/>
							</svg>
							Only you can see this scenario. You can work on this draft and publish it later.
						</p>
					{/if}
				{/if}
				<label>
					<span>Title</span>
					<input bind:value={scenario.title} class="input" type="text" placeholder="Enter title" />
				</label>
				<label>
					<span>Description</span>
					<textarea
						bind:value={scenario.description}
						class="textarea min-h-[75px] block"
						rows="4"
						placeholder="Enter description"></textarea>
				</label>

				<!-- svelte-ignore a11y-label-has-associated-control -->
				<label>
					<span>Preview</span>
					{#if scenario.previewFile || scenario.previewURL}
						<img
							class="w-full my-3 rounded-lg"
							src={scenario.previewFile
								? URL.createObjectURL(scenario.previewFile)
								: scenario.previewURL}
							alt="preview"
						/>
					{/if}
					<FileButton
						name="previewFile"
						accept="image/png,image/jpeg,image/svg+xml"
						button="variant-ghost-surface w-full"
						on:change={(e) => (scenario.previewFile = e.target.files[0])}
					>
						{#if scenario.previewURL || scenario.previewFile}
							Change Image
						{:else}
							Upload Image
						{/if}
					</FileButton>
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

				<hr class="opacity-50" />

				<div class="flex flex-col gap-5">
					<p>Attachments</p>
					<div>
						<FileButton
							button="variant-ghost-surface w-full"
							multiple
							name="attachments"
							on:change={handleAttachments}
						>
							Upload attachments
						</FileButton>
						<p class="opacity-50 text-xs pt-2 text-center">Up to 10 attachments (pdf, png, etc)</p>
					</div>

					{#if scenario.attachments.length}
						<ol class="list flex flex-col gap-2" id="uploaded-list">
						{#each scenario.attachments as attachment, index}
							<li class="flex justify-between gap-2">
								<span>
									{index + 1}. {attachment.title}
								</span>

								<span class="flex">
									{#if attachment.url}
										<!-- download attachment button (a href) -->
										<a
											download={attachment.title}
											href={attachment.url}
											class="ml-auto shrink-0 opacity-80 hover:opacity-100"
											title="Download attachment"
										>
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
													d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
												/>
											</svg>
										</a>
									{/if}

									<button
										on:click={() =>
											(scenario.attachments = scenario.attachments.filter((a, i) => i !== index))}
										type="button"
										class="ml-auto shrink-0 opacity-80 hover:opacity-100"
										title="Delete attachment"
									>
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
									</button>
								</span>
							</li>
						{/each}
					</ol>
					{/if}
				</div>
			</div>

			<div class="col-span-2 space-y-6">
				<div class="card p-4 lg:p-8">
					<div class="flex flex-col gap-5">
						{#each scenario.scenes as scene, i}
							<div
								class="grid gap-2 {i % 2 !== 0 ? 'grid-cols-[1fr_auto]' : 'grid-cols-[auto_1fr]'}"
							>
								{#if i % 2 === 0}
									<div class="flex flex-col gap-3 items-center">
										<Avatar
											initials={typeof scene.actor === 'number'
												? scenario?.actors[scene.actor]
												: '---No actor---'}
											width="w-9 lg:w-12"
										/>
										<button
											on:click={() => deleteScene(i)}
											type="button"
											class="btn-icon variant-soft-surface w-9 lg:w-12"
											title="Delete scene"
										>
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
										</button>
									</div>
								{/if}
								<div
									class="card variant-soft p-4 space-y-2 {i % 2
										? 'rounded-tr-none'
										: 'rounded-tl-none'}"
								>
									<header class="flex justify-between items-center">
										<select bind:value={scene.actor} class="select">
											<option value={undefined}>---No actor---</option>
											{#each scenario.actors as actor, ai}
												<option value={ai}>{actor}</option>
											{/each}
										</select>
										<small class="opacity-50 srink-0 whitespace-nowrap pl-3">Scene #{i + 1}</small>
									</header>
									<textarea
										bind:value={scene.description}
										class="textarea min-h-[75px] block"
										rows="5"
										placeholder="Enter description"
									/>
								</div>
								{#if i % 2 !== 0}
									<div class="flex flex-col gap-3 items-center">
										<Avatar
											initials={typeof scene.actor === 'number'
												? scenario?.actors[scene.actor]
												: '---No actor---'}
											width="w-9 lg:w-12"
										/>
										<button
											on:click={() => deleteScene(i)}
											type="button"
											class="btn-icon variant-soft-surface w-9 lg:w-12"
											title="Delete scene"
										>
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
										</button>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

				<div class="card p-4 lg:p-8 flex items-center justify-between">
					<button
						on:click={addScene}
						bind:this={addSceneButton}
						type="button"
						class="btn variant-filled-secondary"
					>
						<span class="text-white">Add scene</span>
					</button>

					<span>Scenes: {scenario.scenes.length}</span>

					<button class="btn variant-filled-primary">
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
