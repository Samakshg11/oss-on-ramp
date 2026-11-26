import { describe, expect, it } from 'vitest';
import { clearDatasetCache, getDataset, normaliseIssue } from './github';

const rawIssue = {
	id: 7,
	number: 99,
	title: 'Fix a docs bug',
	repository_url: 'https://api.github.com/repos/canonical/vanilla-framework',
	html_url: 'https://github.com/canonical/vanilla-framework/issues/99',
	labels: [{ name: 'documentation' }],
	created_at: '2026-01-01T00:00:00Z',
	comments: 2,
	user: { login: 'sam' }
};

const okFetch = () => Promise.resolve(Response.json({ items: [rawIssue] }));
const failFetch = () => Promise.resolve(new Response('rate limited', { status: 403 }));

describe('normaliseIssue', () => {
	it('maps GitHub fields into the transport-friendly shape', () => {
		expect(normaliseIssue(rawIssue)).toEqual({
			id: 7,
			number: 99,
			title: 'Fix a docs bug',
			repository: 'canonical/vanilla-framework',
			url: 'https://github.com/canonical/vanilla-framework/issues/99',
			labels: ['documentation'],
			createdAt: '2026-01-01T00:00:00Z',
			comments: 2,
			author: 'sam'
		});
	});
});

describe('getDataset', () => {
	it('uses GitHub data when the request succeeds', async () => {
		clearDatasetCache();
		const dataset = await getDataset({ fetchImpl: okFetch });
		expect(dataset.source).toBe('github');
		expect(dataset.issues).toHaveLength(1);
	});

	it('falls back to the bundled snapshot when GitHub fails', async () => {
		clearDatasetCache();
		const dataset = await getDataset({ fetchImpl: failFetch });
		expect(dataset.source).toBe('snapshot');
		expect(dataset.issues.length).toBeGreaterThan(0);
		expect(dataset.fallbackReason).toContain('403');
	});

	it('serves cached data within the TTL', async () => {
		clearDatasetCache();
		await getDataset({ fetchImpl: okFetch, now: 1_000 });
		const dataset = await getDataset({ fetchImpl: failFetch, now: 2_000 });
		expect(dataset.source).toBe('github');
	});
});
