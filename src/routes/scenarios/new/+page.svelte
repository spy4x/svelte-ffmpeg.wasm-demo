<script lang="ts">
	import { ScenarioOperationType, scenarios } from '@stores';
	import { Loading } from '@components';
	import { AsyncOperationStatus, type ScenarioCreate } from '@shared';
	import { generateRandomString } from 'lucia-auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	const scenario: ScenarioCreate = {
		id: generateRandomString(15),
		title: '',
		description: '',
		attachments: [],
		actors: [],
		scenes: []
	};

	onMount(() => {
		const unsubscribe = scenarios.subscribe(($scenarios) => {
			const op = $scenarios.operations[scenario.id];
			if (
				op &&
				op.type === ScenarioOperationType.CREATE &&
				op.status === AsyncOperationStatus.SUCCESS
			) {
				goto(`/scenarios/${scenario.id}`);
			}
		});
		return unsubscribe;
	});
</script>

<div class="container h-full mx-auto flex justify-center items-center">
	<form
		data-e2e="new-scenario-form"
		on:submit|preventDefault={() => void scenarios.create(scenario)}
	>
		<div class="card">
			<header class="card-header">New scenario</header>
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
					{#if $scenarios.operations[scenario.id]?.type === ScenarioOperationType.CREATE && $scenarios.operations[scenario.id]?.status === AsyncOperationStatus.IN_PROGRESS}
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
