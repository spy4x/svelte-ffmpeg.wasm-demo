<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { VideoStatus, type Video } from './types';

	export let video: Video;
	export let index: number;

	const dispatch = createEventDispatcher();

	let stream: MediaStream;
	let recorder: MediaRecorder;
	let recordedChunks: Blob[] = [];
	let videoEl: HTMLVideoElement;

	async function record() {
		video.status = VideoStatus.RECORDING;
		recordedChunks = [];

		stream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true
		});

		videoEl.srcObject = stream;
		recorder = new MediaRecorder(stream);
		recorder.addEventListener('dataavailable', function (event) {
			if (event.data.size > 0) {
				recordedChunks.push(event.data);
			}
		});

		// Start Recording
		recorder.start();
	}

	async function stopRecording() {
		video.status = VideoStatus.PROCESSING;
		// Stop the camera access and recording
		stream.getTracks().forEach(function (track) {
			track.stop();
		});

		const stopped = new Promise((resolve, reject) => {
			recorder.onstop = resolve;
			recorder.onerror = (event) => reject(event);
		});

		recorder.stop();
		await stopped;
		video.blob = new Blob(recordedChunks, {
			type: 'video/webm'
		});
		video.url = URL.createObjectURL(video.blob);
		videoEl.srcObject = null;
		videoEl.src = video.url;
		video.status = VideoStatus.FINISHED;

		dispatch('recorded', { index, video });
	}
</script>

<div class="flex flex-col gap-2 rounded bg-slate-800 p-4">
	<div data-e2e="video-wrapper" class="relative">
		<video
			bind:this={videoEl}
			controls={video.status === VideoStatus.FINISHED}
			autoplay
			muted={video.status === VideoStatus.RECORDING}
			class="w-full rounded border"
		/>
		{#if video.status === VideoStatus.IDLE}
			<div class="absolute z-10 top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4">
				<button on:click={record} class="btn variant-filled-primary w-48"> Start recording </button>
			</div>
		{/if}
	</div>

	<div class="flex gap-2">
		<input data-e2e="hint" class="input pl-4" placeholder="Hint what to do or say in this clip" />
		{#if video.status === VideoStatus.RECORDING}
			<button on:click={stopRecording} class="btn variant-filled-warning w-48">
				Stop recording
			</button>
		{/if}

		{#if video.status === VideoStatus.PROCESSING}
			<p>Processing...</p>
		{/if}

		{#if video.status === VideoStatus.FINISHED}
			<button on:click={record} class="btn variant-ghost-secondary w-48">Re-record</button>
			<a download={index + '.' + video.format} href={video.url} class="btn variant-ghost-tertiary">
				Download
			</a>
		{/if}
	</div>
</div>