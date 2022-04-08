<script>
  import '../app.css';
</script>

<svelte:head>
  <title>Unicode X-Ray</title>
</svelte:head>

<div class="flex flex-col gap-4 py-4 px-4 mx-0 lg:mx-auto lg:container">
  <h1 class="text-4xl">Unicode X-Ray</h1>
  <slot />
  <footer class="text-center text-stone-500 mt-20">
    Tim Martin, <a href="https://github.com/t-mart/unicode-x-ray" class="link">source</a>
  </footer>
</div>

<style>
  :global(body) {
    background-color: white;
    color: black;
  }

  @media (prefers-color-scheme: dark) {
    :global(body) {
      background-color: black;
      color: white;
    }
  }
</style>
