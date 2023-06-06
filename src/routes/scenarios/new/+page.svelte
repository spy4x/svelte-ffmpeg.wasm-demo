<script lang="ts">
	import { scenarios } from '@stores';
	import { Loading } from '@components';
	import { AsyncOperationStatus, EntityOperationType, type ScenarioCreate } from '@shared';
	import { generateRandomString } from 'lucia-auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {AppBar} from "@skeletonlabs/skeleton";

	const scenario: ScenarioCreate = {
		id: generateRandomString(15),
		title: '',
		description: '',
		attachments: [],
		actors: [],
		scenes: [{
			description: ''
		}]
	};

	onMount(() => {
		const unsubscribe = scenarios.subscribe(($scenarios) => {
			const op = $scenarios.operations[scenario.id];
			if (
				op &&
				op.type === EntityOperationType.CREATE &&
				op.status === AsyncOperationStatus.SUCCESS
			) {
				goto(`/scenarios/${scenario.id}`);
			}
		});
		return unsubscribe;
	});
</script>

<div class="container h-full mx-auto flex flex-col items-center">
	<AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
		<svelte:fragment slot="lead">
			<a class="hover:opacity-50" href="/scenarios">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-2 lg:h-12 lg:w-12 lg:mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
			</a>
		</svelte:fragment>
		<h1 class="h2">New scenario</h1>
	</AppBar>
	<form
		data-e2e="new-scenario-form"
		on:submit|preventDefault={() => void scenarios.create(scenario)}
	>
		<div class="card">
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
				</div>
			</section>
			<footer class="card-footer flex justify-end gap-3">
				<a href="/scenarios" class="btn variant-ghost-tertiary">Cancel</a>
				<button class="btn variant-filled-primary">
					{#if $scenarios.operations[scenario.id]?.type === EntityOperationType.CREATE && $scenarios.operations[scenario.id]?.status === AsyncOperationStatus.IN_PROGRESS}
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
