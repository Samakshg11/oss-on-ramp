import { json } from '@sveltejs/kit';
import { getDataset } from '../../../lib/github';
import { buildIssuePage, parseIssueQuery } from '../../../lib/issues';
import type { RequestHandler } from './$types';

/**
 * GET /api/issues
 *
 * Query parameters: search, repository, label, sort, order, page, perPage.
 * `refresh=1` bypasses the in-memory cache and refetches from GitHub.
 */
export const GET: RequestHandler = async ({ url, request, setHeaders }) => {
	const query = parseIssueQuery(url.searchParams);
	const dataset = await getDataset({ forceRefresh: url.searchParams.get('refresh') === '1' });
	const result = buildIssuePage(dataset.issues, query);

	const etag = `"${dataset.fetchedAt}-${dataset.issues.length}-${url.searchParams.toString()}"`;
	if (request.headers.get('if-none-match') === etag) {
		return new Response(null, { status: 304, headers: { ETag: etag } });
	}

	setHeaders({
		'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
		ETag: etag,
		'X-Data-Source': dataset.source,
		'X-Fetched-At': dataset.fetchedAt
	});

	return json({
		data: result,
		query,
		meta: {
			source: dataset.source,
			fetchedAt: dataset.fetchedAt,
			fallbackReason: dataset.fallbackReason
		}
	});
};
