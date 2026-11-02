import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class ReletterApi implements ICredentialType {
	name = 'reletterApi';
	displayName = 'Reletter API';
	icon: Icon = { light: 'file:../icons/reletter.svg', dark: 'file:../icons/reletter.dark.svg' };
	documentationUrl = 'https://reletter.com/developers';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'The API key from your Reletter account with API access enabled',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-reletter-api-key': '={{$credentials.apiKey}}',
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.reletter.com',
			url: '/api/accounts/quota/',
			method: 'GET',
		},
	};
}
