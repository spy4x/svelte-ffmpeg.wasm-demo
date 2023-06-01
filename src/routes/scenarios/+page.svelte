<script lang="ts">
	import { ScenarioOperationType, scenarios } from '@stores';
	import { Loading, Debug } from '@components';
	import { AsyncOperationStatus } from '@shared';
	import { format } from 'date-fns';
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center">
	{#if $scenarios.list.status === AsyncOperationStatus.IDLE || $scenarios.list.status === AsyncOperationStatus.IN_PROGRESS}
		<Loading />
	{:else if $scenarios.list.status === AsyncOperationStatus.ERROR}
		<div class="text-center">
			<h1 class="text-3xl font-bold">Failed to load scenarios</h1>
			<p class="text-lg">Please try again later</p>
		</div>
	{:else if $scenarios.list.status === AsyncOperationStatus.SUCCESS}
		{#if $scenarios.list.data.length === 0}
			<div class="text-center">
				<h1 class="text-3xl font-bold mb-3">No scenarios found</h1>
				<a href="/scenarios/new" class="btn variant-filled-primary">Create</a>
			</div>
		{:else}
			<div class="flex justify-end w-full">
				<a href="/scenarios/new" class="btn variant-filled-primary">Create</a>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each $scenarios.list.data as scenario}
					<a href={`/scenarios/${scenario.id}`} class="block">
						<div class="card">
							<header class="card-header">
								<span class="card-header-title underline">
									{scenario.title}
								</span>
							</header>
							<section class="p-4">
								<div data-e2e="actors" class="flex gap-1">
									{#each scenario.actors as actor}
										<span class="chip variant-soft">{actor}</span>
									{/each}
								</div>
								<span class="text-surface-400">
									{format(new Date(scenario.updatedAt), 'dd MMM h:mm aaa')}
								</span>
							</section>
							<hr class="opacity-50" />
							<footer class="card-footer p-4">
								<button
									class="btn variant-filled-warning"
									on:click|stopPropagation|preventDefault={() => void scenarios.delete(scenario.id)}
								>
									{#if $scenarios.operations[scenario.id]?.type === ScenarioOperationType.DELETE && $scenarios.operations[scenario.id]?.status === AsyncOperationStatus.IN_PROGRESS}
										<Loading />
										Deleting...
									{:else}
										Delete
									{/if}
								</button>
							</footer>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
