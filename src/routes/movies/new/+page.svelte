<script lang="ts">
  import { goto } from '$app/navigation';
  import { FormError, Loading } from '@components';
  import {
    AsyncOperationStatus,
    ClipVMSchema,
    EntityOperationType,
    MovieVMSchema,
    type MovieVM,
  } from '@shared';
  import { AppBar } from '@skeletonlabs/skeleton';
  import { auth, movies, scenarios } from '@stores';
  import { generateRandomString } from 'lucia-auth';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  const id = generateRandomString(15);
  let movie: MovieVM;
  $: operation = $movies.operations[movie?.id];

  onMount(() => {
    const user = get(auth).user;
    if (!user) {
      return;
    }
    movie = MovieVMSchema.parse({
      userId: user.id,
      clips: [ClipVMSchema.parse({})],
    } satisfies Partial<MovieVM>);
    const unsubscribe = movies.subscribe($movies => {
      const op = $movies.operations[id];
      if (
        op &&
        op.type === EntityOperationType.CREATE &&
        op.status === AsyncOperationStatus.SUCCESS
      ) {
        goto(`/movies/${id}`);
      }
    });
    return unsubscribe;
  });
</script>

{#if movie}
  <div class="container h-full mx-auto flex flex-col items-center">
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
      <h1 class="h2">New movie</h1>
    </AppBar>
    <form
      data-e2e="new-movie-form"
      on:submit|preventDefault={() => movies.createFromScenario(id, movie.scenarioId, movie.title)}
    >
      <div class="card">
        <section class="p-4">
          <div class="flex flex-col gap-5">
            <label>
              <span>Title</span>
              <input bind:value={movie.title} class="input" type="text" placeholder="Enter title" />
              <FormError error={operation?.error} field="title" />
            </label>
            <label>
              <span>Scenario</span>
              <select bind:value={movie.scenarioId} class="select" placeholder="Select movie">
                <option value={null}>---Blank---</option>
                {#each $scenarios.my.data as scenario}
                  <option value={scenario.id}>{scenario.title}</option>
                {/each}
              </select>
            </label>
          </div>
        </section>
        <footer class="card-footer flex justify-end gap-3">
          <a href="/movies" class="btn variant-ghost-tertiary">Cancel</a>
          <button class="btn variant-filled-primary">
            {#if $movies.operations[id]?.type === EntityOperationType.CREATE && $movies.operations[id]?.status === AsyncOperationStatus.IN_PROGRESS}
              <Loading />
              Creating...
            {:else}
              Create
            {/if}
          </button>
        </footer>
      </div>
    </form>
  </div>
{/if}
