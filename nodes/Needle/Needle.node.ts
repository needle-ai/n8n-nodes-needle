import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { Needle } from '@needle-ai/needle/v1';

export class NeedleNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Needle',
		name: 'needle',
		icon: 'file:needle.png',
		group: ['search'],
		version: 1,
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
			{
				displayName: 'Collection ID',
				name: 'collection_id',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				default: '',
				description: 'Prompt to ask Needle',
				placeholder: 'Ask Needle...',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const responseData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const collection_id = this.getNodeParameter('collection_id', i) as string;
				const prompt = this.getNodeParameter('prompt', i) as string;

				const credentials = await this.getCredentials('api_key', i);
				const apiKey = credentials['api_key'] as string;
				if (!apiKey) {
					throw Error('API Key is required');
				}

				const ndl = new Needle({ apiKey });

				const results = await ndl.collections.search({ collection_id, text: prompt });
				results.forEach((r) => responseData.push({ json: r, index: i }));
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

		return [items];
	}
}
