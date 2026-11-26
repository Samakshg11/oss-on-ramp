import type { Facet, Issue, IssuePage, IssueQuery, IssueSummary, SortKey } from './types';

export const SORT_KEYS: SortKey[] = ['created', 'comments', 'title', 'repository'];
export const PAGE_SIZES = [10, 25, 50];

export const DEFAULT_QUERY: IssueQuery = {
	search: '',
	repository: '',
	label: '',
	sort: 'created',
	order: 'desc',
	page: 1,
	perPage: 25
};

export function parseIssueQuery(params: URLSearchParams): IssueQuery {
	const sort = params.get('sort') as SortKey | null;
	const order = params.get('order');
	const page = Number(params.get('page'));
	const perPage = Number(params.get('perPage'));

	return {
		search: (params.get('search') ?? '').trim().slice(0, 120),
		repository: (params.get('repository') ?? '').trim(),
		label: (params.get('label') ?? '').trim(),
		sort: sort && SORT_KEYS.includes(sort) ? sort : DEFAULT_QUERY.sort,
		order: order === 'asc' ? 'asc' : 'desc',
		page: Number.isInteger(page) && page > 0 ? Math.min(page, 100) : DEFAULT_QUERY.page,
		perPage: PAGE_SIZES.includes(perPage) ? perPage : DEFAULT_QUERY.perPage
	};
}

export function queryToParams(query: IssueQuery): URLSearchParams {
	const params = new URLSearchParams();
	if (query.search) params.set('search', query.search);
	if (query.repository) params.set('repository', query.repository);
	if (query.label) params.set('label', query.label);
	if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort);
	if (query.order !== DEFAULT_QUERY.order) params.set('order', query.order);
	if (query.page !== 1) params.set('page', String(query.page));
	if (query.perPage !== DEFAULT_QUERY.perPage) params.set('perPage', String(query.perPage));
	return params;
}

export function filterIssues(issues: Issue[], query: IssueQuery): Issue[] {
	const needle = query.search.toLowerCase();

	return issues.filter((issue) => {
		if (query.repository && issue.repository !== query.repository) return false;
		if (query.label && !issue.labels.includes(query.label)) return false;
		if (!needle) return true;

		return [issue.title, issue.repository, issue.author, ...issue.labels]
			.join(' ')
			.toLowerCase()
			.includes(needle);
	});
}

function compare(a: Issue, b: Issue, sort: SortKey): number {
	switch (sort) {
		case 'comments':
			return a.comments - b.comments;
		case 'title':
			return a.title.localeCompare(b.title);
		case 'repository':
			return a.repository.localeCompare(b.repository);
		case 'created':
		default:
			return Date.parse(a.createdAt) - Date.parse(b.createdAt);
	}
}

export function sortIssues(issues: Issue[], query: IssueQuery): Issue[] {
	const direction = query.order === 'asc' ? 1 : -1;
	return [...issues].sort((a, b) => compare(a, b, query.sort) * direction || a.id - b.id);
}

export function buildFacets(issues: Issue[], kind: 'repository' | 'label', limit = 12): Facet[] {
	const counts = new Map<string, number>();

	for (const issue of issues) {
		const values = kind === 'repository' ? [issue.repository] : issue.labels;
		for (const value of values) {
			counts.set(value, (counts.get(value) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
		.slice(0, limit);
}

export function summarise(issues: Issue[]): IssueSummary {
	return {
		total: issues.length,
		repositories: new Set(issues.map((issue) => issue.repository)).size,
		labels: new Set(issues.flatMap((issue) => issue.labels)).size,
		withoutComments: issues.filter((issue) => issue.comments === 0).length,
		comments: issues.reduce((total, issue) => total + issue.comments, 0)
	};
}

export function buildIssuePage(issues: Issue[], query: IssueQuery): IssuePage {
	const filtered = filterIssues(issues, query);
	const sorted = sortIssues(filtered, query);
	const total = sorted.length;
	const pageCount = Math.max(1, Math.ceil(total / query.perPage));
	const page = Math.min(query.page, pageCount);
	const start = (page - 1) * query.perPage;

	return {
		items: sorted.slice(start, start + query.perPage),
		total,
		page,
		perPage: query.perPage,
		pageCount,
		summary: summarise(filtered),
		repositoryFacets: buildFacets(filtered, 'repository'),
		labelFacets: buildFacets(filtered, 'label')
	};
}

export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date(iso));
}
