import { ClientOptions } from './client-options.js';

export class CmsUrlService {
    constructor(private readonly options: ClientOptions) {}

    public getClientCmsUrl() {
        return (this.options.publicUrl ?? this.options.baseUrl).replace(/\/+$/, '');
    }

    public getServerCmsUrl() {
        return this.options.baseUrl.replace(/\/+$/, '');
    }

    public getServerCmsServiceUrl() {
        return this.options.serviceUrl?.replace(/\/+$/, '') ?? `${this.getServerCmsUrl()}/${this.getWebServicePath()}`;
    }

    public getWebServicePath() {
        return (this.options.servicePath || 'api/default').replace(/^\/+|\/+$/g, '');
    }

    public getSearchWebServicePath() {
        return this.options.searchServicePath?.trim().replace(/^\/+|\/+$/g, '') || this.getWebServicePath();
    }

    public getSearchServiceUrl() {
        return this.options.searchServiceUrl?.replace(/\/+$/, '') ?? `${this.getServerCmsUrl()}/${this.getSearchWebServicePath()}`;
    }
}