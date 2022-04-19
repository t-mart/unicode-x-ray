<script lang="ts">
  export let src: string;
  export let alt: string;
</script>

<figure
  class="w-3/4 place-self-center bg-stone-100 dark:bg-stone-900 p-2 flex flex-col"
>
  <img class="w-min max-w-full border-2 border-black dark:border-white self-center" {src} {alt} />
  <figcaption class="text-stone-500 text-xs italic mt-2">
    <slot />
  </figcaption>
</figure>
