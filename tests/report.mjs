/** Read-only check: build a report from the real store without appending. */

import { apply } from '../index.js'

const routes = []
const ctx = {
  on() {},
  inject(names, callback) {
    if (names.includes('webServer')) {
      callback({
        webServer: {
          register(route) { routes.push(route) }
        }
      })
    }
  },
  effect(fn) { fn() },
}

apply(ctx)

for (const query of ['', '?start=' + (Date.now() - 30 * 86400000)]) {
  let statusCode = 0
  let headers = {}
  let bodyStr = ''
  const req = { url: '/api/usage-stats' + query }
  const res = {
    writeHead(code, hdrs) { statusCode = code; headers = hdrs || {} },
    end(body) { bodyStr = body },
  }
  await routes[0].handler(req, res)
  const data = JSON.parse(bodyStr)
  console.log('---', query === '' ? 'all' : '30d', 'status', statusCode)
  console.log('overview', JSON.stringify(data.overview))
  console.log('summary', JSON.stringify({ tokens: data.summary.tokens, requests: data.summary.requests, cost: data.summary.cost.toFixed(4), cacheHitRate: data.summary.cacheHitRate.toFixed(3) }))
  console.log('groups', data.groups.map((g) => `${g.provider}: ${g.totalTokens} tok / ${g.rows.length} models`).join(' | '))
  console.log('daily days', Object.keys(data.daily).length)
  console.log('debug', JSON.stringify(data.debug))
}
