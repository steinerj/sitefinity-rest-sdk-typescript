const { mkdirSync, rmSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const ts = require('typescript');

const root = resolve(__dirname, '..');
const config = ts.readConfigFile(resolve(root, 'tsconfig.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const formatHost = {
    getCanonicalFileName: filename => filename,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n'
};

function check(diagnostics) {
    if (diagnostics.length) {
        throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost));
    }
}

check([...(config.error ? [config.error] : []), ...parsed.errors]);
rmSync(resolve(root, 'dist'), { recursive: true, force: true });
for (const [format, module, moduleResolution] of [
    ['cjs', ts.ModuleKind.CommonJS, ts.ModuleResolutionKind.Node10],
    ['esm', ts.ModuleKind.ES2022, ts.ModuleResolutionKind.Bundler]
]) {
    const outDir = resolve(root, 'dist', format);
    const program = ts.createProgram(parsed.fileNames, { ...parsed.options, module, moduleResolution, outDir });
    check(ts.getPreEmitDiagnostics(program));
    check(program.emit().diagnostics);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(resolve(outDir, 'package.json'), JSON.stringify({ type: format === 'esm' ? 'module' : 'commonjs' }) + '\n');
    console.log(`Built ${format}: ${parsed.fileNames.length} modules and declarations`);
}