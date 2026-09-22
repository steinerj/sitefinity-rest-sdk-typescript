import { ClientOptions } from './core/client-options.js';
import { RestClient } from './rest-client.js';

export async function createRestClient(options: ClientOptions, metadataHash: string = ''): Promise<RestClient> {
    return new RestClient(options).initialize(metadataHash);
}
