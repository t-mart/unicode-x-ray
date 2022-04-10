<script lang="ts">
  import type { Character } from '$lib/character';

  function getReferenceURL(char: Character) {
    return `https://www.compart.com/en/unicode/${char.toFormattedCodepoint()}`;
  }

  export let char: Character;
  export let name: string | undefined;
  let clampLines = true;
</script>

<div class="border-2 border-border flex flex-col w-32 justify-between items-center gap-2 p-2">
  <a class="font-mono link" href={getReferenceURL(char)}>{char.toFormattedCodepoint()}</a>
  <span class="text-4xl whitespace-pre">{char.toFormattedString()}</span>
  <button
    class="text-xs min-w-32 max-w-full text-center underline decoration-dotted"
    on:click={() => (clampLines = !clampLines)}
  >
    <span class:line-clamp-2={clampLines}>{name}</span>
  </button>
</div>
