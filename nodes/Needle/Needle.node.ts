import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import * as NeedleApi from '@needle-ai/needle/v1';

export class Needle implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Needle',
		name: 'needle',
		icon: 'file:needle-logo-black.svg',
		group: ['search'],
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Search your collections on Needle',
		defaults: {
			name: 'Needle',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'needleApi',
				required: true,
			},
		],
		properties: [
			// Resources
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Collection',
						value: 'collection',
					},
				],
				default: 'collection',
			},

			// Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['collection'],
					},
				},
				options: [
					{
						name: 'List',
						value: 'list',
						action: 'List collections',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search a collection',
					},
				],
				default: 'search',
			},

			// Fields
			{
				displayName: 'Collection ID',
				name: 'collection_id',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['search'],
						resource: ['collection'],
					},
				},
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Prompt to ask Needle',
				placeholder: 'Ask Needle...',
				required: true,
				displayOptions: {
					show: {
						operation: ['search'],
						resource: ['collection'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const resource = this.getNodeParameter('resource', 0);
		const operation = this.getNodeParameter('operation', 0);

		console.log({ resource, operation });

		const items = this.getInputData();
		const responseData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				switch (resource) {
					case 'collection':
						switch (operation) {
							case 'list':
								await listCollections(this, i);
							case 'search':
								await searchCollection(this, i);
						}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					responseData.push({
						json: {} as IDataObject,
						error: error.message,
						index: i,
					});
					continue;
				}
				throw error;
			}
		}

		return [responseData];
	}
}

async function listCollections(
	functions: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const responseData: INodeExecutionData[] = [];
	const credentials = await functions.getCredentials('needleApi', index);
	const apiKey = credentials['api_key'] as string;
	if (!apiKey) {
		throw Error('API Key is required');
	}
	const ndl = new NeedleApi.Needle({ apiKey });
	const results = await ndl.collections.list();
	results.forEach((r) => responseData.push({ json: r, index: index }));
	return responseData;
}

async function searchCollection(
	functions: IExecuteFunctions,
	index: number,
): Promise<INodeExecutionData[]> {
	const responseData: INodeExecutionData[] = [];
	const collection_id = functions.getNodeParameter('collection_id', index) as string;
	const prompt = functions.getNodeParameter('prompt', index) as string;
	const credentials = await functions.getCredentials('needleApi', index);
	const apiKey = credentials['api_key'] as string;
	if (!apiKey) {
		throw Error('API Key is required');
	}
	const ndl = new NeedleApi.Needle({ apiKey });
	const results = await ndl.collections.search({ collection_id, text: prompt });
	results.forEach((r) => responseData.push({ json: r, index: index }));
	return responseData;
}
