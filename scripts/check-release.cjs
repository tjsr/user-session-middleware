const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const semver = require('semver');
const manifest = require('../package.json');

const npm = process.env.npm_execpath || fs.realpathSync(execFileSync('which', ['npm'], { encoding: 'utf8' }).trim());
const raw = JSON.parse(execFileSync(process.execPath, [npm, 'view', manifest.name, 'versions', '--json'], { encoding: 'utf8' }));
function versions(value) {
  if (typeof value === 'string') return [value];
  return (Array.isArray(value) ? value : Object.values(value)).flatMap(versions);
}
const published = versions(raw);
assert.ok(published.every((version) => semver.valid(version)), 'Unexpected registry version response');
const latest = semver.maxSatisfying(published, '*', { includePrerelease: true });
assert.equal(manifest.version, latest, 'Release baseline must match the latest published version');
const next = semver.inc(latest, 'patch');
if (process.argv[2]) assert.equal(next, process.argv[2], 'Recheck the intended release version before publishing');
assert.ok(!published.includes(next), 'Prospective version is already published');
console.log(JSON.stringify({ package: manifest.name, latest, next, registry: manifest.publishConfig.registry }));
