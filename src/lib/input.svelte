<script lang="ts">
  import type { NormalizationForm } from './types';

  const normalizationFormOptions = Object.entries({
    None: undefined,
    NFC: 'NFC',
    NFKC: 'NFKC',
    NFD: 'NFD',
    NFKD: 'NFKD'
  }).map(([text, value]) => ({ text, value }));

  export let normalizationForm: NormalizationForm = undefined;
  export let text = '';
</script>

<div class="grid grid-cols-5 gap-4 my-2">
  <div class="col-span-4 flex flex-col">
    <label for="text">Text</label>
    <input
      bind:value={text}
      type="text"
      name="text"
      class="border-2 w-full text-4xl p-1 my-2 grow"
      placeholder="Enter some text..."
    />
  </div>
  <div class="col-span-1 flex flex-col ">
    <div class="flex gap-1">
      <label for="normalization" title="foo" class="">
        <a href="www.google.com">Normalization</a>
      </label>
      <a href="https://unicode.org/reports/tr15/" class="underline text-blue-600">(?)</a>
    </div>
    <select
      name="normalization"
      bind:value={normalizationForm}
      class="border-2 text-4xl w-full p-1 my-2 grow"
    >
      {#each normalizationFormOptions as option}
        <option value={option.value}>
          {option.text}
        </option>
      {/each}
    </select>
  </div>
</div>
