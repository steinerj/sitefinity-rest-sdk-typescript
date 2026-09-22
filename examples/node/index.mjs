import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { pathToFileURL } from 'node:url';
import { RestClient, RestSdkTypes, StringOperators, HttpError } from 'sitefinity-rest-sdk-portable';

const help = `Sitefinity REST SDK examples (read-only)

npm run example -- news [title text]
npm run example -- item <id>
npm run example -- types
npm run example -- search <text>
npm run example -- page [path]

Configuration: examples/node/.env or environment variables.
Required: SITEFINITY_URL. Search also requires SITEFINITY_SEARCH_INDEX.
Optional: SITEFINITY_TOKEN, SITEFINITY_SERVICE_PATH, SITEFINITY_CULTURE,
SITEFINITY_SITE_ID, SITEFINITY_TYPE, SITEFINITY_SEARCH_SERVICE_PATH,
SITEFINITY_RENDERER_NAME, SITEFINITY_NEXT_GEN.
`;

export async function runExample(args, env, transport) {
    const [command = 'news', ...values] = args;
    if (!['news', 'item', 'types', 'search', 'page'].includes(command)) {
        throw new Error(`Unknown command: ${command}. Use --help for available commands.`);
    }
    if (!env.SITEFINITY_URL) {
        throw new Error('Set SITEFINITY_URL in examples/node/.env or your environment. Use --help for commands.');
    }
    if (command === 'item' && !values[0]) {
        throw new Error('The item command requires an item id.');
    }
    if (command === 'search' && (!env.SITEFINITY_SEARCH_INDEX || !values.length)) {
        throw new Error('Set SITEFINITY_SEARCH_INDEX and supply search text.');
    }

    const queryParams = {};
    if (env.SITEFINITY_CULTURE) queryParams.sf_culture = env.SITEFINITY_CULTURE;
    if (env.SITEFINITY_SITE_ID) queryParams.sf_site = env.SITEFINITY_SITE_ID;
    const client = new RestClient({
        baseUrl: env.SITEFINITY_URL,
        servicePath: env.SITEFINITY_SERVICE_PATH || 'api/default',
        searchServicePath: env.SITEFINITY_SEARCH_SERVICE_PATH || undefined,
        rendererName: env.SITEFINITY_RENDERER_NAME || undefined,
        nextGen: env.SITEFINITY_NEXT_GEN === 'true',
        headers: env.SITEFINITY_TOKEN ? { Authorization: `Bearer ${env.SITEFINITY_TOKEN}` } : {},
        queryParams,
        fetch: transport,
        additionalFetchData: { signal: AbortSignal.timeout(15000) }
    });

    if (command === 'page') {
        return client.getPageLayout({ pagePath: values[0] || '/', queryParams, followRedirects: false });
    }
    if (command === 'search') {
        return client.performSearch({
            indexCatalogue: env.SITEFINITY_SEARCH_INDEX,
            searchQuery: values.join(' '),
            wordsMode: 'AllWords',
            orderBy: '',
            culture: env.SITEFINITY_CULTURE || '',
            skip: 0,
            take: 10,
            searchFields: '',
            highlightedFields: '',
            scoringInfo: '',
            resultsForAllSites: false,
            filter: '',
            indexFields: ''
        });
    }

    await client.initialize();
    const type = env.SITEFINITY_TYPE || RestSdkTypes.News;
    if (command === 'types') {
        return Object.keys(client.metadata.serviceMetadataCache.entityContainer.entitySets).map(entitySet => ({
            entitySet,
            type: client.metadata.getTypeNameFromSetName(entitySet)
        }));
    }
    if (command === 'item') {
        return client.getItem({ type, id: values[0] });
    }
    return client.getItems({
        type,
        fields: ['Id', 'Title'],
        take: 5,
        skip: 0,
        count: true,
        filter: values.length ? { FieldName: 'Title', Operator: StringOperators.Contains, FieldValue: values.join(' ') } : undefined
    });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        console.log(help);
    } else {
        try {
            const envFile = new URL('./.env', import.meta.url);
            if (existsSync(envFile)) loadEnvFile(envFile);
            const result = await runExample(process.argv.slice(2), process.env);
            console.log(JSON.stringify(result, (_key, value) => value instanceof Map ? Object.fromEntries(value) : value, 2));
        } catch (error) {
            console.error(error instanceof HttpError
                ? `Sitefinity returned HTTP ${error.status} for ${error.method}. Check service access and permissions.`
                : error instanceof Error ? error.message : 'The request failed.');
            process.exitCode = 1;
        }
    }
}