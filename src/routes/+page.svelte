<div class="container h-full mx-auto flex justify-center items-center">
  <div class="space-y-10 text-center flex flex-col items-center">
    <h2 class="h2">Welcome to Roley.</h2>
    <!-- Animated Logo -->
    <figure>
      <section class="img-bg" />
      <img src="/img/logo.svg" width="300" height="300" alt="Roley. Let's make a movie!" />
    </figure>
    <!-- / -->
    <div class="space-y-2">
      <p class="variant-glass-tertiary py-2 px-4 rounded-lg">
        We'll replace this page with a proper landing page that explains the project idea.
      </p>
    </div>
  </div>
</div>

<style lang="postcss">
  figure {
    @apply flex relative flex-col;
  }
  figure img,
  .img-bg {
    @apply w-64 h-64 md:w-80 md:h-80;
  }
  .img-bg {
    @apply absolute z-[-1] rounded-full blur-[50px] transition-all;
    animation: pulse 5s cubic-bezier(0, 0, 0, 0.5) infinite, glow 5s linear infinite;
  }
  @keyframes glow {
    0% {
      @apply bg-primary-400/50;
    }
    33% {
      @apply bg-secondary-400/50;
    }
    66% {
      @apply bg-tertiary-400/50;
    }
    100% {
      @apply bg-primary-400/50;
    }
  }
  @keyframes pulse {
    50% {
      transform: scale(1.5);
    }
  }
</style>
