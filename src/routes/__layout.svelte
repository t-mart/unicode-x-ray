<script>
  import '../app.css';
</script>

<svelte:head>
  <title>Unicode X-Ray</title>
</svelte:head>

<div class="grid grid-rows-[repeat(3,_min-content)_1fr] gap-4 py-4 px-4 mx-0 min-h-screen lg:mx-auto lg:container">
  <h1 class="text-4xl font-bold">Unicode X-Ray</h1>
  <slot />
  <footer class="text-stone-500 self-end justify-self-center mt-8">
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
