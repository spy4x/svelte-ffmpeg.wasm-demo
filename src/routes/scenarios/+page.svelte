<script lang="ts">
	import { scenarios } from '@stores';
	import { Loading, Debug } from '@components';
	import { AsyncOperationStatus, EntityOperationType } from '@shared';
	import { format } from 'date-fns';
	import {AppBar, Avatar} from "@skeletonlabs/skeleton";
</script>

<div class="container h-full mx-auto flex flex-col items-center">
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

			<AppBar class="w-full" background="transparent" padding="py-10 px-4">
				<h1 class="h2 flex gap-2 items-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>Scenarios</h1>
				<svelte:fragment slot="trail">
					<a href="/scenarios/new" class="ml-auto btn variant-filled-primary">Create</a>
				</svelte:fragment>
			</AppBar>

			<div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each $scenarios.list.data as scenario}
					<a href={`/scenarios/${scenario.id}`} class="block">
						<div class="card">
							<header class="flex gap-1 card-header">
								<div class="truncate">
									<h3 class="h3">{scenario.title}</h3>
									<div class="text-xs">
										<span class="opacity-60">Updated at:</span>
										<span>
											{format(new Date(scenario.updatedAt), 'dd MMM h:mm aaa')}
										</span>
									</div>
								</div>
							</header>
							<section class="px-4">
								<div data-e2e="actors" class="py-4 flex overflow-x-scroll gap-1">
									{#if !scenario.actors.length}
										<span class="chip rounded-full p-0 pr-4 variant-soft">
											<span class="w-10 h-10 badge-icon bg-gradient-to-br variant-gradient-secondary-tertiary">
												<svg xmlns="http://www.w3.org/2000/svg" class="text-white h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
												  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
												</svg>
											</span>
											<span class="ml-2">Add actor</span>
										</span>
									{/if}
									{#each scenario.actors as actor}
										<span class="chip rounded-full p-0 pr-4 variant-soft">
											<Avatar width="w-10" initials="{actor}" background="bg-gradient-to-br variant-gradient-secondary-tertiary" />
											<span class="ml-2">{actor}</span>
										</span>
									{/each}
								</div>
							</section>
							<hr class="opacity-50" />
							<footer class="card-footer flex gap-2 p-4">
								<button
									class="btn variant-soft-surface"
									on:click|stopPropagation|preventDefault={() => void scenarios.delete(scenario.id)}
								>
									{#if $scenarios.operations[scenario.id]?.type === EntityOperationType.DELETE && $scenarios.operations[scenario.id]?.status === AsyncOperationStatus.IN_PROGRESS}
										<Loading />
									{:else}
										<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									{/if}
								</button>


								<button type="button" class="ml-auto btn variant-filled-warning">
									Edit
								</button>
								<button type="button" class="btn variant-filled-primary">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
									</svg>
									Movie
								</button>
							</footer>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
