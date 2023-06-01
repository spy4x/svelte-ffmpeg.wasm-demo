<script lang="ts">
	import { scenarios } from '@stores';
	import { Loading } from '@components';
	import { AsyncOperationStatus } from '@shared';
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center">
	{#if $scenarios.list.status === AsyncOperationStatus.IDLE}
		<div class="text-center">
			<h1 class="text-3xl font-bold">Loading scenarios</h1>
			<p class="text-lg">Please wait</p>
		</div>
	{:else if $scenarios.list.status === AsyncOperationStatus.IN_PROGRESS}
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
					<div class="card">
						<header class="card-header">
							<a href={`/scenarios/${scenario.id}`} class="card-header-title underline">
								{scenario.title}
							</a>
						</header>
						<section class="p-4">Created at {scenario.createdAt}</section>
						<!-- <footer class="card-footer">(footer)</footer> -->
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
