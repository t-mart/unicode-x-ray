<script lang="ts">
  import { onMount } from 'svelte';
  import type { Character } from '$lib/character';

  function getReferenceURL(char: Character) {
    // return `https://www.compart.com/en/unicode/${char.toFormattedCodepoint()}`;
    return `https://util.unicode.org/UnicodeJsps/character.jsp?a=${char.toHexCodepoint()}`
  }

  function isTextClamped(ele: HTMLElement) {
    return ele.scrollHeight > ele.clientHeight;
  }

  export let char: Character;
  export let name: string | undefined;
  let clampLines = true;
  let needsClamping = false;
  let nameSpan: HTMLElement;

  /*
  The whole point of this is to only render the name as a button if and only if the name is long.
  Otherwise, it should just be a span.

  Ok, here's how this works:

  1. By default, draw the name span element with css `line-clamp`: 2 and assume it does NOT need
     line clamping.
  2. After mounting, check if the line clamping is actually doing anything (e.g. small name or big
     name), and then set needsClamping appropriately
  3.
     - If small name, do nothing.
     - If big name, cut out the name span element and replace it with a button with appropriate
       styling, click handling, etc. and reinsert another name span
  */
  onMount(() => {
    needsClamping = isTextClamped(nameSpan);
  });
</script>

<div class="border-2 border-border flex flex-col w-32 justify-between items-center gap-2 p-2">
  <a class="font-mono link" href={getReferenceURL(char)}>{char.toFormattedCodepoint()}</a>
  <span class="text-4xl whitespace-pre">{char.toFormattedString()}</span>
  <div class="text-xs min-w-32 max-w-full text-center">
    {#if !needsClamping}
      <span class:line-clamp-2={clampLines} class="h-8" bind:this={nameSpan}>{name}</span>
    {:else}
      <button
        class="underline decoration-dotted cursor-row-resize"
        on:click={() => (clampLines = !clampLines)}
      >
        <span class:line-clamp-2={clampLines}>{name}</span>
      </button>
    {/if}
  </div>
</div>
