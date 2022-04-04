<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  import type { CharacterNameEntry, CharacterData } from '../lib/types';
  import type { EncodedTrie } from '../lib/trie';

  import { xRayText } from '../lib/xray';
  import Loading from '../lib/loading.svelte';

  let text = $page.url.searchParams.get('t') || '';

  // let names: Map<number, string> | undefined;
  // let combining: Set<number> | undefined;
  // let emojiSequences: Trie | undefined;
  // let namedSequences: Trie | undefined;
  // let standardizedVariants: Trie | undefined;
  let charData: CharacterData | undefined;

  onMount(async () => {
    const start = performance.now();

    Promise.all([
      fetch('/names.json')
        .then((response) => response.json())
        .then((data: CharacterNameEntry[]) => {
          const m = new Map(data);
          console.log(`names loaded in ${performance.now() - start}ms`);
          return m;
        }),
      fetch('./combining.json')
        .then((response) => response.json())
        .then((data: number[]) => {
          const s = new Set(data);
          console.log(`combining loaded in ${performance.now() - start}ms`);
          return s;
        }),
      fetch('./emoji-sequences.json')
        .then((response) => response.json())
        .then((data: EncodedTrie) => {
          console.log(`emoji sequences loaded in ${performance.now() - start}ms`);
          return data;
        }),
      fetch('./named-sequences.json')
        .then((response) => response.json())
        .then((data: EncodedTrie) => {
          console.log(`named sequences loaded in ${performance.now() - start}ms`);
          return data;
        }),
      fetch('./standardized-variants.json')
        .then((response) => response.json())
        .then((data: EncodedTrie) => {
          console.log(`standardized variants loaded in ${performance.now() - start}ms`);
          return data;
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
    {#each [...xRayText(text, charData)] as group}
      <ol class="flex gap-2">
        {#each group as cp}
          <li class="border-2 flex flex-col items-center w-36">
            <span class="text-6xl p-4">{cp.toString()}</span>
            <span class="text-center font-mono">{cp.codepointFormatted()}</span>
            <span class="text-center font-mono text-ellipsis overflow-hidden">{cp.name}</span>
          </li>
        {/each}
      </ol>
    {/each}
  </ol>
{/if}
