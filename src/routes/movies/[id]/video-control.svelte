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
	const supportedMimeType = findSupportedMimeType();

	onMount(() => {
		console.log({ supportedMimeType });
		if (clip.status === VideoStatus.IDLE && !clip.file && clip.url) {
			videoEl.src = clip.url;
		}
	});

	function findSupportedMimeType(): string {
		if (!MediaRecorder || !MediaRecorder.isTypeSupported) {
			return '';
		}
		const webm = 'video/webm';
		const mp4 = 'video/mp4';
		const isWebM = MediaRecorder.isTypeSupported(webm);
		const isMP4 = MediaRecorder.isTypeSupported(mp4);
		return isWebM ? webm : isMP4 ? mp4 : '';
	}

	async function record() {
		clip.status = VideoStatus.RECORDING;
		recordedChunks = [];

		// Display video devices
		// navigator.mediaDevices.enumerateDevices().then((devices) => {
		// 	devices = devices.filter((d) => d.kind === 'videoinput');
		// });

		stream = await navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true
			// video: {
			// 	deviceId: devices[0].deviceId, // selected device
			// },
		});

		videoEl.src = '';
		videoEl.srcObject = stream;
		recorder = new MediaRecorder(stream, {
			mimeType: supportedMimeType
		});
		let index = 0;
		recorder.addEventListener('dataavailable', function (event) {
			if (event.data && event.data.size > 0) {
				recordedChunks.push(event.data);
				console.log({ chunk: ++index, size: event.data.size });
			}
		});

		// Start Recording
		recorder.start(1000);
		recordingStartedAt = Date.now();
	}

	async function stopRecording() {
		clip.status = VideoStatus.PROCESSING;
		// Stop the camera access and recording
		stream.getTracks().forEach(function (track) {
			track.stop();
		});

		const stopped = new Promise((resolve, reject) => {
			recorder.onstop = () => {
				setTimeout(() => resolve(true), 100);
			};
			recorder.onerror = (event) => reject(event);
		});

		recorder.stop();
		await stopped;
		clip.file = new Blob(recordedChunks, {
			type: supportedMimeType
		});
		console.log({ size: clip.file.size, type: clip.file.type, recorderType: recorder.mimeType });
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
