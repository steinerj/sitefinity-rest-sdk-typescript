const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } = require('node:fs');
const { createRequire } = require('node:module');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const manifest = require('../package.json');

const archive = process.argv[2]
    ? resolve(process.argv[2])
    : resolve(__dirname, '..', `${manifest.name}-${manifest.version}.tgz`);
const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' }).trim().split(/\r?\n/);
for (const entry of manifest.files.filter(entry => entry !== 'dist')) {
    assert.ok(entries.includes(`package/${entry}`), `Missing package file: ${entry}`);
}
assert.ok(entries.includes('package/dist/cjs/index.js'));
assert.ok(entries.includes('package/dist/esm/index.js'));
assert.equal(entries.some(entry => /(?:^|\/)\.env(?:\.|$)/.test(entry) && !entry.endsWith('/.env.example')), false);
assert.equal(entries.some(entry => entry.includes('node_modules/')), false);

const temporary = mkdtempSync(join(tmpdir(), 'sitefinity-packed-'));
try {
    const destination = join(temporary, 'node_modules', manifest.name);
    mkdirSync(destination, { recursive: true });
    execFileSync('tar', ['-xzf', archive, '--strip-components=1', '-C', destination]);
    assert.deepEqual(JSON.parse(readFileSync(join(destination, 'package.json'), 'utf8')), manifest, 'Repack after changing package.json');
    const consumer = createRequire(join(temporary, 'consumer.cjs'));
    assert.equal(typeof consumer(manifest.name).RestClient, 'function');
    const source = `import { RestClient } from ${JSON.stringify(manifest.name)};
        if (typeof RestClient !== 'function') throw new Error('Missing ESM export');`;
    execFileSync(process.execPath, ['--input-type=module', '-e', source], { cwd: temporary });
    const help = execFileSync(process.execPath, [join(destination, 'examples/node/index.mjs'), '--help'], {
        cwd: temporary,
        encoding: 'utf8'
    });
    assert.match(help, /read-only/);
    console.log(JSON.stringify({
        archive,
        files: entries.length,
        bytes: statSync(archive).size,
        commonjs: 'passed',
        esm: 'passed',
        example: 'passed',
        privateEnvironmentFilesExcluded: true
    }, null, 2));
} finally {
    rmSync(temporary, { recursive: true, force: true });
}