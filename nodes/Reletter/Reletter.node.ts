import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { formatOutput } from './output';
import { applySearchFilters } from './search';

export class Reletter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Reletter',
		name: 'reletter',
		icon: { light: 'file:../../icons/reletter.svg', dark: 'file:../../icons/reletter.dark.svg' },
		group: ['input'],
		version: [1, 1.1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Search newsletters and retrieve Reletter data',
		defaults: { name: 'Reletter' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'reletterApi', required: true }],
		requestDefaults: {
			baseURL: 'https://api.reletter.com',
			headers: { Accept: 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Newsletter',
						value: 'newsletter',
					},
				],
				default: 'newsletter',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['newsletter'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get newsletter',
						description: 'Get details for one newsletter',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/publications/{{encodeURIComponent($parameter.publicationId)}}/',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'publication',
										},
									},
									formatOutput,
								],
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many newsletters',
						description: 'Search newsletters by topic, title, or author',
						routing: {
							request: {
								method: 'GET',
								url: '/api/search/publications/',
								qs: {
									query: '={{$parameter.query || undefined}}',
									mode: '={{$parameter.mode}}',
									page: 1,
									per_page: '={{$parameter.returnAll ? 100 : Math.min(100, $parameter.limit)}}',
								},
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'publications',
										},
									},
									formatOutput,
								],
							},
						},
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{
						name: 'Get Quota',
						value: 'getQuota',
						action: 'Get API quota',
						description: 'Get API request usage and allowance',
						routing: {
							request: {
								method: 'GET',
								url: '/api/accounts/quota/',
							},
						},
					},
				],
				default: 'getQuota',
			},
			{
				displayName: 'Newsletter ID',
				name: 'publicationId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. doomberg',
				description: 'The Reletter ID returned by a search or shown in the newsletter page URL',
				displayOptions: {
					show: {
						resource: ['newsletter'],
						operation: ['get'],
					},
				},
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. artificial intelligence',
				description: 'The topic, newsletter title, or author to search for',
				displayOptions: {
					show: {
						resource: ['newsletter'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Search By',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'Topic',
						value: 'topics',
					},
					{
						name: 'Newsletter Title',
						value: 'titles',
					},
					{
						name: 'Author',
						value: 'authors',
					},
				],
				default: 'topics',
				displayOptions: {
					show: {
						resource: ['newsletter'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'string',
				default: '',
				placeholder: 'e.g. active:is:true,languages:any:en',
				description:
					'Comma-separated Reletter search filters. See https://reletter.com/developers/search-filters.',
				displayOptions: {
					show: {
						'@version': [1],
						resource: ['newsletter'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						'@version': [1.1],
						resource: ['newsletter'],
						operation: ['getMany'],
					},
				},
				options: [
					{
						displayName: 'Filters',
						name: 'filters',
						type: 'string',
						default: '',
						placeholder: 'e.g. active:is:true,languages:any:en',
						description:
							'Comma-separated Reletter search filters. See https://reletter.com/developers/search-filters.',
					},
				],
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						resource: ['newsletter'],
						operation: ['getMany'],
					},
				},
				routing: {
					send: {
						paginate: true,
						preSend: [applySearchFilters],
					},
					operations: {
						pagination: {
							type: 'generic',
							properties: {
								request: {
									qs: {
										filters: '={{$request.qs.filters}}',
										query: '={{$parameter.query || undefined}}',
										mode: '={{$parameter.mode}}',
										page: '={{$response.body?.page ? $response.body.page + 1 : 1}}',
										per_page: '={{$parameter.returnAll ? 100 : Math.min(100, $parameter.limit)}}',
									},
								},
								continue:
									'={{$response.body.more === true && Array.isArray($response.body.publications) && $response.body.publications.length > 0 && ($parameter.returnAll || $response.body.page * Math.min(100, $parameter.limit) < $parameter.limit)}}',
							},
						},
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['newsletter'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				routing: {
					output: {
						maxResults: '={{$value}}',
					},
				},
			},
			{
				displayName: 'Output',
				name: 'output',
				type: 'options',
				options: [
					{
						name: 'Simplified',
						value: 'simplified',
						description: 'Return the most useful fields',
					},
					{
						name: 'Raw',
						value: 'raw',
						description: 'Return all available fields',
					},
					{
						name: 'Selected Fields',
						value: 'selected',
						description: 'Return chosen fields and the ID',
					},
				],
				default: 'simplified',
				displayOptions: {
					show: {
						resource: ['newsletter'],
					},
				},
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'multiOptions',
				options: [
					{
						name: 'Contributors',
						value: 'contributors',
					},
					{
						name: 'Description',
						value: 'description',
					},
					{
						name: 'Engagement',
						value: 'engagement',
					},
					{
						name: 'Est Subscribers',
						value: 'est_subscribers',
					},
					{
						name: 'ID',
						value: 'id',
					},
					{
						name: 'Language',
						value: 'language',
					},
					{
						name: 'Latest Issues',
						value: 'latest_issues',
					},
					{
						name: 'Name',
						value: 'name',
					},
					{
						name: 'Platform',
						value: 'platform',
					},
					{
						name: 'Rankings',
						value: 'rankings',
					},
					{
						name: 'Social',
						value: 'social',
					},
					{
						name: 'Subscribers',
						value: 'subscribers',
					},
					{
						name: 'URL',
						value: 'url',
					},
				],
				default: ['name'],
				description: 'Fields to include in each result. The ID is always included when available.',
				displayOptions: {
					show: {
						resource: ['newsletter'],
						output: ['selected'],
					},
				},
			},
		],
	};
}
