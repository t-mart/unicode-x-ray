<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import type { CharacterData } from '../lib/types';

  import { graphemeSplit } from '../lib/xray';
  import Loading from '../lib/loading.svelte';

  let text = $page.url.searchParams.get('t') || '';

  let charData: CharacterData | undefined;

  onMount(async () => {
    const start = performance.now();

    Promise.all([
      fetch('/names.json')
        .then((response) => response.json())
        .then((data: [string, string][]) => {
          const m = new Map(data);
          console.log(`names loaded in ${performance.now() - start}ms`);
          return m;
        }),
      fetch('./combining.json')
        .then((response) => response.json())
        .then((data: string[]) => {
          const s = new Set(data);
          console.log(`combining loaded in ${performance.now() - start}ms`);
          return s;
        }),
      fetch('./emoji-sequences.json')
        .then((response) => response.json())
        .then((data: [string, string][]) => {
          const m = new Map(data);
          console.log(`emoji sequences loaded in ${performance.now() - start}ms`);
          return m;
        }),
      fetch('./named-sequences.json')
        .then((response) => response.json())
        .then((data: [string, string][]) => {
          const m = new Map(data);
          console.log(`named sequences loaded in ${performance.now() - start}ms`);
          return m;
        }),
      fetch('./standardized-variants.json')
        .then((response) => response.json())
        .then((data: [string, string][]) => {
          const m = new Map(data);
          console.log(`standardized variants loaded in ${performance.now() - start}ms`);
          return m;
        })
    ]).then(([names, combining, emojiSequences, namedSequences, standardizedVariants]) => {
      charData = {
        names,
        combining,
        emojiSequences,
        namedSequences,
        standardizedVariants
      };
    });
  });
</script>

<svelte:head>
  <title>Unicode X-Ray</title>
</svelte:head>

<h1 class="text-2xl my-2">Unicode X-Ray</h1>

{#if !charData}
  <Loading />
{:else}
  <input bind:value={text} class="ring-2 rounded my-2 w-full text-4xl" />
  <ol class="flex flex-col gap-4 my-2">
    {#each [...graphemeSplit(text, charData)] as grapheme}
      <ol class="flex gap-2">
        {#each grapheme as codepoint}
          <li class="border-2 flex flex-col items-center w-36">
            <span class="text-6xl p-4">{codepoint.toString()}</span>
            <span class="text-center font-mono">{codepoint.codepointFormatted()}</span>
            <span class="text-center font-mono text-ellipsis overflow-hidden">{codepoint.name}</span>
          </li>
        {/each}
      </ol>
    {/each}
  </ol>
{/if}
