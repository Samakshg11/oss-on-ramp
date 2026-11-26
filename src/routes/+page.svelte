<script lang="ts">
	import { resolve } from '$app/paths';
	import FilterBar from '../lib/components/FilterBar.svelte';
	import IssueTable from '../lib/components/IssueTable.svelte';
	import StatCard from '../lib/components/StatCard.svelte';
	import { queryToParams } from '../lib/issues';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function pageHref(page: number): string {
		return `/?${queryToParams({ ...data.query, page }).toString()}`;
	}

	const firstItem = $derived(data.total === 0 ? 0 : (data.page - 1) * data.perPage + 1);
	const lastItem = $derived(Math.min(data.page * data.perPage, data.total));
</script>

<svelte:head>
	<title>Open Source On-Ramp — beginner-friendly Canonical issues</title>
</svelte:head>

<section class="p-strip hero">
	<div class="u-fixed-width">
		<h1>Find your first contribution</h1>
		<p class="hero-intro">
			A data-rich, accessible view of open <strong>good first issue</strong> tickets across Canonical
			projects. Filter, sort and open an issue — then send your first pull request.
		</p>
		<p class="source-note">
			Data: <strong>
				{data.meta.source === 'github' ? 'live GitHub API' : 'bundled snapshot'}
			</strong>
			· fetched {new Date(data.meta.fetchedAt).toLocaleString('en-GB')}
		</p>
		{#if data.meta.source === 'snapshot' && data.meta.fallbackReason}
			<p class="source-note">
				Live request unavailable ({data.meta.fallbackReason}); showing snapshot.
			</p>
		{/if}
	</div>
</section>

<section class="p-strip--light" aria-labelledby="overview-heading">
	<div class="u-fixed-width">
		<h2 id="overview-heading" class="p-heading--3">Overview</h2>
		<div class="row stat-grid">
			<div class="col-3"><StatCard label="Open issues" value={data.summary.total} /></div>
			<div class="col-3"><StatCard label="Repositories" value={data.summary.repositories} /></div>
			<div class="col-3"><StatCard label="Distinct labels" value={data.summary.labels} /></div>
			<div class="col-3">
				<StatCard label="No comments yet" value={data.summary.withoutComments} />
			</div>
		</div>
	</div>
</section>

<section class="p-strip" aria-labelledby="issues-heading">
	<div class="u-fixed-width">
		<h2 id="issues-heading" class="p-heading--3">Browse issues</h2>

		<FilterBar
			query={data.query}
			repositoryFacets={data.repositoryFacets}
			labelFacets={data.labelFacets}
		/>

		<p class="result-count" role="status" aria-live="polite">
			{#if data.total === 0}
				No issues match the current filters.
			{:else}
				Showing {firstItem}–{lastItem} of {data.total} issues.
			{/if}
		</p>

		<IssueTable items={data.items} query={data.query} />

		{#if data.pageCount > 1}
			<nav class="pagination" aria-label="Results pages">
				{#if data.page > 1}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="p-button" href={pageHref(data.page - 1)}>Previous page</a>
				{/if}
				<span aria-current="page">Page {data.page} of {data.pageCount}</span>
				{#if data.page < data.pageCount}
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="p-button" href={pageHref(data.page + 1)}>Next page</a>
				{/if}
			</nav>
		{/if}

		<h3 class="p-heading--4">REST API</h3>
		<p>
			The same data is available as JSON at
			<a href={resolve('/api/issues')}><code>/api/issues</code></a>. It supports the same filters,
			uses ETag and <code>Cache-Control</code>, and falls back to a bundled snapshot if GitHub is
			unavailable.
		</p>
	</div>
</section>

<style>
	.hero h1 {
		font-size: clamp(2rem, 5vw, 3rem);
	}

	.hero-intro {
		font-size: 1.125rem;
		max-width: 46rem;
	}

	.source-note {
		font-size: 0.875rem;
		opacity: 0.8;
	}

	.stat-grid {
		gap: 1rem;
	}

	.result-count {
		font-weight: 600;
	}

	.pagination {
		align-items: center;
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		margin-top: 1.5rem;
	}
</style>
