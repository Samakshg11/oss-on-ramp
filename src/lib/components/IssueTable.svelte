<script lang="ts">
	import { formatDate, queryToParams } from '../issues';
	import type { Issue, IssueQuery, SortKey } from '../types';

	let { items, query }: { items: Issue[]; query: IssueQuery } = $props();

	const columns: { key: SortKey; label: string }[] = [
		{ key: 'title', label: 'Issue' },
		{ key: 'repository', label: 'Repository' },
		{ key: 'created', label: 'Opened' },
		{ key: 'comments', label: 'Comments' }
	];

	function sortHref(key: SortKey): string {
		const next: IssueQuery = {
			...query,
			sort: key,
			order: query.sort === key && query.order === 'desc' ? 'asc' : 'desc',
			page: 1
		};
		return `/?${queryToParams(next).toString()}`;
	}

	function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
		if (query.sort !== key) return 'none';
		return query.order === 'asc' ? 'ascending' : 'descending';
	}
</script>

{#if items.length === 0}
	<div class="p-card" role="status">
		<h2 class="p-heading--4">No matching issues</h2>
		<p>Try a different search term, repository or label.</p>
	</div>
{:else}
	<div class="table-scroll">
		<table class="p-table">
			<caption class="u-off-screen">
				Beginner-friendly open issues in Canonical projects, sorted by {query.sort}.
			</caption>
			<thead>
				<tr>
					{#each columns as column (column.key)}
						<th scope="col" aria-sort={ariaSort(column.key)}>
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={sortHref(column.key)}>
								{column.label}
								{#if query.sort === column.key}
									<span aria-hidden="true">{query.order === 'asc' ? '↑' : '↓'}</span>
								{/if}
							</a>
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each items as issue (issue.id)}
					<tr>
						<th scope="row">
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={issue.url} class="p-link--external">{issue.title}</a>
							<span class="issue-meta">#{issue.number} · opened by {issue.author}</span>
						</th>
						<td><code>{issue.repository}</code></td>
						<td><time datetime={issue.createdAt}>{formatDate(issue.createdAt)}</time></td>
						<td class="numeric">{issue.comments}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.table-scroll {
		overflow-x: auto;
	}

	.numeric {
		font-variant-numeric: tabular-nums;
		text-align: right;
	}

	.issue-meta {
		display: block;
		font-size: 0.8125rem;
		opacity: 0.75;
	}
</style>
