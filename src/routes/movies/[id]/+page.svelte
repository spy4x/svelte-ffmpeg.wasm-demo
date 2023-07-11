<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { CopyLink, FormError, Loading } from '@components';
  import {
    AsyncOperationStatus,
    EntityOperationType,
    VideoStatus,
    getRandomString,
    type ClipVM,
    type MovieVM,
    type ScenarioVM,
    VideoMergeStatus,
  } from '@shared';
  import { AppBar, Avatar, toastStore } from '@skeletonlabs/skeleton';
  import { movies, scenarios } from '@stores';
  import { onMount } from 'svelte';
  import VideoControl from './video-control.svelte';

  let id: string;
  let movie: MovieVM;
  let scenario: null | ScenarioVM;
  let _isAdvancedMode = false;
  let attempts = 0;
  let isTriggerMergeRequestInProgress = false;
  let processingInSeconds = 0;

  $: operation = $movies.operations[movie?.id];
  $: showMoreUI = (movie && !movie.scenarioId) || _isAdvancedMode;
  $: totalDuration = movie?.clips.reduce((acc, c) => acc + c.durationSec, 0) ?? 0;
  $: percentageProcessed = totalDuration
    ? (((movie?.durationSec ?? 0) / totalDuration) * 100).toFixed(0)
    : 0;
  $: videoURL = movie?.videoURL ?? '';

  onMount(() => {
    id = $page.params.id;
    const unsubscribe = movies.subscribe(s => {
      const isListLoaded = s.list.status === AsyncOperationStatus.SUCCESS;
      const isIdleOrUpdated =
        s.operations[id]?.type === EntityOperationType.UPDATE
          ? s.operations[id]?.status === AsyncOperationStatus.IDLE ||
            s.operations[id]?.status === AsyncOperationStatus.SUCCESS
          : true;
      if (isListLoaded && isIdleOrUpdated) {
        const sc = s.getById(id);
        if (!sc) {
          toastStore.trigger({
            message: 'Movie not found',
            background: 'variant-filled-warning',
          });
          goto('/movies');
          return;
        }
        const clone = structuredClone(sc);
        const clips: ClipVM[] = clone.clips.map(c => {
          const mc = c as unknown as ClipVM;
          return {
            ...mc,
            actor: typeof mc.actor === 'number' ? mc.actor : null,
            status: VideoStatus.IDLE,
            durationSec: mc.durationSec ?? 0,
          };
        });
        movie = { ...clone, clips, videoPath: null } as any;

        if (movie.scenarioId) {
          scenario = $scenarios.getById(movie.scenarioId);
        } else {
          _isAdvancedMode = true;
        }
      }
    });
    return unsubscribe;
  });

  async function merge() {
    isTriggerMergeRequestInProgress = true;
    // request PATCH /api/movies/:id/merge
    const response = await fetch(`/api/movies/${id}/merge`, {
      method: 'PATCH',
    });
    isTriggerMergeRequestInProgress = false;
    if (response.ok) {
      const updatedMovie = await response.json();
      console.log('response', updatedMovie);
      movie = updatedMovie;

      const processingInSecondsInterval = setInterval(() => {
        processingInSeconds++;
      }, 1000);

      attempts = 0;
      const movieReloadInterval = setInterval(async () => {
        attempts++;
        if (attempts > 100) {
          console.log('Giving up');
          clearInterval(movieReloadInterval);
          clearInterval(processingInSecondsInterval);
          return;
        }
        const response = await fetch(`/api/movies/${movie.id}`);
        if (!response.ok) {
          console.log('Failed to get updated movie', await response.json());
          return;
        }
        movie = await response.json();
        if (
          movie.videoMergeStatus === VideoMergeStatus.DONE ||
          movie.videoMergeStatus === VideoMergeStatus.FAILED
        ) {
          toastStore.trigger({
            message:
              movie.videoMergeStatus === VideoMergeStatus.DONE
                ? 'Video merged'
                : 'Failed to merge video',
            background:
              movie.videoMergeStatus === VideoMergeStatus.DONE
                ? 'variant-filled-success'
                : 'variant-filled-error',
          });
          clearInterval(movieReloadInterval);
          clearInterval(processingInSecondsInterval);
        }
      }, 5000);
    } else {
      const data = await response.json();
      console.error(data);
    }
  }

  function deleteClip(index: number): void {
    movie.clips = movie.clips.filter((_, i) => i !== index);
  }

  function addClip() {
    movie.clips = [
      ...movie.clips,
      {
        id: getRandomString(),
        actor: null,
        description: '',
        status: VideoStatus.IDLE,
        path: null,
        file: null,
        url: null,
        durationSec: 0,
        mimeType: null,
      },
    ];
  }
</script>

<div class="container h-full mx-auto">
  {#if movie}
    <AppBar class="w-full" background="transparent" padding="py-10 sm:px-4">
      <svelte:fragment slot="lead">
        <a class="hover:opacity-50" href="/movies">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8"
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
          <CopyLink
            url={movie.videoURL}
            background="variant-ghost-tertiary"
            toastBackground="variant-soft-tertiary"
          />
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
      class="grid grid-cols-1 lg:grid-cols-3 gap-y-8 lg:gap-12 mb-24 lg:mb-32"
    >
      <div class="card p-4 lg:p-8 flex flex-col gap-5">
        <label>
          <span>Title</span>
          <input bind:value={movie.title} class="input" type="text" placeholder="Enter title" />
          <FormError error={operation?.error} field="title" />
        </label>

        <label>
          <span>Description</span>
          <textarea
            bind:value={movie.description}
            class="textarea min-h-[75px] block"
            rows="4"
            placeholder="Enter description"
          />
          <FormError error={operation?.error} field="description" />
        </label>

        <hr class="opacity-50" />

        <div class="flex flex-col gap-5">
          <h4 class="h4">Actors</h4>
          <FormError error={operation?.error} field="actors" />
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

        <div class="flex flex-col gap-5">
          {#if videoURL}
            <hr class="opacity-50" />
            <div data-e2e="Final video" class="flex flex-col gap-5">
              <h4 class="h4">
                Completed video
                {#if movie.videoMergeTookSeconds}
                  (processed in {movie.videoMergeTookSeconds} seconds)
                {/if}
              </h4>
              <video controls src={videoURL} autoplay={false} class="rounded-lg">
                <track kind="captions" />
              </video>
              <div class="flex gap-3">
                <a
                  download={movie?.title + '.mp4'}
                  href={videoURL}
                  class="btn variant-soft-surface"
                  title="Download movie"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </a>
                {#if movie.videoURL}
                  <CopyLink
                    url={movie.videoURL}
                    background="variant-soft-tertiary"
                    text="Copy link"
                  />
                {/if}
              </div>
            </div>
            <FormError error={operation?.error} field="videoURL" />
            <FormError error={operation?.error} field="videoPath" />
            <FormError error={operation?.error} field="videoFile" />
          {/if}

          <hr class="opacity-50" />
          {#if movie.clips.length >= 2 && movie.clips.every(c => !!c.url || c.status === VideoStatus.FINISHED)}
            <button type="button" class="btn variant-filled-primary" on:click={merge}>
              {#if isTriggerMergeRequestInProgress}
                <Loading />
              {:else if movie.videoMergeStatus === VideoMergeStatus.PROCESSING}
                Processing ({processingInSeconds} sec)... Please wait. Maybe a cup of tea?
              {:else if movie.videoMergeStatus === VideoMergeStatus.FAILED}
                Processing failed. Try again.
              {:else if videoURL}
                Re-merge movie
              {:else}
                Merge clips into movie
              {/if}
            </button>
          {:else}
            <p class="text-center text-surface-300">Add at least 2 videos to merge</p>
          {/if}
        </div>
      </div>

      <div class="col-span-2">
        <div class="card p-4 lg:p-8">
          <div class="space-y-5">
            <h4 class="h4">Clips:</h4>
            <FormError error={operation?.error} field="clips" />

            {#each movie.clips as clip, index}
              <div
                class="sm:grid gap-2 {index % 2 !== 0
                  ? 'grid-cols-[1fr_auto]'
                  : 'grid-cols-[auto_1fr]'}"
              >
                {#if index % 2 === 0}
                  <div class="hidden sm:flex flex-col gap-3 items-center">
                    <Avatar
                      initials={typeof clip.actor === 'number'
                        ? scenario?.actors[clip.actor] ??
                          movie?.actors[clip.actor] ??
                          '---No actor---'
                        : '---No actor---'}
                      width="w-12"
                    />
                    {#if showMoreUI}
                      <button
                        on:click={() => deleteClip(index)}
                        type="button"
                        class="btn-icon variant-soft-surface w-12 h-12"
                        title="Delete clip"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
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
                          ? scenario?.actors[clip.actor] ??
                            movie?.actors[clip.actor] ??
                            '---No actor---'
                          : '---No actor---'}
                      </p>
                    {/if}
                    <small class="opacity-50 srink-0 whitespace-nowrap pl-3"
                      >Scene #{index + 1}</small
                    >
                    {#if showMoreUI}
                      <button
                        on:click={() => deleteClip(index)}
                        type="button"
                        class="sm:hidden btn-icon variant-soft-surface ml-3 w-12 h-12"
                        title="Delete clip"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    {/if}
                  </header>
                  {#if showMoreUI}
                    <textarea
                      bind:value={clip.description}
                      class="textarea block"
                      placeholder="Enter description"
                      readonly={!showMoreUI}
                    />
                  {:else}
                    <p>{clip.description}</p>
                  {/if}
                  <VideoControl {clip} {index} on:recorded={() => (movie.clips = movie.clips)} />
                </div>
                {#if index % 2 !== 0}
                  <div class="hidden sm:flex flex-col gap-3 items-center">
                    <Avatar
                      initials={typeof clip.actor === 'number'
                        ? scenario?.actors[clip.actor] ??
                          movie?.actors[clip.actor] ??
                          '---No actor---'
                        : '---No actor---'}
                      width="w-12"
                    />
                    {#if showMoreUI}
                      <button
                        on:click={() => deleteClip(index)}
                        type="button"
                        class="btn-icon variant-soft-surface w-12 h-12"
                        title="Delete clip"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>

      <div class="fixed bottom-6 inset-x-4">
        <div class="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div class="lg:col-start-2 lg:col-span-2">
            <div
              class="flex justify-between items-center p-4 lg:p-8 variant-glass-surface rounded-3xl"
            >
              {#if showMoreUI}
                <button on:click={addClip} type="button" class="btn variant-ghost-surface">
                  Add clip
                </button>
              {/if}

              <FormError message={operation?.error?.message} />

              <button
                class="btn variant-filled-primary {!showMoreUI &&
                  !operation?.error?.message &&
                  'ml-auto'}"
              >
                {#if $movies.operations[movie.id]?.type === EntityOperationType.UPDATE && $movies.operations[movie.id]?.status === AsyncOperationStatus.IN_PROGRESS}
                  <Loading isIcon={true} />
                {:else}
                  Save
                {/if}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  {:else if $movies.list.status === AsyncOperationStatus.IN_PROGRESS}
    <div class="flex justify-center items-center h-full"><Loading /></div>
  {:else if $movies.list.status === AsyncOperationStatus.ERROR}
    <p class="variant-filled-danger">
      Failed to load movie with id <code>{id}</code>
    </p>
  {/if}
</div>
