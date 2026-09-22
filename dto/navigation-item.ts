export interface NavigationItem {
    Key: string;
    Title: string;
    Url: string;
    LinkTarget: string;
    IsCurrentlyOpened: boolean;
    HasChildOpen: boolean;
    ChildNodes: NavigationItem[];
    PageSiteMapNode: FrontendSitemapPage
};

export interface FrontendSitemapPage {
    Id: string;
    ParentId: string;
    Title: string;
    HasChildren: boolean;
    AvailableLanguages: string[];
    Breadcrumb: string[];
    IsHomePage: boolean;
    Children: NavigationItem[],
    ViewUrl: string;
    PageType: PageType
}

export enum PageType {
    Standard,
    Group,
    Redirect
};
