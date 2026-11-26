/** A deliberately small, transport-friendly issue shape. */
export type Issue = {
	id: number;
	number: number;
	title: string;
	repository: string;
	url: string;
	labels: string[];
	createdAt: string;
	comments: number;
	author: string;
};

export type DataSource = 'github' | 'snapshot';

export type Dataset = {
	issues: Issue[];
	source: DataSource;
	fetchedAt: string;
	/** Present when the live request failed and the bundled snapshot was used. */
	fallbackReason?: string;
};

export type SortKey = 'created' | 'comments' | 'title' | 'repository';

export type IssueQuery = {
	search: string;
	repository: string;
	label: string;
	sort: SortKey;
	order: 'asc' | 'desc';
	page: number;
	perPage: number;
};

export type Facet = { name: string; count: number };

export type IssueSummary = {
	total: number;
	repositories: number;
	labels: number;
	withoutComments: number;
	comments: number;
};

export type IssuePage = {
	items: Issue[];
	total: number;
	page: number;
	perPage: number;
	pageCount: number;
	summary: IssueSummary;
	repositoryFacets: Facet[];
	labelFacets: Facet[];
};
