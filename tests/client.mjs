/** Load the built client bundle the way the shell does and call apply(). */

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import vm from 'node:vm'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = join(HERE, '..')
const code = await readFile(join(PKG, 'client.js'), 'utf8')

const require = createRequire(import.meta.url)
const react = require('react')

let definition
const sandbox = {
  window: { __ModuleLoader__: { load(def) { definition = def } } },
  document: { createElement: () => ({ style: {}, set textContent(v) {} }), head: { appendChild() {} }, getElementById: () => null },
  fetch: async () => ({ ok: true, json: async () => ({ ok: true, value: null }) }),
  console,
}
vm.createContext(sandbox)
vm.runInContext(code, sandbox)

const exported = definition.factory(() => react)
console.log('id:', definition.id)
console.log('name:', exported.name, 'inject:', JSON.stringify(exported.inject), 'apply:', typeof exported.apply)

const seen = []
const ctx2 = {
  slots: {
    register(options, component) { seen.push(options); return () => {} },
    inject(key, callback) { callback(); return () => {} },
  },
}
exported.apply(ctx2)
console.log('registrations:', JSON.stringify(seen))
