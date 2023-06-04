<script lang="ts">
	import { page } from '$app/stores';
	import { Loading, Debug } from '@components';
	import { movies, scenarios } from '@stores';
	import { onMount } from 'svelte';
	import type { Movie, Scenario } from '@prisma/client';
	import { AsyncOperationStatus, EntityOperationType } from '@shared';
	import {
		ListBox,
		ListBoxItem,
		popup,
		toastStore,
		type PopupSettings, AppBar
	} from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';

	let id: string;
	let movie: null | Movie;
	let scenario: null | Scenario;
	let _isAdvancedMode = false;

	onMount(() => {
		id = $page.params.id;
		const unsubscribe = movies.subscribe((s) => {
			const isListLoaded = s.list.status === AsyncOperationStatus.SUCCESS;
			const isUpdateInProgress =
				s.operations[id]?.type === EntityOperationType.UPDATE &&
				s.operations[id]?.status === AsyncOperationStatus.IN_PROGRESS;
			if (s.list.status === AsyncOperationStatus.SUCCESS && !isUpdateInProgress) {
				const sc = s.getById(id);
				if (!sc) {
					toastStore.trigger({
						message: 'Movie not found',
						background: 'variant-filled-warning'
					});
					goto('/movies');
					return;
				}
				movie = structuredClone(sc);
				scenario = $scenarios.getById(movie.scenarioId);
				if (!movie.scenarioId) {
					_isAdvancedMode = true;
				}
			}
		});
		return unsubscribe;
	});

	$: showMoreUI = (movie && !movie.scenarioId) || _isAdvancedMode;
</script>

<div class="container h-full mx-auto">
	{#if movie}
		<AppBar class="w-full" background="transparent" padding="py-10 px-4">
			<svelte:fragment slot="lead">
				<a class="hover:opacity-50" href="/movies">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
				</a>
			</svelte:fragment>
			<h1 class="h2">Edit movie</h1>
			<svelte:fragment slot="trail">
				{#if movie.scenarioId}
					{#if _isAdvancedMode}
						<button on:click={() => (_isAdvancedMode = false)} class="btn variant-ghost-surface"
						>Basic mode</button
						>
					{:else}
						<button on:click={() => (_isAdvancedMode = true)} class="btn variant-ghost-surface"
						>Advanced mode</button
						>
					{/if}
				{/if}
			</svelte:fragment>
		</AppBar>

		<form data-e2e="new-movie-form" on:submit|preventDefault={() => void movies.update(movie)}>
			<div class="card">
				<section class="p-4">
					<div class="flex flex-col gap-5">
						<label>
							<span>Title</span>
							<input bind:value={movie.title} class="input" type="text" placeholder="Enter title" />
						</label>

						<hr class="opacity-50" />

						<div class="flex flex-col gap-5">
							<h4 class="h4">Actors</h4>
							{#each movie.actors as actor, i}
								<label>
									<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
										<div class="input-group-shim">#{i + 1}</div>
										<input
											bind:value={actor}
											type="text"
											placeholder="Enter actors"
											readonly={!showMoreUI}
										/>
										{#if showMoreUI}
											<button
												on:click={() =>
													(movie.actors = movie.actors.filter((a, index) => index !== i))}
												type="button"
												class="variant-ghost-surface"
											>
												X
											</button>
										{/if}
									</div>
								</label>
							{/each}
							{#if showMoreUI}
								<button
									on:click={() => (movie.actors = [...movie.actors, ''])}
									type="button"
									class="btn variant-ghost-surface"
								>
									Add actor
								</button>
							{/if}
						</div>

						<hr class="opacity-50" />

						<!-- scenes, similar to Actors, but each scene is a multiselect of actors + a text field "description" -->
						<div class="flex flex-col gap-5">
							<h4 class="h4">Clips:</h4>
							{#each movie.clips as scene, i}
								<div>
									<div>#{i + 1}</div>
									<label>
										<span>Actor:</span>
										{#if showMoreUI}
											<select bind:value={scene.actor} class="select" placeholder="Select actor(s)">
												<option value={undefined}>---No actor---</option>
												{#each movie.actors as actor, ai}
													<option value={ai}>{actor}</option>
												{/each}
											</select>
										{:else}
											<span class="chip variant-soft">
												{scene.actor === undefined
													? '---No actor---'
													: scenario?.actors[scene.actor]}
											</span>
										{/if}
									</label>
									<label>
										<span>Description:</span>
										<textarea
											bind:value={scene.description}
											class="textarea"
											placeholder="Enter description"
											readonly={!showMoreUI}
										/>
									</label>
									{#if showMoreUI}
										<button
											on:click={() => (movie.clips = movie.clips.filter((a, index) => index !== i))}
											type="button"
											class="btn variant-ghost-surface"
										>
											Delete clip
										</button>
									{/if}
								</div>
							{/each}
							{#if showMoreUI}
								<button
									on:click={() =>
										(movie.clips = [...movie.clips, { actor: movie.actors[0], description: '' }])}
									type="button"
									class="btn variant-ghost-surface"
								>
									Add clip
								</button>
							{/if}
						</div>
					</div>
				</section>
				<hr class="opacity-50" />
				<footer class="card-footer p-4 flex justify-end gap-3">
					<button class="btn variant-filled-primary">
						{#if $movies.operations[movie.id]?.type === EntityOperationType.UPDATE && $movies.operations[movie.id]?.status === AsyncOperationStatus.IN_PROGRESS}
							<Loading />
							Saving...
						{:else}
							Save
						{/if}
					</button>
				</footer>
			</div>

			<!-- <Debug data={movie} />
			<Debug data={$movies} /> -->
		</form>
	{:else if $movies.list.status === AsyncOperationStatus.IN_PROGRESS}
		<Loading />
	{:else if $movies.list.status === AsyncOperationStatus.ERROR}
		<p class="variant-filled-danger">
			Failed to load movie with id <code>{id}</code>
		</p>
	{/if}
</div>

<!-- <script lang="ts">
	import { createFFmpeg } from '@ffmpeg/ffmpeg';
	import VideoControl from './[id]/video-control.svelte';
	import { VideoStatus, type Video } from './[id]/types';
	import { onMount } from 'svelte';

	let videos: Video[] = [];
	let finalVideo: null | Video = null;
	let finalVideoStatus: VideoStatus = VideoStatus.IDLE;
	let processed = '';

	function add() {
		videos = [
			...videos,
			{ id: Math.random().toString().substring(14), status: VideoStatus.IDLE, format: 'webm' }
		];
	}

	onMount(() => {
		add();
		add();
	});

	async function merge() {
		finalVideoStatus = VideoStatus.PROCESSING;
		const ffmpeg = createFFmpeg({ log: true });
		await ffmpeg.load();
		ffmpeg.setProgress((event) => {
			const time: string = (event as any).time;
			if (time) {
				processed = time;
			} else if (event.ratio === 1) {
				finalVideoStatus = VideoStatus.FINISHED;
			}
			console.log('Progress', { ratio: event.ratio, event });
		});
		ffmpeg.setLogger(({ message }) => {
			console.log(message);
		});

		const filesTxtPath = 'files.txt';
		let filesTxtContent = '';

		for (let i = 0; i < videos.length; i++) {
			const video = videos[i];
			const path = `${i}.webm`;
			const data = new Uint8Array(await video.blob!.arrayBuffer());
			ffmpeg.FS('writeFile', path, data);
			filesTxtContent += `file '${path}'\n`;
		}
		const outputFilePath = `output.mp4`;
		ffmpeg.FS('writeFile', filesTxtPath, filesTxtContent);
		await ffmpeg.run('-f', 'concat', '-i', filesTxtPath, outputFilePath);
		const data = ffmpeg.FS('readFile', outputFilePath);
		const blob = new Blob([data.buffer], { type: 'video/mp4' });
		finalVideo = {
			id: 'Final',
			format: 'mp4',
			blob,
			url: URL.createObjectURL(blob),
			status: VideoStatus.FINISHED
		};
		finalVideoStatus = VideoStatus.FINISHED;
	}

	function restart() {
		videos = [];
		finalVideo = null;
		finalVideoStatus = VideoStatus.IDLE;
	}
</script>

<div class="flex flex-col gap-5 mx-auto max-w-2xl pb-10">
	{#each videos as video, index}
		<VideoControl {video} {index} on:recorded={() => (videos = videos)} />
	{/each}

	<button class="btn variant-filled-surface" on:click={add}>Add video segment</button>

	{#if finalVideoStatus === VideoStatus.IDLE}
		{#if videos.length >= 2 && videos.every((v) => v.status === VideoStatus.FINISHED)}
			<button class="btn variant-filled-primary" on:click={merge}
				>Merge {videos.length} videos</button
			>
		{:else}
			<p class="text-center text-surface-300">Add at least 2 videos to merge</p>
		{/if}
	{/if}
	{#if finalVideoStatus === VideoStatus.PROCESSING}
		<button class="btn variant-filled-primary">Processing {processed} seconds</button>
	{/if}

	{#if finalVideoStatus === VideoStatus.FINISHED && finalVideo}
		<video controls src={finalVideo.url} autoplay class="rounded border">
			<track kind="captions" />
		</video>
		<a
			download={'final.' + finalVideo.format}
			href={finalVideo.url}
			class="btn variant-filled-primary"
		>
			Download
		</a>
		<button on:click={restart} class="btn variant-ghost-secondary">Clear and start over</button>
	{/if}
</div> -->
