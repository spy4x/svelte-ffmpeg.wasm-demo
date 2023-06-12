<script lang="ts">
	import { CopyLink, Loading } from '@components';
	import { AsyncOperationStatus, EntityOperationType } from '@shared';
	import { AppBar, Avatar } from '@skeletonlabs/skeleton';
	import { movies } from '@stores';
	import { format } from 'date-fns';
</script>

<div class="container h-full mx-auto flex flex-col items-center">
	{#if $movies.list.status === AsyncOperationStatus.IDLE || $movies.list.status === AsyncOperationStatus.IN_PROGRESS}
		<Loading />
	{:else if $movies.list.status === AsyncOperationStatus.ERROR}
		<div class="text-center py-10 sm:px-4">
			<h1 class="h2">Failed to load movies</h1>
			<p class="text-lg">Please try again later</p>
		</div>
	{:else if $movies.list.status === AsyncOperationStatus.SUCCESS}
		{#if $movies.list.data.length === 0}
			<div class="text-center py-10 sm:px-4">
				<h1 class="h2 mb-3">No movies found</h1>
				<a href="/movies/new" class="btn variant-filled-primary">Create</a>
			</div>
		{:else}
			<AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
				<svelte:fragment slot="lead">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-9 w-9"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				</svelte:fragment>
				<h1 class="h2">Movies</h1>
				<svelte:fragment slot="trail">
					<a href="/movies/new" class="ml-auto btn variant-filled-primary">Create</a>
				</svelte:fragment>
			</AppBar>

			<div class="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each $movies.list.data as movie}
					<a href={`/movies/${movie.id}`} class="block">
						<div class="card">
							<header>
								<img src="/img/img.png" class="rounded-t-3xl bg-black/50 w-full h-48" alt="{movie.title}">
<!--								<div class="flex items-center justify-center h-48 rounded-t-3xl bg-black/25">-->
<!--									<span class="opacity-60">No preview</span>-->
<!--								</div>-->
							</header>
							<div class="flex gap-1 p-4 space-y-4">
								<div class="truncate">
									<h3 class="h3">{movie.title}</h3>
									<div class="text-xs">
										<span class="opacity-60">Updated at:</span>
										<span>
											{format(new Date(movie.updatedAt), 'dd MMM h:mm aaa')}
										</span>
									</div>
								</div>
							</div>
							<section class="px-4">
								<div data-e2e="actors" class="py-4 px-0.5 flex overflow-x-scroll gap-1">
									{#if !movie.actors.length}
										<span class="chip rounded-full p-0 pr-4 variant-soft">
											<span
												class="w-10 h-10 badge-icon bg-gradient-to-br variant-gradient-secondary-tertiary"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="text-white h-6 w-6"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													stroke-width="2"
												>
													<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
												</svg>
											</span>
											<span class="ml-2">Add actor</span>
										</span>
									{/if}
									{#each movie.actors as actor}
										{#if actor.length > 0}
											<Avatar
													width="w-10"
													initials={actor}
													background="bg-gradient-to-br variant-gradient-secondary-tertiary"
													class="ring-2 ring-white"
											/>
										{/if}
									{/each}
								</div>
							</section>
							<hr class="opacity-50" />
							<footer class="card-footer flex gap-2 p-4">
								<button
									class="btn variant-soft-surface"
									on:click|stopPropagation|preventDefault={() => void movies.delete(movie.id)}
								>
									{#if $movies.operations[movie.id]?.type === EntityOperationType.DELETE && $movies.operations[movie.id]?.status === AsyncOperationStatus.IN_PROGRESS}
										<Loading />
									{:else}
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
									{/if}
								</button>

								<button type="button" class="ml-auto btn variant-filled-warning"> Edit </button>
								{#if movie.videoURL}
									<CopyLink url={movie.videoURL} />
								{/if}
							</footer>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
