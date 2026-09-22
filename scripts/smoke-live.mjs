import assert from 'node:assert/strict';
import { RestClient, RestSdkTypes, FilterOperators } from 'sitefinity-rest-sdk-portable';
import { runExample } from '../examples/node/index.mjs';

const [baseUrl, siteId] = process.argv.slice(2);
if (!baseUrl || !siteId) {
    console.error('Usage: node scripts/smoke-live.mjs <cms-url> <site-id>');
    process.exit(1);
}

const client = new RestClient({
    baseUrl,
    queryParams: { sf_site: siteId },
    nextGen: false,
    getRequestContext: () => ({ additionalFetchData: { signal: AbortSignal.timeout(15000) } })
});

async function check(name, action) {
    try {
        const result = await action();
        console.log(JSON.stringify({ check: name, ok: true, result }));
        return result;
    } catch (error) {
        console.log(JSON.stringify({
            check: name,
            ok: false,
            name: error.name,
            status: error.status,
            code: error.code,
            message: error.status ? 'HTTP request failed; check endpoint access and configuration.' : error.message
        }));
        process.exitCode = 1;
    }
}

const initialized = await check('initialization', async () => {
    await client.initialize();
    return {
        entitySets: Object.keys(client.metadata.serviceMetadataCache.entityContainer.entitySets).length,
        taxonomies: client.metadata.taxonomies.length
    };
});

if (initialized) {
    const types = [RestSdkTypes.News, RestSdkTypes.Image, RestSdkTypes.Pages];
    const dynamicType = Object.keys(client.metadata.serviceMetadataCache.entityContainer.entitySets)
        .map(entitySet => client.metadata.getTypeNameFromSetName(entitySet))
        .find(type => type.includes('.DynamicTypes.'));
    if (dynamicType) types.push(dynamicType);
    for (const type of types) {
        await check(type, async () => {
            const page = await client.getItems({ type, fields: ['Id', 'Title'], take: 1, count: true });
            assert.ok(page.Items.length <= 1);
            let singleMatches;
            if (page.Items[0]) {
                const item = await client.getItem({ type, id: page.Items[0].Id, fields: ['Id', 'Title'] });
                singleMatches = item.Id === page.Items[0].Id;
                assert.equal(singleMatches, true);
            }
            return { returned: page.Items.length, total: page.TotalCount, singleMatches };
        });
    }
    for (const [name, operator, value] of [
        ['apostrophe filter', FilterOperators.Equal, "O'Brien"],
        ['scalar contains-or filter', FilterOperators.ContainsOr, ['News', 'Events']]
    ]) {
        await check(name, async () => {
            const result = await client.getItems({ type: RestSdkTypes.News, take: 1, filter: { FieldName: 'Title', Operator: operator, FieldValue: value } });
            return { returned: result.Items.length };
        });
    }
    await check('navigation', async () => ({ returned: (await client.getNavigation({ levelsToInclude: 1 })).length }));
    await check('search metadata', () => client.getSearchMetadata({}));
    const indexes = await check('search index discovery', async () => {
        const type = client.metadata.getTypeNameFromSetName('searchindexes');
        const result = await client.getItems({ type, fields: ['Id', 'Name'], take: 1 });
        return { returned: result.Items.length, indexName: result.Items[0]?.Name };
    });
    if (indexes?.indexName) {
        await check('search example', async () => {
            const result = await runExample(['search', 'news'], {
                SITEFINITY_URL: baseUrl,
                SITEFINITY_SITE_ID: siteId,
                SITEFINITY_SEARCH_INDEX: indexes.indexName
            });
            return { returned: result.searchResults.length, total: result.totalCount };
        });
    }
}

await check('legacy root layout', async () => {
    const result = await client.getPageLayout({ pagePath: '/', followRedirects: false });
    if (result.isRedirect) return { isRedirect: true };
    assert.equal(result.layout.SiteId, siteId);
    return { isRedirect: false, siteMatches: true, widgets: result.layout.ComponentContext.Components.length };
});