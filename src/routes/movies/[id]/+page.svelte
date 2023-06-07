<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { CopyLink, Loading } from '@components';
	import { createFFmpeg } from '@ffmpeg/ffmpeg';
	import type { Scenario } from '@prisma/client';
	import {
		AsyncOperationStatus,
		EntityOperationType,
		type MovieVM,
		VideoStatus,
		type MovieClipVM
	} from '@shared';
	import { AppBar, Avatar, toastStore } from '@skeletonlabs/skeleton';
	import { movies, scenarios } from '@stores';
	import { onMount } from 'svelte';
	import VideoControl from './video-control.svelte';

	let id: string;
	let movie: null | MovieVM;
	let scenario: null | Scenario;
	let _isAdvancedMode = false;

	$: showMoreUI = (movie && !movie.scenarioId) || _isAdvancedMode;
	$: totalDuration = movie?.clips.reduce((acc, c) => acc + c.durationSec, 0) ?? 0;
	$: percentageProcessed = totalDuration
		? (((movie?.durationSec ?? 0) / totalDuration) * 100).toFixed(0)
		: 0;

	onMount(() => {
		id = $page.params.id;
		const unsubscribe = movies.subscribe((s) => {
			const isListLoaded = s.list.status === AsyncOperationStatus.SUCCESS;
			const isUpdateInProgress =
				s.operations[id]?.type === EntityOperationType.UPDATE &&
				s.operations[id]?.status === AsyncOperationStatus.IN_PROGRESS;
			if (isListLoaded && !isUpdateInProgress) {
				const sc = s.getById(id);
				if (!sc) {
					toastStore.trigger({
						message: 'Movie not found',
						background: 'variant-filled-warning'
					});
					goto('/movies');
					return;
				}
				const clone = structuredClone(sc);
				const clips: MovieClipVM[] = clone.clips.map((c) => {
					const mc = c as unknown as MovieClipVM;
					return {
						...mc,
						actor: typeof mc.actor === 'number' ? mc.actor : null,
						status: VideoStatus.IDLE,
						wasFileChanged: false,
						durationSec: mc.durationSec ?? 0
					};
				});
				movie = { ...clone, clips, videoBlob: null };

				scenario = $scenarios.getById(movie.scenarioId);
				if (!movie.scenarioId) {
					_isAdvancedMode = true;
				}
			}
		});
		return unsubscribe;
	});

	let finalVideo: null | MovieClipVM = null;
	let finalVideoStatus: VideoStatus = VideoStatus.IDLE;

	async function merge() {
		finalVideoStatus = VideoStatus.PROCESSING;
		movie.durationSec = 0;
		const ffmpeg = createFFmpeg({ log: true });
		await ffmpeg.load();
		ffmpeg.setProgress((event) => {
			const time: number = (event as any).time;
			if (time) {
				movie!.durationSec = time;
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

		for (let i = 0; i < movie.clips.length; i++) {
			const clips = movie.clips as unknown as MovieVM['clips'];
			const clip = clips[i];
			const path = `${i}.webm`;
			const data = new Uint8Array(await clip.blob!.arrayBuffer());
			ffmpeg.FS('writeFile', path, data);
			filesTxtContent += `file '${path}'\n`;
		}
		const outputFilePath = `output.mp4`;
		ffmpeg.FS('writeFile', filesTxtPath, filesTxtContent);
		await ffmpeg.run('-f', 'concat', '-i', filesTxtPath, outputFilePath);
		const data = ffmpeg.FS('readFile', outputFilePath);
		const blob = new Blob([data.buffer], { type: 'video/mp4' });
		finalVideo = {
			actor: null,
			description: '',
			mimeType: 'video/mp4',
			blob,
			url: URL.createObjectURL(blob),
			status: VideoStatus.FINISHED
		};
		movie.videoBlob = blob;
		finalVideoStatus = VideoStatus.FINISHED;
	}
</script>

<div class="container h-full mx-auto">
	{#if movie}
		<!-- gridColumns="grid-cols-2 sm:grid-cols-[auto_1fr_auto]" -->
		<AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
			<svelte:fragment slot="lead">
				<a class="hover:opacity-50" href="/movies">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8 mr-2 lg:h-12 lg:w-12 lg:mr-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
				</a>
			</svelte:fragment>
			<h1 class="h2">Edit movie</h1>
			<svelte:fragment slot="trail">
				{#if movie.videoURL}
					<CopyLink url={movie.videoURL} />
				{/if}
				{#if movie.scenarioId}
					<button
						on:click={() => (_isAdvancedMode = !_isAdvancedMode)}
						class="btn variant-ghost-surface"
						title="Advanced/Basic mode"
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
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					</button>
				{/if}
			</svelte:fragment>
		</AppBar>

		<form
			data-e2e="new-movie-form"
			on:submit|preventDefault={() => void movies.update(movie)}
			class="grid grid-cols-1 lg:grid-cols-3 gap-y-8 lg:gap-12 mb-24"
		>
			<div class="card p-4 lg:p-8 flex flex-col gap-5">
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
										on:click={() => (movie.actors = movie.actors.filter((a, index) => index !== i))}
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
			</div>
			<div class="col-span-2">
				<div class="card p-4 lg:p-8">
					<div class="flex flex-col gap-5">
						<!-- scenes, similar to Actors, but each scene is a multiselect of actors + a text field "description" -->
						<h4 class="h4">Clips:</h4>

						{#each movie.clips as clip, index}
							<div
								class="grid gap-2 {index % 2 !== 0
									? 'grid-cols-[1fr_auto]'
									: 'grid-cols-[auto_1fr]'}"
							>
								{#if index % 2 === 0}
									<Avatar
										initials={typeof clip.actor === 'number'
											? scenario?.actors[clip.actor]
											: '---No actor---'}
										width="w-8 lg:w-12"
									/>
								{/if}
								<div
									class="card p-4 space-y-2 {index % 2 !== 0
										? 'variant-soft-primary rounded-tr-none'
										: 'variant-soft rounded-tl-none'}"
								>
									<header class="flex justify-between items-center">
										{#if showMoreUI}
											<select bind:value={clip.actor} class="select" placeholder="Select actor(s)">
												<option value={null}>---No actor---</option>
												{#each movie.actors as actor, ai}
													<option value={ai}>{actor}</option>
												{/each}
											</select>
										{:else}
											<p class="font-bold">
												{typeof clip.actor === 'number'
													? scenario?.actors[clip.actor]
													: '---No actor---'}
											</p>
										{/if}
										<small class="opacity-50 srink-0 whitespace-nowrap pl-3"
											>Scene #{index + 1}</small
										>
									</header>
									{#if showMoreUI}
										<textarea
											bind:value={clip.description}
											class="textarea"
											placeholder="Enter description"
											readonly={!showMoreUI}
										/>
									{:else}
										<p>{clip.description}</p>
									{/if}
									<VideoControl {clip} {index} on:recorded={() => (movie.clips = movie.clips)} />
								</div>
								{#if index % 2 !== 0}
									<Avatar
										initials={clip.actor === undefined
											? '---No actor---'
											: scenario?.actors[clip.actor]}
										width="w-8 lg:w-12"
									/>
								{/if}
							</div>

							{#if showMoreUI}
								<div class="text-center">
									<button
										on:click={() => (movie.clips = movie.clips.filter((a, i) => i !== index))}
										type="button"
										class="btn variant-filled-error"
									>
										Delete clip
									</button>
								</div>
							{/if}
						{/each}
					</div>
				</div>

				<div class="my-6 flex flex-col gap-5">
					{#if finalVideoStatus === VideoStatus.IDLE}
						{#if movie.clips.length >= 2 && movie.clips.every((c) => !!c.url || c.status === VideoStatus.FINISHED)}
							<button class="btn variant-filled-primary" on:click={merge}
								>Merge {movie.clips.length} videos</button
							>
						{:else}
							<p class="text-center text-surface-300">Add at least 2 videos to merge</p>
						{/if}
					{/if}
					{#if finalVideoStatus === VideoStatus.PROCESSING}
						<button class="btn variant-filled-primary">
							Processing {percentageProcessed}%
						</button>
					{/if}

					{#if movie.videoURL || (finalVideoStatus === VideoStatus.FINISHED && finalVideo)}
						<div data-e2e="Final video" class="card p-4 lg:p-8 flex flex-col gap-5">
							<h4 class="h4">Compiled video</h4>
							<video
								controls
								src={finalVideo?.url || movie?.videoURL}
								autoplay={finalVideoStatus === VideoStatus.FINISHED}
								class="rounded border"
							>
								<track kind="captions" />
							</video>
							<div class="flex gap-3">
								<a
									download={movie?.title + '.mp4'}
									href={finalVideo?.url || movie?.videoURL}
									class="btn variant-filled-primary"
								>
									Download
								</a>
								{#if movie.videoURL}
									<CopyLink url={movie.videoURL} />
								{/if}
							</div>
						</div>
					{/if}
				</div>
			</div>

			<div class="fixed bottom-6 inset-x-4">
				<div class="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
					<div class="lg:col-start-2 lg:col-span-2">
						<div class="flex items-center px-8 py-6 variant-glass-surface rounded-3xl">
							{#if showMoreUI}
								<button
									on:click={() =>
										(movie.clips = [
											...movie.clips,
											{ actor: movie.actors[0], description: '', status: VideoStatus.IDLE }
										])}
									type="button"
									class="btn variant-ghost-surface"
								>
									Add clip
								</button>
							{/if}

							<button class="ml-auto btn variant-filled-primary">
								{#if $movies.operations[movie.id]?.type === EntityOperationType.UPDATE && $movies.operations[movie.id]?.status === AsyncOperationStatus.IN_PROGRESS}
									<Loading />
									Saving...
								{:else}
									Save
								{/if}
							</button>
						</div>
					</div>
				</div>
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
