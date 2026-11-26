import { describe, expect, it } from 'vitest';
import { buildIssuePage, filterIssues, parseIssueQuery, sortIssues, summarise } from './issues';
import { DEFAULT_QUERY } from './issues';
import type { Issue, IssueQuery } from './types';

const issues: Issue[] = [
	{
		id: 1,
		number: 10,
		title: 'Fix a docs typo',
		repository: 'canonical/vanilla-framework',
		url: 'https://github.com/canonical/vanilla-framework/issues/10',
		labels: ['documentation', 'good first issue'],
		createdAt: '2026-01-01T00:00:00Z',
		comments: 0,
		author: 'alice'
	},
	{
		id: 2,
		number: 20,
		title: 'Improve accessibility of a modal',
		repository: 'canonical/canonical.com',
		url: 'https://github.com/canonical/canonical.com/issues/20',
		labels: ['accessibility', 'good first issue'],
		createdAt: '2026-02-01T00:00:00Z',
		comments: 3,
		author: 'bob'
	},
	{
		id: 3,
		number: 30,
		title: 'Add a REST endpoint',
		repository: 'canonical/vanilla-framework',
		url: 'https://github.com/canonical/vanilla-framework/issues/30',
		labels: ['good first issue'],
		createdAt: '2026-03-01T00:00:00Z',
		comments: 1,
		author: 'carol'
	}
];

const query = (overrides: Partial<IssueQuery> = {}): IssueQuery => ({
	...DEFAULT_QUERY,
	...overrides
});

describe('parseIssueQuery', () => {
	it('uses safe defaults for missing and invalid values', () => {
		expect(parseIssueQuery(new URLSearchParams())).toEqual(DEFAULT_QUERY);
		expect(
			parseIssueQuery(new URLSearchParams('sort=drop&order=sideways&page=-4&perPage=999'))
		).toEqual(DEFAULT_QUERY);
	});

	it('accepts known sort keys and page sizes', () => {
		const parsed = parseIssueQuery(
			new URLSearchParams('sort=comments&order=asc&page=2&perPage=10')
		);
		expect(parsed.sort).toBe('comments');
		expect(parsed.order).toBe('asc');
		expect(parsed.page).toBe(2);
		expect(parsed.perPage).toBe(10);
	});
});

describe('filterIssues', () => {
	it('matches text across title, repository, author and labels', () => {
		expect(
			filterIssues(issues, query({ search: 'ACCESSIBILITY' })).map((issue) => issue.id)
		).toEqual([2]);
		expect(filterIssues(issues, query({ search: 'bob' })).map((issue) => issue.id)).toEqual([2]);
	});

	it('combines repository and label filters', () => {
		const result = filterIssues(
			issues,
			query({ repository: 'canonical/vanilla-framework', label: 'documentation' })
		);
		expect(result.map((issue) => issue.id)).toEqual([1]);
	});
});

describe('sortIssues', () => {
	it('sorts by date descending by default', () => {
		expect(sortIssues(issues, query()).map((issue) => issue.id)).toEqual([3, 2, 1]);
	});

	it('sorts ascending when requested', () => {
		expect(
			sortIssues(issues, query({ sort: 'comments', order: 'asc' })).map((issue) => issue.id)
		).toEqual([1, 3, 2]);
	});
});

describe('summarise and buildIssuePage', () => {
	it('summarises the filtered set', () => {
		expect(summarise(issues)).toEqual({
			total: 3,
			repositories: 2,
			labels: 3,
			withoutComments: 1,
			comments: 4
		});
	});

	it('paginates without losing the total', () => {
		const page = buildIssuePage(issues, query({ perPage: 2, page: 2 }));
		expect(page.total).toBe(3);
		expect(page.pageCount).toBe(2);
		expect(page.items.map((issue) => issue.id)).toEqual([1]);
	});

	it('clamps out-of-range pages', () => {
		const page = buildIssuePage(issues, query({ perPage: 2, page: 99 }));
		expect(page.page).toBe(2);
		expect(page.items).toHaveLength(1);
	});
});
