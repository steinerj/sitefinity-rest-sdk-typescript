import { Dictionary } from './core/dictionary.js';
import { BreadcrumbItem } from './dto/breadcrumb-item.js';
import { CollectionResponse } from './dto/collection-response.js';
import { GenericContentItem } from './dto/generic-content-item.js';
import { NavigationItem } from './dto/navigation-item.js';
import { SdkItem } from './dto/sdk-item.js';
import { Widget } from './dto/widget.js';
import { CmsUrlService } from './core/root-url-service.js';
import { ClientOptions, HttpResponse } from './core/client-options.js';
import { HttpClient, RequestData } from './core/http-client.js';
import { ServiceMetadata } from './service-metadata.js';
import { CreateArgs } from './args/create.args.js';
import { CreateWidgetArgs } from './args/create-widget.args.js';
import { DeleteArgs } from './args/delete.args.js';
import { GetAllArgs } from './args/get-all.args.js';
import { GetBreadcrumbArgs } from './args/get-breadcrumb.args.js';
import { GetPageLayoutArgs } from './args/get-page-layout.args.js';
import { GetNavigationArgs } from './args/get-navigation.args.js';
import { ItemArgs } from './args/item.args.js';
import { LockArgs } from './args/lock-page.args.js';
import { PublishArgs } from './args/publish.args.js';
import { RelateArgs } from './args/relate.args.js';
import { ScheduleArgs } from './args/schedule.args.js';
import { UpdateArgs } from './args/update.args.js';
import { UploadMediaArgs } from './args/upload.args.js';
import { LayoutResponse, LayoutServiceResponse } from './dto/layout-service.response.js';
import { ODataFilterSerializer } from './services/odata-filter-serializer.js';
import { GetFormLayoutArgs } from './args/get-form-layout.args.js';
import { UserDto } from './dto/user-item.js';
import { ExternalProvider } from './dto/external-provider.js';
import { RegistrationSettingsDto } from './dto/registration-settings.js';
import { FacetsViewModelDto } from './dto/facets/facets-viewmodel-dto.js';
import { GetFacetsArgs } from './args/get-facets.args.js';
import { FacetFlatResponseDto } from './dto/facets/facet-flat-dto.js';
import { SearchArgs } from './args/perform-search.args.js';
import { SuggestionsArgs } from './args/get-search-suggestions.args.js';
import { SearchResultDocumentDto } from './dto/search-results-document-dto.js';
import { GetTaxonArgs } from './args/get-taxon.args.js';
import { TaxonDto } from './dto/taxon-dto.js';
import { GetTemplatesArgs } from './args/get-templates-args.js';
import { PageTemplateCategoryDto } from './dto/page-template-category.dto.js';
import { PageTemplateStatisticsDto } from './dto/page-template-statistics.dto.js';
import { WidgetModel } from './dto/widget-model.js';
import { SitefinityContentTypesFilterMetadataProvider } from './services/sitefinity-content-types-filter-metadata-provider.js';
import { GetHierarchicalWidgetModelArgs } from './args/get-hierarchical-widget-model.args.js';
import { CommonArgs } from './args/common.args.js';
import { GetLazyWidgetsArgs } from './args/get-lazy-widgets.args.js';
import { ErrorCodeException } from './errors/error-code.exception.js';
import { SiteDto } from './dto/site-item.js';
import { QueryParamNames } from './query-params-names.js';
import { ProviderDto } from './dto/provider.dto.js';
import { ChangeLocationPriorityArgs, MovingDirection } from './args/change-location-priority.args.js';
import { RequestArgs } from './args/request.args.js';
import { GetFacatebleFieldsArgs } from './args/get-facateble-fields.args.js';
import { GetSharedContentArgs } from './args/get-shared-content.args.js';
import { GetTemplatesStatisticsArgs } from './args/get-templates-statistics-args.js';
import { SearchMetadataDto } from './dto/search-metadata-dto.js';
import { ChangeTemplateArgs } from './args/change-template-args.js';
import { State } from './dto/state.js';
import { HttpError } from './errors/http-error.js';

/**
 * Provides implementation for communicating with the Sitefinity REST API services.
 * This class is used to perform CRUD operations on items, search for items, and manage content in Sitefinity.
 */
export class RestClient extends HttpClient {
    public readonly urls: CmsUrlService;
    public readonly metadata: ServiceMetadata;

    constructor(options: ClientOptions) {
        super(options);
        if (!/^https?:\/\/[^/?#]+(?:\/[^?#]*)?$/i.test(options.baseUrl)) {
            throw new Error('ClientOptions.baseUrl must be an absolute HTTP(S) CMS URL without a query or fragment.');
        }
        this.urls = new CmsUrlService(options);
        this.metadata = new ServiceMetadata(this);
    }

    public async initialize(metadataHash: string = '', traceContext?: any): Promise<this> {
        await this.metadata.fetch(metadataHash, traceContext);
        return this;
    }

    /**
     * Gets a media item with extended properties by type and id.
     * @param {ItemArgs} args The arguments for the request.
        *@param {string} args.type The type name of the item to retrieve.
        *@param {string} args.id The id of the item to retrieve.
        *@param {string} [args.culture] The culture for the request.
        *@param {string} [args.provider] The provider for the item if it is a part of non-default provider for the site and type.
     * @returns {Promise<T>} The requested item.
     */
    public getItemWithFallback<T extends SdkItem>(args: ItemArgs): Promise<T> {
        let queryParams: Dictionary = {
            sf_fallback_prop_names: '*',
            $select: '*'
        };

        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.GetItemWithFallback()${this.buildQueryParams(this.getQueryParams(args, queryParams))}`;
        return this.sendRequest<T>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }, true);
    }

    /**
     * Gets a collection of taxons based on request arguments.
     * @param {GetTaxonArgs}args The arguments for the request.
        * @param {string} args.taxonomyId The taxonomy type id to retrieve taxons from.
        * @param {string[]} args.taxaIds The ids of the taxons to retrieve. Used when selection mode is "Selected" or "UnderParent".
        * @param {'All' | 'TopLevel' | 'UnderParent' | 'Selected' | 'ByContentType'} args.selectionMode The selection mode for the taxons.
        * @param {string} args.contentType Filter taxons that refer a specific content type. Used when selection mode is "ByContentType".
        * @param {boolean} args.showEmpty Whether to show taxons that have no related content items.
        * @param {string} args.orderBy The order by clause for the taxons.
     * @returns {Promise<Array<TaxonDto>>} A collection of matching taxons.
     */
    public getTaxons(args: GetTaxonArgs): Promise<TaxonDto[]> {
        const queryParams = {
            'showEmpty': args.showEmpty.toString(),
            '$orderby': args.orderBy,
            '@param': `[${(args.taxaIds || []).map(x => `'${x}'`).toString()}]`
        };

        const taxonomy = this.metadata.taxonomies.find(x => x.Id === args.taxonomyId);
        if (!taxonomy) {
            throw `The taxonomy with id ${args.taxonomyId} does not exist`;
        }

        const action = `Default.GetTaxons(taxonomyId=${args.taxonomyId},selectedTaxaIds=@param,selectionMode='${args.selectionMode}',contentType='${args.contentType || ''}')`;
        const wholeUrl = `${this.buildItemBaseUrl(taxonomy['TaxaUrl'])}/${action}${this.buildQueryParams(this.getQueryParams(args, queryParams))}`;

        return this.sendRequest<{ value: SdkItem[] }>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }).then(x => x.value as TaxonDto[]);
    }

    public getSearchMetadata(args: RequestArgs) {
        const serviceUrl = this.urls.getServerCmsServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.GetSearchMetadata()`;

        return this.sendRequest<SearchMetadataDto>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, headers: args.additionalHeaders, traceContext: args.traceContext });
    }

    public getItemWithStatus<T extends SdkItem>(args: ItemArgs): Promise<T> {
        const filteredSimpleFields = this.getSimpleFields(args.type, args.fields || ['*']);
        const filteredRelatedFields = this.getRelatedFields(args.type, args.fields || ['*']);

        let queryParams = {
            $select: filteredSimpleFields.join(','),
            $expand: filteredRelatedFields.join(',')
        };

        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.GetItemWithStatus()${this.buildQueryParams(this.getQueryParams(args, queryParams))}`;

        return this.sendRequest<T>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders });
    }

    /**
     * Gets a content item by type and id.
     * @param {ItemArgs} args The arguments for the request.
        * @param {string} args.type The type name of the item to retrieve.
        * @param {string} args.id The id of the item to retrieve.
        * @param {string} [args.culture] The culture for the request.
        * @param {string[]} [args.fields] The fields to include in the response. By default the '*' wildcard is used and related fields are excluded.
        * @param {string} [args.provider] The provider for the item if it is a part of non-default provider for the site and type.
        * @param {Dictionary} [args.additionalQueryParams] Additional query parameters to include in the request.
        * @param {Dictionary} [args.additionalHeaders] Additional headers to include in the request.
        * @param {any} [args.additionalFetchData] Additional fetch data to include in the request.
        * @param {any} [args.traceContext] The current OpenTelemetry trace context for the request if such is available. It could be found in the WidgetContext.
     * @returns {Promise<T>} The requested item.
     */
    public getItem<T extends SdkItem>(args: ItemArgs): Promise<T> {
        const selectedFields = this.resolveSelectedFields(args.type, args.fields, args.additionalFields);
        const filteredSimpleFields = this.getSimpleFields(args.type, selectedFields.length > 0 ? selectedFields : ['*']);
        const filteredRelatedFields = this.getRelatedFields(args.type, selectedFields);

        let queryParams = {
            '$select': filteredSimpleFields.join(','),
            '$expand': filteredRelatedFields.join(',')
        };

        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})${this.buildQueryParams(this.getQueryParams(args, queryParams))}`;
        return this.sendRequest<T>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders });
    }

    /**
     * Gets a shared content block by id.
     * @param args The arguments for the request.
        * @param {string} args.id The id of the shared content block to retrieve.
        * @param {string} [args.cultureName] The culture for the request and the version of the shared content block content to retrieve.
     * @returns {Promise<GenericContentItem>} The requested content block.
     */
    public getSharedContent(args: GetSharedContentArgs): Promise<GenericContentItem> {
        let queryParams: {[key: string]: string} = {
            sf_fallback_prop_names: 'Content'
        };

        if (args.cultureName) {
            queryParams[QueryParamNames.Culture] = args.cultureName;
        }

        const wholeUrl = `${this.buildItemBaseUrl(RestSdkTypes.GenericContent)}/Default.GetItemById(itemId=${args.id})${this.buildQueryParams(this.getQueryParams(args, queryParams))}`;
        return this.sendRequest<GenericContentItem>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }, true);
    }

    /**
     * Gets a collection of items based on the provided arguments.
     * @param {GetAllArgs}args The get multiple items args.
        * @param {string} args.type The type name of the items to retrieve.
        * @param {number} [args.skip] The number of items to skip in the response.
        * @param {number} [args.take] The maximum number of items to return in the response.
        * @param {OrderBy} [args.orderBy] The order by clause to apply to the request.
        * @param {string} [args.provider] The provider for the items if they are part of a non-default provider for the site and type.
        * @param {string} [args.culture] The culture for the request.
        * @param {string[]} [args.fields] The fields to include in the response. By default the '*' wildcard is used and related fields are excluded.
        * @param {FilterClause | CombinedFilter | RelationFilter | DateOffsetPeriod | null} [args.filter] The filter to apply to the collection request.
        * @param {boolean} [args.count] Whether to include the total count of items in the response.
        * @param {Dictionary} [args.additionalQueryParams] Additional query parameters to include in the request.
        * @param {Dictionary} [args.additionalHeaders] Additional headers to include in the request.
        * @param {any} [args.additionalFetchData] Additional fetch data to include in the request.
        * @param {any} [args.traceContext] The current OpenTelemetry trace context for the request if such is available. It could be found in the WidgetContext.
     * @returns {Promise<CollectionResponse>} The wrepper object with a collection of the matched items if such exist. Otherwise an empty collection.
     */
    public getItems<T extends SdkItem>(args: GetAllArgs): Promise<CollectionResponse<T>> {
        const selectedFields = this.resolveSelectedFields(args.type, args.fields, args.additionalFields);

        const filteredSimpleFields = this.getSimpleFields(args.type, selectedFields);
        const filteredRelatedFields = this.getRelatedFields(args.type, selectedFields);

        let queryParams: { [key: string]: any } = {
            '$count': args.count,
            '$orderby': args.orderBy && args.orderBy.length > 0 ? args.orderBy.map(x => `${x.Name} ${x.Type}`) : null,
            '$select': filteredSimpleFields.join(','),
            '$expand': filteredRelatedFields.join(','),
            '$skip': args.skip,
            '$top': args.take,
            '$filter': args.filter ? new ODataFilterSerializer(new SitefinityContentTypesFilterMetadataProvider(this.metadata)).serialize({ Type: args.type, Filter: args.filter }) : null
        };

        const wholeUrl = `${this.buildItemBaseUrl(args.type)}${this.buildQueryParams(this.getQueryParams(args, queryParams))}`;
        return this.sendRequest<{ value: T[], '@odata.count'?: number }>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }).then((x) => {
            return <CollectionResponse<T>>{ Items: x.value, TotalCount: x['@odata.count'] };
        });
    }

    public createItem<T extends SdkItem>(args: CreateArgs): Promise<T> {
        let { type, data } = args;
        let taxonomyPrefix = 'Taxonomy_';
        if (type.startsWith(taxonomyPrefix)) {
            const actualTaxonomyType = type.substring(taxonomyPrefix.length);
            const taxonomy = this.metadata.taxonomies.find(x => x['Name'] === actualTaxonomyType) as SdkItem;
            if (!taxonomy) {
                throw new Error(`Taxonomy with the name ${actualTaxonomyType} does not exist`);
            }

            type = taxonomy['TaxaUrl'];
            data = { ...data, TaxonomyId: taxonomy.Id };
        }

        const wholeUrl = `${this.buildItemBaseUrl(type)}${this.buildQueryParams(this.getQueryParams(args, undefined))}`;

        return this.sendRequest({
            url: wholeUrl,
            data,
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        }).then((x) => {
            return x as T;
        });
    }

    public scheduleItem(args: ScheduleArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.Operation()${this.buildQueryParams(this.getQueryParams(args, undefined))}`;

        return this.sendRequest({
            url: wholeUrl,
            data: {
                action: 'Schedule',
                actionParameters: {
                    PublicationDate: args.publicationDate.toISOString(),
                    ExpirationDate: args.expirationDate?.toISOString()
                }
            },
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public updateItem(args: UpdateArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})${this.buildQueryParams(this.getQueryParams(args, undefined))}`;

        return this.sendRequest({
            url: wholeUrl,
            data: args.data,
            method: 'PATCH',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public deleteItem<T extends SdkItem>(args: DeleteArgs): Promise<T> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})${this.buildQueryParams(this.getQueryParams(args, undefined))}`;

        return this.sendRequest({
            url: wholeUrl,
            method: 'DELETE',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        }).then((x) => {
            return x as T;
        });
    }

    public publishItem(args: PublishArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.Operation()${this.buildQueryParams(this.getQueryParams(args, undefined))}`;
        return this.sendRequest({
            url: wholeUrl,
            data: {
                action: 'Publish',
                actionParameters: {}
            },
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public saveDraftItem(args: PublishArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/operation${this.buildQueryParams(this.getQueryParams(args, undefined))}`;
        return this.sendRequest({
            url: wholeUrl,
            data: {
                action: 'SaveDraft',
                actionParameters: {}
            },
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public syncPage(args: UpdateArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})${this.buildQueryParams(this.getQueryParams(args, undefined))}`;
        return this.sendRequest({
            url: wholeUrl,
            data: Object.assign({}, args.data, { EnableSync: true }),
            method: 'PATCH',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public lockItem(args: UpdateArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.SaveTemp()${this.buildQueryParams(this.getQueryParams(args, undefined))}`;
        return this.sendRequest({
            url: wholeUrl,
            data: Object.assign({}, args.data),
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public relateItem(args: RelateArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/${args.relationName}/$ref${this.buildQueryParams(this.getQueryParams(args, undefined))}`;

        const relatedTypeName = this.metadata.getRelatedType(args.type, args.relationName);
        if (!relatedTypeName) {
            throw `Cannot find the type behind the field -> ${args.relationName}`;
        }

        let relatedItemUri = `${this.buildItemBaseUrl(relatedTypeName)}(${args.relatedItemId})`;

        if (args.relatedItemProvider) {
            relatedItemUri = relatedItemUri + `?sf_provider=${encodeURIComponent(args.relatedItemProvider)}`;
        }
        return this.sendRequest({
            url: wholeUrl,
            data: {
                '@odata.id': relatedItemUri
            },
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public lockPage(args: LockArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.Lock()${this.buildQueryParams(this.getQueryParams(args, undefined))}`;
        return this.sendRequest({
            url: wholeUrl,
            data: {
                state: {
                    Version: args.version
                }
            },
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public createWidget(args: CreateWidgetArgs): Promise<Widget> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.AddWidget()${this.buildQueryParams(this.getQueryParams(args, undefined))}`;

        const properties: Array<{ Name: string, Value: string }> = [];

        if (args.properties) {
            Object.keys(args.properties).forEach((x) => {
                properties.push({
                    Name: x,
                    Value: (args.properties as any)[x]
                });
            });
        }

        const dto = {
            widget: {
                Id: null,
                Name: args.name,
                SiblingKey: args.siblingKey,
                ParentPlaceholderKey: args.parentPlaceholderKey,
                PlaceholderName: args.placeholderName,
                Properties: properties
            }
        };

        return this.sendRequest({
            url: wholeUrl,
            data: dto,
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public updateWidget(page: SdkItem , propertyValues: any) {
        const wholeUrl = `${this.buildItemBaseUrl(RestSdkTypes.Pages)}(${page.Id})/Default.SetProperties()${this.buildQueryParams(this.getQueryParams(propertyValues, undefined))}`;

        return this.sendRequest({
            url: wholeUrl,
            data: propertyValues,
            method: 'POST',
            headers: propertyValues.additionalHeaders,
            additionalFetchData: propertyValues.additionalFetchData,
            traceContext: propertyValues.traceContext
        });
    }

    public uploadItem(args: UploadMediaArgs): Promise<SdkItem> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}${this.buildQueryParams(this.getQueryParams(args, undefined))}`;
        const headers = { ...args.additionalHeaders };
        const data = Object.assign({}, args.fields, { Title: args.title, ParentId: args.parentId, UrlName: args.urlName });

        headers['X-Sf-Properties'] = JSON.stringify(data);
        headers['X-File-Name'] = args.fileName;
        headers['Content-Type'] = args.contentType;
        headers['Content-Encoding'] = 'base64';
        headers['DirectUpload'] = true.toString();

        return this.sendRequest({
            url: wholeUrl,
            data: args.binaryData,
            method: 'POST',
            headers,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        }).then((x) => {
            return x as SdkItem;
        });
    }

    public performSearch(args: SearchArgs) {
        const query = {
            ['indexCatalogue']: args.indexCatalogue,
            ['searchQuery']: args.searchQuery.toLowerCase(),
            ['wordsMode']: args.wordsMode,
            ['$orderBy']: args.orderBy,
            ['sf_culture']: args.culture,
            ['$skip']: args.skip?.toString(),
            ['$top']: args.take?.toString(),
            ['searchFields']: args.searchFields,
            ['highlightedFields']: args.highlightedFields,
            ['resultsForAllSites']: '',
            ['scoringInfo']: args.scoringInfo,
            ['filter']: args.filter,
            ['indexFields']: args.indexFields,
            ['$filter']: args.filterExpression?.toString() || ''
        };

        if (args.resultsForAllSites != null) {
            query['resultsForAllSites'] = args.resultsForAllSites ? '1' : '2';
        }

        const serviceUrl = args.webServicePath ?? this.urls.getSearchServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.PerformSearch()${this.buildQueryParams(this.getQueryParams(args, query))}`;
        const searchResultsDocumentsDefaultKeys = ['HighLighterResult', 'Language', 'Provider', 'Link', 'Title', 'ContentType', 'Id', 'ThumbnailUrl'];

        return this.sendRequest<{ TotalCount: number, SearchResults: SearchResultDocumentDto[] | any[] }>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }).then(x => {
            const mappedSearchResults : SearchResultDocumentDto[] = x.SearchResults.map(searchResult => {
                const document: SearchResultDocumentDto = {
                    HighLighterResult: searchResult.HighLighterResult,
                    Language: searchResult.Language,
                    Provider: searchResult.Provider,
                    Link: searchResult.Link,
                    Title: searchResult.Title,
                    ContentType: searchResult.ContentType,
                    Id: searchResult.Id,
                    ThumbnailUrl: searchResult.ThumbnailUrl,
                    IndexedFields: new Map<string, any>()
                };

                Object.keys(searchResult)
                .filter(p => !p.includes('@odata.type'))
                .forEach(propertyName=> {
                    // exclude the default properties and the odata typevalue properties
                    if (!searchResultsDocumentsDefaultKeys.includes(propertyName)) {
                        document.IndexedFields.set(propertyName, searchResult[propertyName]);
                    }
                });

                return document;
            });

            return {
                totalCount: x.TotalCount,
                searchResults: mappedSearchResults
            };
        });
    }

    public getSearchSuggestions(args: SuggestionsArgs) {
        const query = {
            ['indexName']: args.indexCatalogue,
            ['searchQuery']: args.searchQuery.toLowerCase(),
            ['sf_culture']: args.culture,
            ['siteId']: args.siteId,
            ['scoringInfo']: args.scoringInfo,
            ['suggestionFields']: args.suggestionFields,
            ['resultsForAllSites']: '',
            ['filterExpression']: args.filterExpression?.toString() || ''
        };

        if (args.resultsForAllSites != null) {
            query['resultsForAllSites'] = args.resultsForAllSites ? 'True' : 'False';
        }

        const serviceUrl = this.urls.getServerCmsServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.GetSuggestions()${this.buildQueryParams(this.getQueryParams(args, query))}`;
        return this.sendRequest<{value: string[]}>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders });
    }

    public getFacatebleFields(args: GetFacatebleFieldsArgs): Promise<FacetsViewModelDto[]> {
        const serviceUrl = this.urls.getServerCmsServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.GetFacetableFields(indexCatalogName='${args.indexCatalogue}')`;

        return this.sendRequest<{ value: FacetsViewModelDto[] }>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }).then(x => x.value);
    }

    public async getFacets(args: GetFacetsArgs): Promise<FacetFlatResponseDto[]> {
        const facetsStr = JSON.stringify(args.facets);
        const additionalQueryParams = {
            ['searchQuery']: args.searchQuery?.toLowerCase(),
            ['sf_culture']: args.culture,
            ['indexCatalogName']: args.indexCatalogue,
            ['filter']: args.filter,
            ['resultsForAllSites']: args.resultsForAllSites,
            ['searchFields']: args.searchFields,
            ['facetFields']: facetsStr,
            ['$filter']: args.filterExpression?.toString() || ''
        };

        const serviceUrl = this.urls.getServerCmsServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.GetFacets()${this.buildQueryParams(this.getQueryParams(undefined, additionalQueryParams))}`;

        return this.sendRequest<{ value: FacetFlatResponseDto[] }>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }).then(x => x.value);
    }

    public getResetPasswordModel(token: string, traceContext?: any, headers?: Dictionary): Promise<RegistrationSettingsDto> {
        const serviceUrl = this.urls.getServerCmsServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.GetResetPasswordModel()`;

        return this.sendRequest<RegistrationSettingsDto>({ url: wholeUrl, data: { securityToken: token }, method: 'POST', traceContext, headers });
    }

    public getRegistrationSettings(args: RequestArgs): Promise<RegistrationSettingsDto> {
        const serviceUrl = this.urls.getServerCmsServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.RegistrationSettings()${this.buildQueryParams(this.getQueryParams(args, {}))}`;

        return this.sendRequest<RegistrationSettingsDto>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders });
    }

    public activateAccount(encryptedParam: string, traceContext?: any, headers?: Dictionary): Promise<void> {
        const serviceUrl = this.urls.getServerCmsServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.AccountActivation()${this.buildQueryParams({ qs: encryptedParam })}`;

        return this.sendRequest({ url: wholeUrl, traceContext, headers }, true);
    }

    public getExternalProviders(args: RequestArgs): Promise<ExternalProvider[]> {
        const serviceUrl = this.urls.getServerCmsServiceUrl();
        const wholeUrl = `${serviceUrl}/Default.GetExternalProviders()`;

        return this.sendRequest<{ value: ExternalProvider[] }>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }).then((x) => x.value);
    }

    public getCurrentUser(args?: RequestArgs): Promise<UserDto> {
        const wholeUrl = `${this.buildItemBaseUrl('users')}/current${this.buildQueryParams(this.getQueryParams(args, {}))}`;

        return this.sendRequest<{ value: UserDto }>({
            url: wholeUrl,
            method: 'GET',
            additionalFetchData: args?.additionalFetchData,
            traceContext: args?.traceContext,
            headers: args?.additionalHeaders
        }).then((x) => {
            return x.value;
        });
    }

    public getCurrentSite(args?: RequestArgs): Promise<SiteDto> {
        const wholeUrl = `${this.buildItemBaseUrl('sites')}/current`;

        return this.sendRequest<{ value: SiteDto }>({
            url: wholeUrl,
            method: 'GET',
            additionalFetchData: args?.additionalFetchData,
            traceContext: args?.traceContext,
            headers: args?.additionalHeaders
        }).then((x) => {
            return x.value;
        });
    }

    public getSites(args?: RequestArgs): Promise<SiteDto[]> {
        const wholeUrl = `${this.buildItemBaseUrl('sites')}${this.buildQueryParams(this.getQueryParams(args, {}))}`;

        return this.sendRequest<{ value: SiteDto[] }>({
            url: wholeUrl,
            method: 'GET',
            additionalFetchData: args?.additionalFetchData,
            traceContext: args?.traceContext,
            headers: args?.additionalHeaders
        }).then((x) => {
            return x.value;
        });
    }

    public getNavigation(args: GetNavigationArgs): Promise<NavigationItem[]> {
        let queryMap: { [key: string]: any } = {
            'selectionModeString': args.selectionMode,
            'showParentPage': args.showParentPage ? args.showParentPage.toString() : undefined,
            'sf_page_node': args.currentPage,
            'selectedPages': args.selectedPages && args.selectedPages.length > 0 ? JSON.stringify(args.selectedPages) : undefined,
            'levelsToInclude': args.levelsToInclude ? args.levelsToInclude.toString() : null,
            'selectedPageId': args.selectedPageId
        };

        const wholeUrl = `${this.buildItemBaseUrl(RestSdkTypes.Pages)}/Default.HierarhicalByLevelsResponse()${this.buildQueryParams(this.getQueryParams(args, queryMap))}`;

        return this.sendRequest<{ value: NavigationItem[], '@odata.count': number }>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }).then((x) => {
            return x.value;
        });
    }

    public getBreadcrumb(args: GetBreadcrumbArgs): Promise<BreadcrumbItem[]> {
        const { additionalHeaders, additionalFetchData, additionalQueryParams, traceContext, ...breadcrumbArgs } = args;
        const queryMap = Object.fromEntries(Object.entries(breadcrumbArgs)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([name, value]) => [name, name === 'detailItemInfo' ? JSON.stringify(value) : String(value)]));

        const wholeUrl = `${this.buildItemBaseUrl(RestSdkTypes.Pages)}/Default.GetBreadcrumb()${this.buildQueryParams(this.getQueryParams(args, queryMap))}`;
        return this.sendRequest<{ value: BreadcrumbItem[], '@odata.count'?: number }>({ url: wholeUrl, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext, headers: args.additionalHeaders }).then((x) => {
            return x.value;
        });
    }

    public setHomePage(args: ItemArgs): Promise<void> {
        const wholeUrl = `${this.buildItemBaseUrl(RestSdkTypes.Pages)}/Default.SetHomePage()${this.buildQueryParams(this.getQueryParams(args, undefined))}`;
        return this.sendRequest({
            url: wholeUrl,
            data: {
                pageId: args.id
            },
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public async getPreviewLink(args: ItemArgs): Promise<any> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.Operation()${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;
        return this.sendRequest({
            url: wholeUrl,
            data: {
                'action': 'Preview'
            },
            method: 'POST',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public async getPageSharePreviewLink(pageId: string): Promise<any> {
        const wholeUrl = `${this.buildItemBaseUrl(RestSdkTypes.Pages)}(${pageId})/Default.SharePreviewLink()${this.buildQueryParams(this.getQueryParams())}`;
        return this.sendRequest({
            url: wholeUrl,
            method: 'GET'
        });
    }

    public async getContentLocations(args: CommonArgs): Promise<any> {
        const wholeUrl = `${this.urls.getServerCmsUrl() || ''}/Sitefinity/Services/LocationService/${this.buildQueryParams({itemType: args.type, provider: args.provider})}`;
        return this.sendRequest({
            url: wholeUrl,
            method: 'GET',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData
        });
    }

    public async getDisplayPages(args: ItemArgs): Promise<any> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/DisplayPages${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;
        return this.sendRequest({
            url: wholeUrl,
            method: 'GET',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData
        });
    }

    public async getProviders(args: CommonArgs): Promise<any> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}/sfproviders`;
        return this.sendRequest<{ value: ProviderDto[] } >({
            url: wholeUrl,
            method: 'GET',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData
        }).then((x) => {
            return x.value;
        });
    }

    public async changeLocationPriority(args: ChangeLocationPriorityArgs): Promise<any> {
        const direction = args.direction ?? MovingDirection.Top;
        const directionCode = direction.toString();
        const wholeUrl = `${this.urls.getServerCmsUrl() || ''}/Sitefinity/Services/LocationService/${this.buildQueryParams({'id': args.id, 'direction': directionCode})}`;
        return this.sendRequest({
            url: wholeUrl,
            method: 'PUT',
            headers: args.additionalHeaders,
            additionalFetchData: args.additionalFetchData,
            traceContext: args.traceContext
        });
    }

    public async getFormLayout(args: GetFormLayoutArgs): Promise<LayoutServiceResponse> {
        const wholeUrl = `${this.buildItemBaseUrl(RestSdkTypes.Form)}(${args.id})/Default.Model()${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;
        return this.sendRequest({ url: wholeUrl, headers: args.additionalHeaders, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext });
    }

    public async getWidgetModel(args: GetHierarchicalWidgetModelArgs): Promise<WidgetModel<any>> {
        args.additionalQueryParams = args.additionalQueryParams || {};
        args.additionalQueryParams.sfwidgetsegment = args.widgetSegmentId || '';
        args.additionalQueryParams.segment = args.segmentId || '';

        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.HierarchicalWidgetModel(componentId='${args.widgetId}')${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;
        return this.sendRequest({ url: wholeUrl, headers: args.additionalHeaders, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext });
    }

    public async getLazyWidget(args: GetHierarchicalWidgetModelArgs): Promise<WidgetModel<any> | undefined> {
        args.additionalQueryParams = args.additionalQueryParams || {};
        args.additionalQueryParams.sfwidgetsegment = args.widgetSegmentId || '';
        args.additionalQueryParams.segment = args.segmentId || '';

        let lazyComponentsUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.LazyComponents()${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;

        return this.sendRequest<{ Components: Array<WidgetModel<any>> }>({ url: lazyComponentsUrl, headers: args.additionalHeaders, additionalFetchData: args.additionalFetchData }).then(x => x.Components.find(y => y.Id === args.widgetId));
    }

    public async getLazyWidgets(args: GetLazyWidgetsArgs): Promise<Array<WidgetModel<any>>> {
        const query = this.getQueryParams(args, {
            '@param': `'${args.url.replace(/'/g, "''")}'`,
            correlationId: args.correlationId
        });
        const lazyComponentsUrl = `${this.urls.getServerCmsServiceUrl()}/Default.LazyComponents(url=@param)${this.buildQueryParams(query)}`;
        const headers = { ...args.additionalHeaders };
        if (args.cookie) {
            headers['Cookie'] = args.cookie;
        }
        const referrer = args.referrer;
        if (referrer && referrer.length > 0) {
            headers['SF_URL_REFERER'] = referrer;
        } else {
            headers['SF_NO_URL_REFERER'] = 'true';
        }

        return this.sendRequest<{ Components: Array<WidgetModel<any>> }>({ url: lazyComponentsUrl, headers, additionalFetchData: args.additionalFetchData, traceContext: args.traceContext }).then(x => x.Components);
    }

    public async getPageLayout(args: GetPageLayoutArgs): Promise<LayoutResponse> {
        return this.loadPageLayout(args, 0);
    }

    private async loadPageLayout(args: GetPageLayoutArgs, redirects: number): Promise<LayoutResponse> {
        if (redirects > (args.maxRedirects ?? 10)) {
            throw new Error('The page layout redirect limit was exceeded.');
        }
        const headers: Dictionary = {
            'Accept': 'application/json',
            'X-SFRENDERER-PROXY': 'true',
            'X-SF-WEBSERVICEPATH': this.urls.getWebServicePath(),
            ...args.additionalHeaders
        };
        if (args.cookie) {
            headers['Cookie'] = args.cookie;
        }
        const queryParams = { ...args.queryParams };
        if (args.relatedFields) {
            queryParams['$expand'] = args.relatedFields.join(',');
        }
        const baseUrl = this.urls.getServerCmsUrl();
        let pagePath = args.pagePath;
        if (/^https?:\/\//i.test(pagePath)) {
            if (pagePath !== baseUrl && !pagePath.startsWith(`${baseUrl}/`)) {
                throw new Error('Page layout requests cannot leave the configured CMS base URL.');
            }
            pagePath = pagePath.slice(baseUrl.length) || '/';
        }
        if (/^[a-z][a-z\d+.-]*:/i.test(pagePath) || pagePath.startsWith('//') || pagePath.includes('\\')) {
            throw new Error('pagePath must be a CMS-relative path or an absolute URL under baseUrl.');
        }
        pagePath = '/' + pagePath.replace(/^\/+/, '');
        const query = this.buildQueryParams(queryParams);
        const path = pagePath + (pagePath.includes('?') ? query.replace(/^\?/, '&') : query);
        const url = this.options.nextGen
            ? `${this.urls.getServerCmsServiceUrl()}/Default.Model(url=@param)${this.buildQueryParams({ '@param': `'${path.replace(/'/g, "''")}'` })}`
            : baseUrl + path;
        const requestData: RequestData = {
            url,
            headers,
            method: 'GET',
            traceContext: args.traceContext,
            additionalFetchData: { ...args.additionalFetchData, redirect: 'manual' }
        };
        const httpLayoutResponse = await this.request(requestData);
        if (httpLayoutResponse.status === 0) {
            throw new Error('The transport cannot expose this layout response or redirect. Use a backend proxy or a transport that exposes redirect headers.');
        }

        if (httpLayoutResponse.status === 302 && httpLayoutResponse.headers.has('urlparameters')) {
            const urlParameters = httpLayoutResponse.headers.get('urlparameters')!.split('/');
            const location = httpLayoutResponse.headers.get('location');
            if (!location) {
                throw new Error('The layout redirect has no Location header.');
            }
            const layoutRecursive = await this.loadPageLayout({ ...args, pagePath: location }, redirects + 1);
            if (layoutRecursive.layout) {
                layoutRecursive.layout.UrlParameters = urlParameters;
            }
            return layoutRecursive;
        }

        if ([301, 302, 303, 307, 308].includes(httpLayoutResponse.status)) {
            const location = httpLayoutResponse.headers.get('location');
            if (!location) {
                throw new Error('The layout redirect has no Location header.');
            }
            if (!args.followRedirects) {
                return {
                    isRedirect: true,
                    redirect: {
                        Location: location,
                        Permenant: httpLayoutResponse.status === 301 || httpLayoutResponse.status === 308
                    }
                };
            }
            return this.loadPageLayout({ ...args, pagePath: location }, redirects + 1);
        }

        if (httpLayoutResponse.status === 404) {
            throw new ErrorCodeException('NotFound', 'page not found');
        }

        const layoutResponse = await this.handleApiResponse<LayoutServiceResponse>(httpLayoutResponse, requestData, true);
        if (!layoutResponse?.ComponentContext) {
            throw new Error('The CMS did not return a page layout model. Check the renderer headers and layout endpoint configuration.');
        }

        const cacheControl = httpLayoutResponse.headers.get('Cache-Control');
        if (cacheControl && layoutResponse) {
            layoutResponse.CacheControl = cacheControl;
        }

        return {
            isRedirect: false,
            layout: layoutResponse
        };
    }

    public async getTemplates(args: GetTemplatesArgs): Promise<PageTemplateCategoryDto[]> {
        const apiPath = this.getSystemRoutePath();
        const wholeUrl = `${this.urls.getServerCmsUrl()}/${apiPath}/${args.type}/Default.GetPageTemplates(selectedPages=[${args.selectedPages.map(x => `'${x}'`).join(',')}])${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;

        return this.sendRequest<{ value: PageTemplateCategoryDto[] } >({ url: wholeUrl, headers: args.additionalHeaders, additionalFetchData: args.additionalFetchData }).then(x => x.value);
    }

    public async getState(args: ItemArgs): Promise<State> {
        const wholeUrl = `${this.buildItemBaseUrl(args.type)}(${args.id})/Default.GetState()${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;
        return this.sendRequest<State>({ url: wholeUrl, headers: args.additionalHeaders, additionalFetchData: args.additionalFetchData });
    }

    public async changeTemplate(args: ChangeTemplateArgs): Promise<void> {
        const wholeUrl = `${this.urls.getServerCmsUrl()}/sf/system/${this.metadata.getSetNameFromType(args.type)}/Default.ChangePageTemplate()${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;
        const data = {
            selectedPages: args.selectedPages,
            templateId: args.templateId ?? '00000000-0000-0000-0000-000000000000',
            templateName: args.templateName
        };

        return this.sendRequest({ url: wholeUrl, method: 'POST', data, headers: args.additionalHeaders, additionalFetchData: args.additionalFetchData });
    }

    public async getTemplatesStatistics(args: GetTemplatesStatisticsArgs): Promise<PageTemplateStatisticsDto[]> {
        const apiPath = this.getSystemRoutePath();
        args.additionalQueryParams = args.additionalQueryParams || {};
        args.additionalQueryParams['@param'] = `[${args.templateNames.map(x => `'${x}'`).join(',')}]`;
        const rendererName = (this.options.rendererName || '').replace(/'/g, "''");
        const wholeUrl = `${this.urls.getServerCmsUrl()}/${apiPath}/pages/Default.GetTemplateStatistics(templateNames=@param, renderer='${rendererName}')${this.buildQueryParams(this.getQueryParams(undefined, args.additionalQueryParams))}`;
        return this.sendRequest<{ value: PageTemplateStatisticsDto[] } >({ url: wholeUrl, headers: args.additionalHeaders, additionalFetchData: args.additionalFetchData }).then(x => x.value);
    }

    private resolveSelectedFields(type: string, fields?: string[], additionalFields?: string[]): string[] {
        let effectiveFields = fields || [];
        const allFieldsSelected = effectiveFields.length === 1 && effectiveFields[0] === '*';

        // Append additional fields to the ones selected by default
        if (!allFieldsSelected && additionalFields && additionalFields.length > 0) {
            const selectedByDefaultFields = effectiveFields.length > 0
                ? effectiveFields
                : this.metadata.getSelectedByDefaultFields(type);

            const uniqueAdditional = additionalFields.filter(f => !selectedByDefaultFields.includes(f));
            effectiveFields = [...selectedByDefaultFields, ...uniqueAdditional];
        }

        return effectiveFields;
    }

    private getSimpleFields(type: string, fields: string[]): string[] {
        let star = '*';
        if (fields != null && fields.length === 1 && fields[0] === star) {
            return [star];
        }

        let simpleFields = this.metadata.getSimpleFields(type);
        return fields.filter(x => simpleFields.some(y => y === x));
    }

    private getRelatedFields(type: string, fields: string[]): string[] {
        let star = '*';
        if (fields != null && fields.length === 1 && fields[0] === star) {
            return [star];
        }

        const result: string[] = [];
        const relatedFields = this.metadata.getRelationFields(type);
        const pattern = /(?<fieldName>.+?)\((?<nested>.+)\)/;
        fields.forEach((field) => {
            const fieldMatch = field.match(pattern);
            if (!fieldMatch && relatedFields.some(x => x === field)) {
                result.push(field);
            } else if (fieldMatch && fieldMatch.groups) {
                const fieldName = fieldMatch.groups['fieldName'];
                if (relatedFields.some(x => x === fieldName)) {
                    const innerFields = fieldMatch.groups['nested'];
                    const relatedFieldsInput = this.parseInnerFields(innerFields.replaceAll(' ', ''));

                    const relatedTypeName = this.metadata.getRelatedType(type, fieldName);
                    if (relatedTypeName) {
                        let relatedSimpleFields = this.metadata.getSimpleFields(relatedTypeName);
                        relatedSimpleFields = relatedFieldsInput.filter(x => relatedSimpleFields.some(y => y === x));

                        let simpleFieldsJoined: string | null = null;
                        if (relatedSimpleFields.length > 0) {
                            simpleFieldsJoined = relatedSimpleFields.join(',');
                            simpleFieldsJoined = `$select=${simpleFieldsJoined}`;
                        }

                        const relatedRelationFields = this.getRelatedFields(relatedTypeName, relatedFieldsInput);
                        let relatedRelationFieldsJoined: string | null = null;
                        if (relatedRelationFields.length > 0) {
                            relatedRelationFieldsJoined = relatedRelationFields.join(',');
                            relatedRelationFieldsJoined = `$expand=${relatedRelationFieldsJoined}`;
                        }

                        let resultString: string | null = null;
                        if (relatedRelationFieldsJoined && simpleFieldsJoined) {
                            resultString = `${fieldName}(${simpleFieldsJoined};${relatedRelationFieldsJoined})`;
                        } else if (relatedRelationFieldsJoined) {
                            resultString = `${fieldName}(${relatedRelationFieldsJoined})`;
                        } else if (simpleFieldsJoined) {
                            resultString = `${fieldName}(${simpleFieldsJoined})`;
                        }

                        if (resultString) {
                            result.push(resultString);
                        }
                    }
                }
            }
        });

        return result;
    }

    private parseInnerFields (input: string): string[] {
        const allFields: string[] = [];

        let fieldStartIndex = 0;
        let charIterator = 0;
        let openingBraceCounter = 0;
        let closingBraceCounter = 0;

        for (let i = 0; i < input.length; i++) {
            charIterator++;
            const character = input[i];
            if (character === '(') {
                openingBraceCounter++;
            }

            if (character === ')') {
                closingBraceCounter++;
            }

            if (character === ',') {
                if (openingBraceCounter > 0 && openingBraceCounter === closingBraceCounter) {
                    let relatedField = input.substring(fieldStartIndex, fieldStartIndex + charIterator - fieldStartIndex - 1).trim();
                    allFields.push(relatedField);
                    fieldStartIndex = charIterator;
                    openingBraceCounter = 0;
                    closingBraceCounter = 0;
                } else if (openingBraceCounter === 0 && closingBraceCounter === 0) {
                    let basicField = input.substring(fieldStartIndex, fieldStartIndex + charIterator - fieldStartIndex - 1).trim();
                    allFields.push(basicField);
                    fieldStartIndex = charIterator;
                }
            }
        }

        if (fieldStartIndex < charIterator) {
            let lastField = input.substring(fieldStartIndex, fieldStartIndex +  charIterator - fieldStartIndex).trim();
            allFields.push(lastField);
        }

        return allFields;
    }

    public buildQueryParams(queryParams?: { [key: string]: unknown }): string {
        const merged = { ...this.options.queryParams, ...this.options.getQueryParams?.(), ...queryParams };
        const query = Object.entries(merged)
            .filter(([, value]) => value !== undefined && value !== null && value !== '')
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&');
        return query ? `?${query}` : '';
    }

    private getQueryParams(args?: RequestArgs, queryParams?: Dictionary) {
        let queryParamsFromArgs: Dictionary = {};

        if (args) {
            const commonArgs = args as CommonArgs;
            if (commonArgs) {
                if (commonArgs.provider) {
                    queryParamsFromArgs[QueryParamNames.Provider] = commonArgs.provider;
                }

                if (commonArgs.culture) {
                    queryParamsFromArgs[QueryParamNames.Culture] = commonArgs.culture;
                }
            }
        }

        return Object.assign({}, queryParamsFromArgs, args?.additionalQueryParams || {}, queryParams || {});
    }

    public async sendRequest<T>(request: RequestData, throwErrorAsJson?: boolean): Promise<T> {
        const response = await this.request(request);
        return this.handleApiResponse<T>(response, request, throwErrorAsJson);
    }

    public buildItemBaseUrl(itemType: string): string {
        let serviceUrl = this.urls.getServerCmsServiceUrl();
        const setName = this.metadata.getSetNameFromType(itemType);

        return `${serviceUrl}/${setName}`;
    }

    private async handleApiResponse<T>(response: HttpResponse, request: RequestData, throwErrorAsJson?: boolean): Promise<T> {
        const contentType = response.headers.get('content-type')?.toLowerCase() || '';
        const isJson = contentType.includes('application/json') || contentType.includes('+json');
        if (response.status < 200 || response.status >= 300) {
            const body = isJson ? await response.json() : await response.text();
            if (throwErrorAsJson && body?.error?.code && body?.error?.message) {
                throw new ErrorCodeException(body.error.code, body.error.message);
            }
            throw new HttpError(response.status, request.method || 'GET', request.url, body);
        }
        if (response.status === 204 || request.method === 'HEAD') {
            return undefined as T;
        }
        return isJson ? response.json() : undefined as T;
    }

    private getSystemRoutePath() {
        let apiPath = 'sf/system';
        if (this.options.nextGen) {
            apiPath = 'sf/cms/api/v1/system';
        }

        return apiPath;
    }
}

export class RestSdkTypes {
    public static readonly Video: string = 'Telerik.Sitefinity.Libraries.Model.Video';
    public static readonly Image: string = 'Telerik.Sitefinity.Libraries.Model.Image';
    public static readonly Document: string = 'Telerik.Sitefinity.Libraries.Model.Document';
    public static readonly DocumentLibrary: string = 'Telerik.Sitefinity.Libraries.Model.DocumentLibrary';
    public static readonly News: string = 'Telerik.Sitefinity.News.Model.NewsItem';
    public static readonly Taxonomies: string = 'Telerik.Sitefinity.Taxonomies.Model.Taxonomy';
    public static readonly Tags: string = 'Taxonomy_Tags';
    public static readonly Categories: string = 'Taxonomy_Categories';
    public static readonly GenericContent: string = 'Telerik.Sitefinity.GenericContent.Model.ContentItem';
    public static readonly Pages: string = 'Telerik.Sitefinity.Pages.Model.PageNode';
    public static readonly PageTemplates: string = 'Telerik.Sitefinity.Pages.Model.PageTemplate';
    public static readonly Form: string = 'Telerik.Sitefinity.Forms.Model.FormDescription';
    public static readonly Site: string = 'Telerik.Sitefinity.Multisite.Model.Site';
    public static readonly Blog: string = 'Telerik.Sitefinity.Blogs.Model.Blog';
    public static readonly Event: string = 'Telerik.Sitefinity.Events.Model.Event';
    public static readonly Calendar: string = 'Telerik.Sitefinity.Events.Model.Calendar';
    public static readonly BlogPost: string = 'Telerik.Sitefinity.Blogs.Model.BlogPost';
    public static readonly Author: string = 'Telerik.Sitefinity.DynamicTypes.Model.Authors.Author';
    public static readonly List: string = 'Telerik.Sitefinity.Lists.Model.List';
    public static readonly ListItem: string = 'Telerik.Sitefinity.Lists.Model.ListItem';
}

