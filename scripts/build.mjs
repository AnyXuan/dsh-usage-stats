#!/usr/bin/env node
/**
 * Build the browser half into the DSH loader format.
 *
 * Reads client.src.jsx, bundles with esbuild (React external), and wraps it
 * as `window.__ModuleLoader__.load({ id, factory })` with React required from
 * the shell's frozen module table. The bundle uses the `h`/`Fragment` factory
 * (jsx: transform + jsxFactory: 'h'), so React is only a single external.
 */

import { build } from 'esbuild'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = join(HERE, '..')
const pkg = JSON.parse(await readFile(join(PKG, 'package.json'), 'utf8'))
const ID = pkg.name

const result = await build({
  entryPoints: [join(PKG, 'client.src.jsx')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
  external: ['react'],
  legalComments: 'none',
  logLevel: 'warning',
  write: false,
})

const text = result.outputFiles[0].text

// esbuild leaves one `import { ... } from "react"` line (or similar). The DSH
// loader factory supplies `require`; we rewrite external imports to require()
// calls. Since only `react` is external and we use `h = React.createElement`,
// we just need to bind React.
const body = text
  // Strip ESM export/import that a classic script cannot parse.
  .replace(/^import[^;]*from\s*["'][^"']+["'];\s*/gm, '')
  .replace(/^export\s+(const|let|var|function|class)\s+/gm, '$1 ')
  .replace(/^export\s*\{[^}]*\}\s*;?/gm, '')
  .replace(/^export\s+default\s+/gm, '')

const wrapped = `/**
 * ${ID} ${pkg.version}
 * ${pkg.description ?? ''}
 * built ${new Date().toISOString()}
 * externals: react
 */

window.__ModuleLoader__.load({
  id: ${JSON.stringify(ID)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
    var h = React.createElement;
    var Fragment = React.Fragment;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useCallback = React.useCallback;
    var useRef = React.useRef;
    var useMemo = React.useMemo;
${body}
    module.exports.name = name;
    module.exports.inject = inject;
    module.exports.apply = apply;
    return module.exports;
  },
});
`

await mkdir(join(PKG), { recursive: true })
await writeFile(join(PKG, 'client.js'), wrapped)
console.log(`built client.js (${wrapped.length} bytes)`)
