<script lang="ts">
	import { page } from '$app/stores';
    import {xRayText} from '../xray';

	let text = $page.url.searchParams.get('t') || '';

</script>

<h1>Unicode X-Ray</h1>
<input bind:value={text} on:input={() => xRayText(text)} />
