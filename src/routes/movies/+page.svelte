<script lang="ts">
	import { movies } from '@stores';
	import { Loading, Debug } from '@components';
	import { AsyncOperationStatus, EntityOperationType } from '@shared';
	import { format } from 'date-fns';
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center">
	{#if $movies.list.status === AsyncOperationStatus.IDLE || $movies.list.status === AsyncOperationStatus.IN_PROGRESS}
		<Loading />
	{:else if $movies.list.status === AsyncOperationStatus.ERROR}
		<div class="text-center">
			<h1 class="text-3xl font-bold">Failed to load movies</h1>
			<p class="text-lg">Please try again later</p>
		</div>
	{:else if $movies.list.status === AsyncOperationStatus.SUCCESS}
		{#if $movies.list.data.length === 0}
			<div class="text-center">
				<h1 class="text-3xl font-bold mb-3">No movies found</h1>
				<a href="/movies/new" class="btn variant-filled-primary">Create</a>
			</div>
		{:else}
			<div class="flex justify-end w-full">
				<a href="/movies/new" class="btn variant-filled-primary">Create</a>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each $movies.list.data as movie}
					<a href={`/movies/${movie.id}`} class="block">
						<div class="card">
							<header class="card-header">
								<span class="card-header-title underline">
									{movie.title}
								</span>
							</header>
							<section class="p-4">
								<div data-e2e="actors" class="flex gap-1">
									{#each movie.actors as actor}
										<span class="chip variant-soft">{actor}</span>
									{/each}
								</div>
								<span class="text-surface-400">
									{format(new Date(movie.updatedAt), 'dd MMM h:mm aaa')}
								</span>
							</section>
							<hr class="opacity-50" />
							<footer class="card-footer p-4">
								<button
									class="btn variant-filled-warning"
									on:click|stopPropagation|preventDefault={() => void movies.delete(movie.id)}
								>
									{#if $movies.operations[movie.id]?.type === EntityOperationType.DELETE && $movies.operations[movie.id]?.status === AsyncOperationStatus.IN_PROGRESS}
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
