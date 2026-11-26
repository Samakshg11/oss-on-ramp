<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Facet, IssueQuery } from '../types';

	let {
		query,
		repositoryFacets,
		labelFacets
	}: { query: IssueQuery; repositoryFacets: Facet[]; labelFacets: Facet[] } = $props();
</script>

<form class="p-form p-form--inline filters" method="get" action="/" aria-label="Filter issues">
	<div class="p-form__group">
		<label class="p-form__label" for="search">Search</label>
		<input
			class="p-form__control"
			type="search"
			id="search"
			name="search"
			value={query.search}
			placeholder="Title, repo, label or author"
			maxlength="120"
		/>
	</div>

	<div class="p-form__group">
		<label class="p-form__label" for="repository">Repository</label>
		<select class="p-form__control" id="repository" name="repository">
			<option value="">All repositories</option>
			{#each repositoryFacets as facet (facet.name)}
				<option value={facet.name} selected={query.repository === facet.name}>
					{facet.name} ({facet.count})
				</option>
			{/each}
		</select>
	</div>

	<div class="p-form__group">
		<label class="p-form__label" for="label">Label</label>
		<select class="p-form__control" id="label" name="label">
			<option value="">All labels</option>
			{#each labelFacets as facet (facet.name)}
				<option value={facet.name} selected={query.label === facet.name}>
					{facet.name} ({facet.count})
				</option>
			{/each}
		</select>
	</div>

	<input type="hidden" name="sort" value={query.sort} />
	<input type="hidden" name="order" value={query.order} />
	<input type="hidden" name="perPage" value={query.perPage} />

	<button class="p-button--positive" type="submit">Apply filters</button>
	<a class="p-button u-no-margin--bottom" href={resolve('/')}>Clear</a>
</form>

<style>
	.filters {
		align-items: end;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.filters :global(.p-form__group) {
		margin-bottom: 0;
		min-width: 12rem;
	}
</style>
