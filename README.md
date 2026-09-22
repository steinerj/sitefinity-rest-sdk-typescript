# Sitefinity REST SDK

A TypeScript/JavaScript client for Sitefinity content, search, media, and page-layout services. Originally extracted from the Sitefinity Next.js renderer, then used in a React Native application. This package keeps the REST client and leaves the renderer behind.

Use it from Node, a browser application, or a runtime with a compatible HTTP transport. No React or Next.js installation required. Plain JavaScript is fine; TypeScript declarations come with the build.

This is a pre-release SDK, not a wrapper for every Sitefinity API. License terms are in [EULA.md](EULA.md).

## Contents

- [Setup and first run](#setup-and-first-run)
- [Node examples](#node-examples)
- [Use in another project](#use-in-another-project)
- [Content, filters, and writes](#content-filters-and-writes)
- [Authentication and configuration](#authentication-and-configuration)
- [Browsers and React Native](#browsers-and-react-native)
- [Page layouts and caching](#page-layouts-and-caching)
- [Troubleshooting](#troubleshooting)
- [Development and publishing](#development-and-publishing)

## System prerequisites / tested with

- Node.js 22 or 24 and npm for development and examples. Local verification used Node 22.8.0 on Windows; CI is configured for both versions on Linux and Windows.
- The `tar` command for the optional package-artifact check, available on modern Windows, macOS, Linux, and the configured GitHub runners.
- A licensed Sitefinity instance with a configured web service, typically `api/default`. Bring your own CMS; this project does not provision one.
- For content commands, the service must expose `sfmeta`, `taxonomies`, and the requested content types, with anonymous access or suitable authentication.
- Search needs a populated index. Layouts need a supported endpoint and any renderer registration/routing headers required by the deployment.

The core targets ES2022 and has no runtime package dependencies. It requires native `fetch` or an injected transport. Older browser/mobile engines may need transpilation and polyfills; this package does not supply them.

## Setup and first run

From the repository root:

```sh
npm ci
npm run build
npm run example -- --help
```

The build produces both module formats without contacting a CMS or changing content.

Copy the commented [environment template](examples/node/.env.example) to `examples/node/.env`:

```powershell
Copy-Item examples/node/.env.example examples/node/.env
```

On macOS/Linux:

```sh
cp examples/node/.env.example examples/node/.env
```

Set `SITEFINITY_URL` to your CMS address. Adjust the service path, culture, site ID, and authentication as necessary. The example loads the file automatically; existing environment variables take precedence. Local environment files are ignored by Git and excluded from the package.

Then run:

```sh
npm run example -- news
```

With an exposed news type, expect a collection shaped like this:

```json
{
  "Items": [{ "Id": "a-news-item-id", "Title": "Hello from Sitefinity" }],
  "TotalCount": 1
}
```

An empty `Items` array is fine if there is no accessible news in that context. A 401 or 403 means you should check service access.

## Node examples

The [Node stub](examples/node/index.mjs) is plain JavaScript, imports the public package, and makes read-only requests. No web server or extra dependencies are involved. Each run has a 15-second request budget.

| Command | What it does |
| --- | --- |
| `npm run example -- news` | Read five news items and request a total count. |
| `npm run example -- news "release notes"` | Filter titles using OData `contains`. |
| `npm run example -- item <id>` | Read one item. Replace `<id>` with a real ID. |
| `npm run example -- types` | List exposed entity sets and full type names. |
| `npm run example -- search "release notes"` | Search the catalogue named by `SITEFINITY_SEARCH_INDEX`. |
| `npm run example -- page /about` | Retrieve a page layout or redirect result. |

`news` and `item` use `SITEFINITY_TYPE` when supplied, otherwise the built-in news type. The sample expects `Id` and `Title` fields. Search output converts the SDK's custom `IndexedFields` map to JSON.

The [environment template](examples/node/.env.example) explains every setting, including multisite context, search services, and layout mode. Keep credentials out of that tracked template.

For a repeatable, anonymous, legacy-mode live smoke test, first build the SDK, then provide your CMS URL and site GUID:

```sh
npm run build
npm run test:live -- https://your-cms.example.com YOUR-SITE-GUID
```

This explicitly contacts the supplied CMS. It checks bounded content reads, filters, navigation, search discovery, and the root layout. It performs no writes and exits nonzero if a check fails. Search uses the first discoverable index; success does not establish relevance or index completeness. The script does not load the example environment file or acquire credentials.

## Use in another project

There is no assumed public npm release. First build a local archive:

```sh
npm pack
```

From the consuming application, install the archive. Adjust the path and version:

```sh
npm install ../rest-sdk/sitefinity-rest-sdk-portable-0.1.0.tgz
```

### JavaScript: ES modules

Use an `.mjs` file in Node, or a project configured with `"type": "module"`. Browser bundlers use the same import.

```js
import { createRestClient, RestSdkTypes } from 'sitefinity-rest-sdk-portable';

const cms = await createRestClient({ baseUrl: 'https://cms.example.com' });
const news = await cms.getItems({
    type: RestSdkTypes.News,
    fields: ['Id', 'Title'],
    take: 10,
    count: true
});
console.log(news.Items);
```

### JavaScript: CommonJS

Use a `.cjs` file or a CommonJS project. No TypeScript compiler is needed by the consumer.

```js
const { createRestClient, RestSdkTypes } = require('sitefinity-rest-sdk-portable');

async function main() {
    const cms = await createRestClient({ baseUrl: 'https://cms.example.com' });
    const news = await cms.getItems({ type: RestSdkTypes.News, take: 10 });
    console.log(news.Items);
}

main().catch(console.error);
```

### TypeScript

Both module formats include declarations. Define your own interfaces for custom fields; models are not generated from your CMS schema.

```ts
import { createRestClient, RestSdkTypes, type SdkItem } from 'sitefinity-rest-sdk-portable';

interface NewsItem extends SdkItem {
    Title: string;
}

const cms = await createRestClient({ baseUrl: 'https://cms.example.com' });
const news = await cms.getItems<NewsItem>({
    type: RestSdkTypes.News,
    fields: ['Id', 'Title'],
    take: 10
});
console.log(news.Items.map(item => item.Title));
```

These types describe expected JSON; they do not validate responses. Modern `NodeNext` or `Bundler` resolution understands the package exports.

## Content, filters, and writes

`createRestClient(options)` is shorthand for `await new RestClient(options).initialize()`. Initialization loads service metadata and taxonomies. Reuse a client within one authentication/site context; do not share user-specific clients across server requests.

Use full type names such as `RestSdkTypes.News`, not the `newsitems` entity-set name, for metadata-based queries. Dynamic types work when exposed by the service; discover them with the `types` example. `RestSdkTypes.Tags` and `Categories` are taxonomy-creation aliases, not general read-query types.

```js
import { createRestClient, RestSdkTypes, FilterOperators } from 'sitefinity-rest-sdk-portable';

const cms = await createRestClient({ baseUrl: 'https://cms.example.com' });
const result = await cms.getItems({
    type: RestSdkTypes.News,
    fields: ['Id', 'Title'],
    culture: 'en',
    skip: 0,
    take: 20,
    count: true,
    orderBy: [{ Name: 'Title', Type: 'asc' }],
    filter: { FieldName: 'Title', Operator: FilterOperators.Equal, FieldValue: "O'Brien" }
});
console.log(result.Items, result.TotalCount);
```

Page explicitly with `skip` and `take`; there is no automatic iterator or continuation-link handling. 

Request related fields as `Image(Title,Url)` where that relationship exists. `additionalFields` adds to metadata-selected defaults. Pass raw query values: the SDK URL-encodes them. Field names, operators, raw filter expressions, and endpoint URLs should be application-controlled, not unchecked user input.

Writes use `createItem`, `updateItem`, `deleteItem`, `publishItem`, `saveDraftItem`, and `scheduleItem`. Creating an item does not publish it automatically. Required lifecycle sequences depend on the backend/type/permissions; verify them using disposable development content.

`relateItem` adds relationships. `uploadItem` accepts base64 data, filename, MIME type, title, and parent-library ID. It does not construct `File`, `Blob`, or `FormData` objects or perform chunked uploads. Conversion and memory limits belong to the application.

## Authentication and configuration

The SDK sends credentials supplied by the application. It does not log in, acquire/refresh tokens, or maintain a cookie jar. For an existing server-side bearer token:

```js
import { createRestClient } from 'sitefinity-rest-sdk-portable';

const cms = await createRestClient({
    baseUrl: process.env.SITEFINITY_URL,
    getRequestContext: () => ({
        headers: process.env.SITEFINITY_TOKEN
            ? { Authorization: `Bearer ${process.env.SITEFINITY_TOKEN}` }
            : {}
    })
});
console.log(cms.urls.getServerCmsServiceUrl());
```

Environment access above is application code, not an SDK dependency. Replace it with your configuration/authentication layer. `getRequestContext` runs for every request and can obtain a fresh token from that layer. Web-service API keys and bearer tokens are different mechanisms; use the headers your deployment requires.

| Option | Purpose |
| --- | --- |
| `baseUrl` | Required absolute CMS root, optionally including a virtual application path. No query or fragment. |
| `servicePath` / `serviceUrl` | Relative content-service path (default `api/default`), or an absolute override. |
| `searchServicePath` / `searchServiceUrl` | Endpoint for `performSearch`, defaulting to the content service. Other search helpers currently use the content service. |
| `headers` / `queryParams` | Static headers/query defaults, including `sf_site` and `sf_culture`. |
| `getRequestContext` | Fresh headers, explicit cookies, and transport options per request. |
| `getQueryParams` | Dynamic defaults where a method constructs a query. Not all helpers forward query context. |
| `additionalFetchData` | Credentials, cancellation signals, cache settings, or adapter-specific options. |
| `fetch` | Custom `HttpTransport`, otherwise native `globalThis.fetch`, looked up lazily. |
| `rendererName` / `nextGen` | Renderer header and endpoint mode. Does not register/detect a renderer. |
| `publicUrl` | Value returned by `cms.urls.getClientCmsUrl()`, not the request destination. |
| `withContext` | Wrap transport execution for application-owned tracing. |

Headers merge case-insensitively: renderer defaults, client headers, client transport headers, context headers/cookie, context transport headers, method headers, then method transport headers. Later values win.

A custom `HttpTransport` returns `status`, `statusText`, `headers.get/has`, `json()`, and `text()`. Resolve HTTP error responses so the SDK can interpret them; reject network failures. Layouts additionally need manual redirect headers.

## Browsers and React Native

React, Angular, Vue, and other SPAs can use the ESM build through their bundler. No framework adapter is necessary for content queries; Angular can wrap promises with RxJS. React Native has an ESM entry, but verify Metro exports handling, ES2022 engine support, and networking on your target devices.

- **CORS:** configure the CMS for the application's origin, methods, and headers, or use a same-origin backend proxy.
- **Cookies:** browser sessions may need `additionalFetchData: { credentials: 'include' }`, with compatible CORS, SameSite, and CSRF protections. Browsers control `Cookie` and `Host`; manual headers do not bypass this.
- **Secrets:** never bundle privileged CMS credentials into browser/mobile code. Use a scoped user token or trusted backend.
- **Redirects:** browser fetch hides manual redirect details. Layout/detail routes may need a server proxy even when ordinary content calls work.
- **Cancellation:** pass an application-created `AbortController.signal` through `additionalFetchData`. The core has no retry or timeout policy.


## Page layouts and caching

Layouts do not require content initialization:

```js
import { RestClient } from 'sitefinity-rest-sdk-portable';

const cms = new RestClient({ baseUrl: 'https://cms.example.com', nextGen: false });
const result = await cms.getPageLayout({
    pagePath: '/about',
    queryParams: { sf_culture: 'en' },
    followRedirects: false
});

if (result.isRedirect) {
    console.log(result.redirect.Location);
} else {
    console.log(result.layout.ComponentContext.Components);
}
```

Legacy mode requests the page path with layout headers. `nextGen: true` uses `Default.Model(url=@param)` on the service. Set `rendererName` to a registered renderer if required; some deployments need trusted server routing headers such as `X-ORIGINAL-HOST` as well.

Map each widget's `Name` to an application component, pass its `Properties`, and place `Children` using `PlaceHolder`. Handle `Lazy` and `Orphaned` explicitly. `getWidgetModel`, `getLazyWidget`, `getLazyWidgets`, and `getFormLayout` provide data, not a UI or complete form-submission workflow.

Routing, SEO, HTML sanitization, component registration, styles, and script policy belong to your renderer. Never blindly execute CMS scripts. The original `RestClientForContext` content-selection helper, manual ordering, and selected-thumbnail resolution are not included. This instance-based SDK is not a drop-in replacement for the original static Next.js API.

Followed layout redirects stay under the configured CMS base URL and default to ten hops. Redirect results retain the inherited `Permenant` spelling.

Only metadata and taxonomies are cached, per client. Initialization is coalesced; `await cms.initialize(newMetadataHash)` refreshes when the hash changes. There is no timed metadata refresh, content request deduplication, response cache, ISR, or automatic Next.js revalidation. `SF_SDK_CACHE` and other framework environment settings are not read. `layout.CacheControl` preserves a header but does not enforce it.

Application caches must respect `Cache-Control`/`Vary`, separate site/culture/provider and user contexts, and invalidate after writes. Exclude authenticated, preview, and personalized responses from shared caching by default. Transport cache options have only the semantics that transport provides; they do not recreate Next.js caching. Sitefinity/CDN caching remains independently configurable.

## Troubleshooting

`HttpError` exposes `status`, `method`, `url`, and `body`. Its message includes response details, so redact shared logs. Some model errors use `ErrorCodeException`; layout 404s use code `NotFound`. Network/cancellation errors propagate, and older paths may still throw plain strings.

| Symptom | Check |
| --- | --- |
| Missing `dist` entry | Run `npm run build`, or install a built tarball. |
| Metadata not loaded | Await `initialize()` or use `createRestClient`. |
| Initialization fails | Check `sfmeta`/`taxonomies` exposure, service path, and permissions. |
| Metadata/type error | Use a full exposed type name; inspect the `types` example. |
| 401 / 403 | Check authentication and operation-specific permissions. |
| Empty results | Check culture, site, provider, publication state, and search index. |
| HTML instead of layout / opaque redirect | Check renderer configuration and mode; a backend proxy may be needed. |

## Development and publishing

```sh
npm ci
npm run typecheck
npm run build
npm pack
npm run test:package
```

The build emits CommonJS/ESM JavaScript and declarations. The package check unpacks the actual archive, verifies both public module formats and example startup, and checks for unintended environment files. [GitHub Actions](.github/workflows/ci.yml) runs typechecking, builds, and package checks, not publication or live CMS access. Use `npm pack --dry-run` to inspect the file list without producing an archive.

Not included: every Sitefinity management API, batching, automatic pagination, relationship removal, complete unpublish/unlock workflows, login/token management, runtime DTO validation, persistent response caching, or a framework renderer.
