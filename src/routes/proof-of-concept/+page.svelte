<script lang="ts">
	import { createFFmpeg } from '@ffmpeg/ffmpeg';
	import VideoControl from './video-control.svelte';
	import { VideoStatus, type Video } from './types';
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

<div class="flex flex-col gap-5 p-10 mx-auto max-w-2xl pb-20">
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
		<video controls src={finalVideo.url} autoplay class="rounded border" />
		<a
			download={'final.' + finalVideo.format}
			href={finalVideo.url}
			class="btn variant-filled-primary"
		>
			Download
		</a>
		<button on:click={restart} class="btn variant-ghost-secondary">Clear and start over</button>
	{/if}
</div>
