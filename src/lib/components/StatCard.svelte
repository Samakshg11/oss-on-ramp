<script lang="ts">
	let {
		label,
		value,
		note = ''
	}: { label: string; value: string | number; note?: string } = $props();
</script>

<div class="p-card--highlighted stat-card">
	<h3 class="p-heading--5 u-no-margin--bottom">{label}</h3>
	<p class="p-heading--2 u-no-margin--bottom stat-card__value">{value}</p>
	{#if note}
		<p class="u-no-margin--bottom stat-card__note">{note}</p>
	{/if}
</div>

<style>
	.stat-card {
		padding: 1rem;
	}

	.stat-card__value {
		font-variant-numeric: tabular-nums;
	}

	.stat-card__note {
		font-size: 0.875rem;
		opacity: 0.8;
	}
</style>
