<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { type MovieClipVM, VideoStatus } from '@shared';

	export let clip: MovieClipVM;
	export let index: number;

	const dispatch = createEventDispatcher();

	let stream: MediaStream;
	let recorder: MediaRecorder;
	let recordedChunks: Blob[] = [];
	let videoEl: HTMLVideoElement;

	onMount(() => {
		if (clip.status === VideoStatus.IDLE && !clip.blob && clip.url) {
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
		clip.blob = new Blob(recordedChunks, {
			type: 'video/webm'
		});
		// clip.url = URL.createObjectURL(clip.blob);
		// clip.base64 = (await blobToBase64(clip.blob)) || null;
		clip.mimeType = clip.blob.type;
		videoEl.srcObject = null; // TODO: remove this line?
		videoEl.src = URL.createObjectURL(clip.blob);
		clip.status = VideoStatus.FINISHED;
		dispatch('recorded', { index, clip });
	}
</script>

<div class="flex flex-col gap-2 rounded bg-slate-800 p-4">
	<div data-e2e="video-wrapper" class="relative">
		<video
			bind:this={videoEl}
			controls={!!clip.url}
			autoplay
			muted={clip.status === VideoStatus.RECORDING}
			class="w-full rounded border border-dashed"
		/>
		{#if !clip.url && clip.status === VideoStatus.IDLE}
			<div class="absolute z-10 top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4">
				<button on:click={record} class="btn variant-filled-primary w-48"> Start recording </button>
			</div>
		{/if}
	</div>

	<div class="flex gap-2">
		{#if clip.url && clip.status === VideoStatus.IDLE}
			<button on:click={record} class="btn variant-filled-primary w-48"> Start recording </button>
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
			<button on:click={record} class="btn variant-ghost-secondary w-48">Re-record</button>
			<a
				download={index + '.' + clip.mimeType?.replace('video/', '')}
				href={videoEl.src}
				class="btn variant-ghost-tertiary"
			>
				Download
			</a>
		{/if}
	</div>
</div>
