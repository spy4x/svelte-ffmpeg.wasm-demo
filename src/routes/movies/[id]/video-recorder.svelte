<script lang="ts">
  import { modalStore } from '@skeletonlabs/skeleton';

  let recordStatus = '';

  function toggle(status: string): void {
    recordStatus = status;
  }
</script>

<div class="w-full h-full overflow-hidden rounded-3xl">
  <div class="flex-1 flex items-center justify-center relative">
    <div>
      <img class="rounded-3xl max-h-full" src="https://picsum.photos/1600/1200" alt="Placeholder" />
    </div>

    {#if recordStatus === 'recording'}
      <div class="absolute inset-x-0 top-4 z-10 flex justify-center">
        <div class="btn bg-white border border-red-500">
          <span class="flex items-center gap-3 text-red-600">
            <span class="relative flex h-3 w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"
              />
              <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>

            Recording
          </span>
        </div>
      </div>
    {/if}
  </div>
  <div class="absolute z-10 inset-x-4 bottom-4">
    <div
      class="card variant-glass-surface flex justify-between items-center p-4 lg:p-8 rounded-3xl"
    >
      <button type="button" class="btn variant-filled-tertiary" on:click={modalStore.close}
        >Cancel</button
      >

      {#if recordStatus === ''}
        <button type="button" class="btn variant-filled-error" on:click={() => toggle('recording')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          Start recording
        </button>
      {/if}
      {#if recordStatus === 'recording'}
        <button type="button" class="btn variant-filled-error" on:click={() => toggle('recorded')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
            />
          </svg>
          Stop recording
        </button>
      {/if}
      {#if recordStatus === 'recorded'}
        <button
          type="button"
          class="btn variant-filled-warning"
          on:click={() => toggle('recording')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Re-record
        </button>
      {/if}

      <div class="w-20">
        {#if recordStatus === 'recorded'}
          <button type="button" class="btn variant-filled-primary" on:click={modalStore.close}
            >Save</button
          >
        {/if}
      </div>
    </div>
  </div>
</div>
