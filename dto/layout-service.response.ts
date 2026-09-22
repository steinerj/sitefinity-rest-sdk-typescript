import { DetailItem } from './detail-item.js';
import { WidgetModel } from './widget-model.js';
import { RedirectResponse } from './redirect.response.js';
import { PageScript } from './scripts.js';

export interface PartialLayoutServiceResponse {
    Culture: string;
    SiteId: string;
    Id: string;
    MetaInfo: {
        Title: string,
        Description: string,
        HtmlInHeadTag: string,
        OpenGraphTitle: string,
        OpenGraphDescription: string,
        OpenGraphImage: string,
        OpenGraphVideo: string,
        OpenGraphType: string,
        OpenGraphSite: string,
        CanonicalUrl: string,
    },
    UrlParameters: string[],
    Fields: { [key: string]: any },
    Site: any
}

export interface LayoutServiceResponse extends PartialLayoutServiceResponse {
    ComponentContext: ComponentContext,
    DetailItem?: DetailItem,
    Scripts: PageScript[],
    TemplateName?: string,
    MetadataHash: string,
    CacheControl?: string
}

export interface LayoutResponse {
    isRedirect: boolean;
    redirect?: RedirectResponse;
    layout?: LayoutServiceResponse;
}

export interface ComponentContext {
    Components: WidgetModel[];
    HasLazyComponents: boolean;
    OrphanedControls: WidgetModel[];
}
