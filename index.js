/**
 * 用量统计 (Usage Stats) — Host half.
 *
 * Collects per-call token usage from the `llm/stream` waterfall, persists
 * every completed call to `~/.dsh/storages/usage-stats.jsonl`, and serves
 * aggregates to the browser half over `/api/usage-stats` via the webServer
 * service — the same pattern dsh-model-usage uses.
 *
 * The store is seeded from the existing `model-usage.jsonl` on first run
 * (one-time) so the dashboard shows history before this plugin existed.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh')
const STORE_DIR = join(DSH_HOME, 'storages')
const STORE_FILE = join(STORE_DIR, 'usage-stats.jsonl')
const SEED_FILE = join(STORE_DIR, 'model-usage.jsonl')
const MAX_CALLS = 50_000

/** Model price table: input/output/cache ¥/M tokens. Longest key match wins. */
const PRICES = {
  'deepseek-chat': { input: 2.0, output: 8.0, cache: 0.5 },
  'deepseek-reasoner': { input: 4.0, output: 16.0, cache: 1.0 },
  'deepseek-v4': { input: 6.79, output: 33.93, cache: 3.39 },
  'deepseek-v3': { input: 6.79, output: 33.93, cache: 3.39 },
  'deepseek': { input: 6.79, output: 33.93, cache: 3.39 },
  'gpt': { input: 2.5, output: 10.0, cache: 1.25 },
  'claude': { input: 15.0, output: 75.0, cache: 1.5 },
  'kimi': { input: 4.0, output: 16.0, cache: 1.0 },
  'qwen': { input: 2.0, output: 8.0, cache: 0.5 },
  'glm': { input: 4.0, output: 16.0, cache: 1.0 },
  'gemini': { input: 0.7, output: 2.1, cache: 0.35 },
  'grok': { input: 3.0, output: 15.0, cache: 1.0 },
  'doubao': { input: 0.8, output: 2.0, cache: 0.4 },
  'openrouter': { input: 2.5, output: 10.0, cache: 1.25 },
  'opencode': { input: 2.5, output: 10.0, cache: 1.25 },
  'our-free-model': { input: 0.0, output: 0.0, cache: 0.0 },
  'sensenova': { input: 4.0, output: 12.0, cache: 1.0 },
  'shangtang': { input: 4.0, output: 12.0, cache: 1.0 },
  'magpie': { input: 2.5, output: 10.0, cache: 1.25 },
}
const DEFAULT_PRICE = { input: 6.79, output: 33.93, cache: 3.39 }

function priceFor(model) {
  const m = String(model || '').toLowerCase()
  let best = ''
  for (const k of Object.keys(PRICES)) {
    if (m.includes(k) && k.length > best.length) best = k
  }
  return best ? PRICES[best] : DEFAULT_PRICE
}

/** DeepSeek 9-14 点高峰期价格翻倍. */
function peakHour(d) {
  const h = d.getHours()
  return h >= 9 && h < 14
}

function effectivePrice(model, ts) {
  const p = priceFor(model)
  if (!peakHour(new Date(ts))) return p
  return { input: p.input * 2, output: p.output * 2, cache: p.cache * 2 }
}

/** Provider logo key from provider name. */
function logoKey(provider) {
  const p = String(provider || '').toLowerCase()
  if (p.includes('deepseek')) return 'deepseek'
  if (p.includes('openai') || p.includes('gpt')) return 'openai'
  if (p.includes('claude') || p.includes('anthropic')) return 'claude'
  if (p.includes('gemini') || p.includes('google')) return 'gemini'
  if (p.includes('kimi') || p.includes('moonshot')) return 'kimi'
  if (p.includes('qwen') || p.includes('alibaba') || p.includes('tongyi')) return 'qwen'
  if (p.includes('doubao') || p.includes('bytedance')) return 'doubao'
  if (p.includes('zhipu') || p.includes('glm') || p.includes('chatglm')) return 'zhipu'
  if (p.includes('openrouter')) return 'openrouter'
  if (p.includes('sensenova') || p.includes('shangtang')) return 'sensenova'
  return null
}

/** Daily activity: token split for the stacked chart, plus request count and
 *  cost so the trend can switch metric (tokens / requests / cost). */
function buildDailyMap(list) {
  const map = {}
  for (const c of list) {
    const d = new Date(c.ts)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const day = map[key] || (map[key] = { t: 0, i: 0, o: 0, c: 0, n: 0, cost: 0 })
    day.i += c.inp || 0
    day.o += c.out || 0
    day.c += c.cr || 0
    day.t += (c.inp || 0) + (c.out || 0) + (c.cr || 0)
    day.n += 1
    const p = effectivePrice(c.model, c.ts)
    day.cost += (c.inp || 0) / 1e6 * p.input + (c.out || 0) / 1e6 * p.output + (c.cr || 0) / 1e6 * p.cache
  }
  return map
}

const HOST_VERSION = '0.7.0'

export function apply(ctx) {
  const calls = []
  let seeded = false
  let recorded = 0

  function loadPersisted() {
    // Seed from model-usage.jsonl on first run
    if (!existsSync(STORE_FILE) && existsSync(SEED_FILE)) {
      try {
        const raw = readFileSync(SEED_FILE, 'utf8')
        for (const line of raw.split('\n')) {
          if (!line.trim()) continue
          try {
            const r = JSON.parse(line)
            calls.push({
              ts: r.ts, provider: r.provider || '', model: r.model || '',
              inp: r.inp || 0, out: r.out || 0, cr: r.cr || 0, cw: r.cw || 0,
              rsn: r.rsn || 0, dur: r.dur || 0,
            })
          } catch { /* skip */ }
          if (calls.length >= MAX_CALLS) break
        }
        seeded = true
        console.log(`[usage-stats] seeded ${calls.length} records from model-usage.jsonl`)
      } catch (e) {
        console.error(`[usage-stats] seed failed: ${String(e)}`)
      }
    }
    // Load own store
    try {
      if (existsSync(STORE_FILE)) {
        const raw = readFileSync(STORE_FILE, 'utf8')
        for (const line of raw.split('\n')) {
          if (!line.trim()) continue
          try {
            calls.push(JSON.parse(line))
          } catch { /* skip */ }
          if (calls.length >= MAX_CALLS) break
        }
        console.log(`[usage-stats] loaded ${calls.length} records from store`)
      }
    } catch (e) {
      console.error(`[usage-stats] load failed: ${String(e)}`)
    }
  }

  function persist(record) {
    try {
      mkdirSync(STORE_DIR, { recursive: true })
      writeFileSync(STORE_FILE, JSON.stringify(record) + '\n', { flag: 'a' })
      recorded++
    } catch (e) {
      console.error(`[usage-stats] persist failed: ${String(e)}`)
    }
  }

  // Collect from llm/stream
  if (typeof ctx.on === 'function') {
    ctx.on('llm/stream', async function* (options, next) {
      const started = Date.now()
      const provider = options?.provider || options?.body?.provider || ''
      const model = options?.model || options?.body?.model || ''
      let inp = 0, out = 0, cr = 0, cw = 0, rsn = 0
      const gen = next(options)
      let result = null
      while (true) {
        const { value, done } = await gen.next(result)
        if (done) break
        if (value && typeof value === 'object') {
          if (value.usage) {
            const u = value.usage
            inp = u.prompt_tokens || u.input_tokens || inp
            out = u.completion_tokens || u.output_tokens || out
            cr = u.prompt_cache_hit_tokens || u.prompt_cache_read_tokens || u.cache_read_tokens || cr
            cw = u.prompt_cache_miss_tokens || u.prompt_cache_write_tokens || u.cache_write_tokens || cw
            rsn = u.reasoning_tokens || rsn
          }
          if (value.done !== undefined) {
            const dur = Date.now() - started
            const rec = {
              ts: started, provider, model,
              inp, out, cr, cw, rsn, dur,
            }
            calls.push(rec)
            persist(rec)
          }
        }
        result = yield value
      }
    })
  }

  loadPersisted()

  function buildReport(query) {
    const start = query.start ? Number(query.start) : null
    const end = query.end ? Number(query.end) : null
    const modelFilter = query.model || ''

    const list = calls.filter(c => {
      if (modelFilter && !String(c.model).toLowerCase().includes(modelFilter.toLowerCase())) return false
      if (start && c.ts < start) return false
      if (end && c.ts > end) return false
      return true
    })

    // Totals include cache-read tokens so the headline matches the stacked trend.
    const allTokens = calls.reduce((s, c) => s + (c.inp || 0) + (c.out || 0) + (c.cr || 0), 0)
    const allCost = calls.reduce((s, c) => {
      const p = effectivePrice(c.model, c.ts)
      return s + (c.inp || 0) / 1e6 * p.input + (c.out || 0) / 1e6 * p.output + (c.cr || 0) / 1e6 * p.cache
    }, 0)

    const totalTokens = list.reduce((s, c) => s + (c.inp || 0) + (c.out || 0) + (c.cr || 0), 0)
    const totalInput = list.reduce((s, c) => s + (c.inp || 0), 0)
    const totalOutput = list.reduce((s, c) => s + (c.out || 0), 0)
    const totalCacheRead = list.reduce((s, c) => s + (c.cr || 0), 0)
    const totalCacheWrite = list.reduce((s, c) => s + (c.cw || 0), 0)
    const totalReasoning = list.reduce((s, c) => s + (c.rsn || 0), 0)
    const costUsd = list.reduce((s, c) => {
      const p = effectivePrice(c.model, c.ts)
      return s + (c.inp || 0) / 1e6 * p.input + (c.out || 0) / 1e6 * p.output + (c.cr || 0) / 1e6 * p.cache
    }, 0)
    // cr can exceed inp (magpie gateway), so hit rate is share of all input-side tokens
    const cacheHitRate = totalInput + totalCacheRead > 0 ? totalCacheRead / (totalInput + totalCacheRead) : 0

    // Range-filtered daily for the trend; unfiltered dailyAll for the year heatmap.
    const dailyMap = buildDailyMap(list)
    const dailyAll = buildDailyMap(calls)

    // Per-provider groups with model rows
    const groupMap = {}
    for (const c of list) {
      const prov = c.provider || 'unknown'
      const mdl = c.model || 'unknown'
      if (!groupMap[prov]) groupMap[prov] = { provider: prov, logo: logoKey(prov), rows: {}, totalTokens: 0, calls: 0 }
      const g = groupMap[prov]
      g.totalTokens += (c.inp || 0) + (c.out || 0) + (c.cr || 0)
      g.calls++
      if (!g.rows[mdl]) {
        g.rows[mdl] = {
          model: mdl, provider: prov, logo: logoKey(prov),
          inp: 0, out: 0, cr: 0, cw: 0, rsn: 0, calls: 0,
          cost: 0, tokens: 0,
        }
      }
      const r = g.rows[mdl]
      r.inp += c.inp || 0
      r.out += c.out || 0
      r.cr += c.cr || 0
      r.cw += c.cw || 0
      r.rsn += c.rsn || 0
      r.calls++
      r.tokens += (c.inp || 0) + (c.out || 0) + (c.cr || 0)
      const p = effectivePrice(c.model, c.ts)
      r.cost += (c.inp || 0) / 1e6 * p.input + (c.out || 0) / 1e6 * p.output + (c.cr || 0) / 1e6 * p.cache
    }

    const groups = Object.values(groupMap).map(g => ({
      ...g,
      rows: Object.values(g.rows).sort((a, b) => b.tokens - a.tokens),
    })).sort((a, b) => b.totalTokens - a.totalTokens)

    return {
      overview: {
        totalTokens: allTokens,
        totalCalls: calls.length,
        totalCost: allCost,
        uniqueModels: new Set(calls.map(c => c.model)).size,
        uniqueProviders: new Set(calls.map(c => c.provider)).size,
      },
      summary: {
        tokens: totalTokens,
        inputTokens: totalInput,
        outputTokens: totalOutput,
        requests: list.length,
        cost: costUsd,
        cacheHitRate,
        cacheReadTokens: totalCacheRead,
        cacheWriteTokens: totalCacheWrite,
        reasoningTokens: totalReasoning,
      },
      daily: dailyMap,
      dailyAll,
      groups,
      debug: { version: HOST_VERSION, calls: calls.length, seeded, recorded },
    }
  }

  // ── HTTP endpoint via the webServer service (same pattern as dsh-model-usage) ──
  if (typeof ctx.inject === 'function') {
    ctx.inject(['webServer'], (webCtx) => {
      const webServer = webCtx.webServer
      if (!webServer || typeof webServer.register !== 'function') return

      webServer.register({
        kind: 'exact',
        path: '/api/usage-stats',
        handler: async (req, res) => {
          try {
            const url = new URL(req.url || '/', 'http://x')
            const query = {}
            url.searchParams.forEach((value, key) => { query[key] = value })
            const report = buildReport(query)
            const body = JSON.stringify(report)
            res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
            res.end(body)
          } catch (e) {
            res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
            res.end('usage-stats error: ' + String(e))
          }
        },
      })

      console.log('[usage-stats] HTTP endpoint registered at /api/usage-stats')
    })
  }
}


