import { getDataset } from '../lib/github';
import { buildIssuePage, parseIssueQuery } from '../lib/issues';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const query = parseIssueQuery(url.searchParams);
	const dataset = await getDataset();

	return {
		query,
		...buildIssuePage(dataset.issues, query),
		meta: {
			source: dataset.source,
			fetchedAt: dataset.fetchedAt,
			fallbackReason: dataset.fallbackReason
		}
	};
};
