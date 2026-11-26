import snapshot from './data/issues-snapshot.json';
import type { Dataset, Issue } from './types';

/**
 * Note the `is:issue is:open` qualifiers: GitHub's search API treats
 * `state:open` differently and returns no results for this label query.
 */
export const GITHUB_QUERY = 'org:canonical is:issue is:open label:"good first issue"';

const CACHE_TTL_MS = 10 * 60 * 1000;
const API_URL =
	'https://api.github.com/search/issues?q=' +
	encodeURIComponent(GITHUB_QUERY) +
	'&per_page=100&sort=created&order=desc';

type RawIssue = {
	id: number;
	number: number;
	title: string;
	repository_url: string;
	html_url: string;
	labels: { name: string }[];
	created_at: string;
	comments: number;
	user: { login: string };
};

let cache: { dataset: Dataset; expiresAt: number } | null = null;

export function normaliseIssue(raw: RawIssue): Issue {
	return {
		id: raw.id,
		number: raw.number,
		title: raw.title,
		repository: raw.repository_url.replace('https://api.github.com/repos/', ''),
		url: raw.html_url,
		labels: raw.labels.map((label) => label.name),
		createdAt: raw.created_at,
		comments: raw.comments,
		author: raw.user.login
	};
}

export async function fetchFromGithub(fetchImpl: typeof fetch = fetch): Promise<Issue[]> {
	const token = process.env.GITHUB_TOKEN;
	const response = await fetchImpl(API_URL, {
		headers: {
			Accept: 'application/vnd.github+json',
			'User-Agent': 'canonical-oss-explorer',
			...(token ? { Authorization: `Bearer ${token}` } : {})
		}
	});

	if (!response.ok) {
		throw new Error(`GitHub API responded with ${response.status}`);
	}

	const payload = (await response.json()) as { items?: RawIssue[] };
	if (!Array.isArray(payload.items)) {
		throw new Error('GitHub API response did not contain issues');
	}

	return payload.items.map(normaliseIssue);
}

/**
 * Live GitHub data with an in-memory TTL cache and an offline fallback.
 * The fallback keeps the demo usable when GitHub rate-limits or is unreachable.
 */
export async function getDataset(
	options: { fetchImpl?: typeof fetch; forceRefresh?: boolean; now?: number } = {}
): Promise<Dataset> {
	const { fetchImpl = fetch, forceRefresh = false, now = Date.now() } = options;

	if (!forceRefresh && cache && cache.expiresAt > now) {
		return cache.dataset;
	}

	try {
		const issues = await fetchFromGithub(fetchImpl);
		const dataset: Dataset = {
			issues,
			source: 'github',
			fetchedAt: new Date(now).toISOString()
		};
		cache = { dataset, expiresAt: now + CACHE_TTL_MS };
		return dataset;
	} catch (error) {
		const dataset: Dataset = {
			issues: snapshot.issues,
			source: 'snapshot',
			fetchedAt: snapshot.capturedAt,
			fallbackReason: error instanceof Error ? error.message : String(error)
		};
		cache = { dataset, expiresAt: now + CACHE_TTL_MS };
		return dataset;
	}
}

/** Test helper: avoids state leaking between unit tests. */
export function clearDatasetCache(): void {
	cache = null;
}
