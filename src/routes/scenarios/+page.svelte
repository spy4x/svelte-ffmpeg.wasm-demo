<script lang="ts">
	import Grid from './grd.svelte';
	import { auth, scenarios } from '@stores';
</script>

<div class="container h-full mx-auto flex flex-col items-center">
	<Grid state={$scenarios.my} access="PRIVATE" />
	{#if $auth.user?.role === 'USER'}
		<Grid state={$scenarios.shared} access="SHARED" />
	{/if}
</div>
