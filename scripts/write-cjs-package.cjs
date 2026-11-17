const fs = require('node:fs');
const path = require('node:path');

// Declaration specifiers must name the emitted JavaScript, not source files.
function rewriteDeclarations(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      rewriteDeclarations(file);
    } else if (entry.name.endsWith('.d.ts')) {
      const contents = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(file, contents.replace(/(["'])(\.\.?\/[^"']+)\.ts\1/g, '$1$2.js$1'));
    }
  }
}
rewriteDeclarations(path.join(__dirname, '../dist'));
// Both .js and .d.ts in this directory describe CommonJS modules.
fs.writeFileSync(path.join(__dirname, '../dist/cjs/package.json'), '{"type":"commonjs"}\n');
