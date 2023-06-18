<script lang="ts">
	import { VideoStatus, type ClipVM } from '@shared';
	import { createEventDispatcher, onMount } from 'svelte';

	export let clip: ClipVM;
	export let index: number;

	const dispatch = createEventDispatcher();

	let stream: MediaStream;
	let recorder: MediaRecorder;
	let recordedChunks: Blob[] = [];
	let videoEl: HTMLVideoElement;
	let recordingStartedAt = 0;

	onMount(() => {
		if (clip.status === VideoStatus.IDLE && !clip.file && clip.url) {
			videoEl.src = clip.url;
		}
	});

	async function record() {
		clip.status = VideoStatus.RECORDING;
		recordedChunks = [];

		stream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true
		});

		videoEl.src = '';
		videoEl.srcObject = stream;
		recorder = new MediaRecorder(stream);
		recorder.addEventListener('dataavailable', function (event) {
			if (event.data.size > 0) {
				recordedChunks.push(event.data);
			}
		});

		// Start Recording
		recorder.start();
		recordingStartedAt = Date.now();
	}

	async function stopRecording() {
		clip.status = VideoStatus.PROCESSING;
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
		clip.file = new Blob(recordedChunks, {
			type: 'video/webm'
		});
		clip.mimeType = clip.file.type;
		videoEl.srcObject = null;
		videoEl.src = URL.createObjectURL(clip.file);
		clip.status = VideoStatus.FINISHED;
		clip.durationSec = recordingStartedAt ? (Date.now() - recordingStartedAt) / 1000 : 0;
		dispatch('recorded', { index, clip });
	}
</script>

<div class="flex flex-col gap-2 rounded-lg">
	<div data-e2e="video-wrapper" class="relative">
		<video
			bind:this={videoEl}
			controls={!!clip.url || clip.status === VideoStatus.FINISHED}
			autoplay={clip.status !== VideoStatus.IDLE}
			muted={!clip.url || clip.status === VideoStatus.RECORDING}
			class="w-full rounded"
		/>
		{#if !clip.url && clip.status === VideoStatus.IDLE}
			<div class="absolute z-10 top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4">
				<button on:click={record} class="btn variant-filled-primary w-48"> Start recording </button>
			</div>
		{/if}
	</div>

	<div class="flex gap-2">
		{#if clip.url && clip.status === VideoStatus.IDLE}
			<button on:click={record} class="btn variant-filled-secondary w-48">
				<span class="text-white">Re-record</span>
			</button>
		{/if}
		{#if clip.status === VideoStatus.RECORDING}
			<button on:click={stopRecording} class="btn variant-filled-warning w-48">
				Stop recording
			</button>
		{/if}

		{#if clip.status === VideoStatus.PROCESSING}
			<p>Processing...</p>
		{/if}

		{#if clip.status === VideoStatus.FINISHED}
			<button on:click={record} class="btn variant-soft-primary w-48">Re-record</button>
			<a
				download={index + '.' + clip.mimeType?.replace('video/', '')}
				href={videoEl.src}
				class="btn variant-soft-surface"
			>
				Download
			</a>
		{/if}
	</div>
</div>
