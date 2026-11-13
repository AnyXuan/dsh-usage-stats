/**
 * dsh-usage-stats 0.7.0
 * DeepSeek Harness (dsh) plugin: Stripe-style usage insights dashboard with switchable trend chart (bar/line), metric (tokens/requests/cost), and a full-year activity heatmap.
 * built 2026-11-13T11:42:10.603Z
 * externals: react
 */

window.__ModuleLoader__.load({
  id: "dsh-usage-stats",
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
// client.src.jsx
var h = React.createElement;
var Fragment = React.Fragment;
var name = "dsh-usage-stats";
var inject = ["slots"];
var PANEL_ID = "usage-stats";
function fc(n) {
  if (n == null) return "\u2014";
  if (n >= 1e6) return trim(n / 1e6) + "M";
  if (n >= 1e3) return trim(n / 1e3) + "K";
  return String(Math.round(n));
}
function trim(x) {
  return (Math.round(x * 10) / 10).toString();
}
function fmtDT(ms) {
  if (ms == null) return "\u2014";
  const d = new Date(ms);
  return `${d.getMonth() + 1}\u6708${d.getDate()}\u65E5 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
var DAY = 864e5;
function dkey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
var PRESETS = [
  { key: "all", label: "\u5168\u90E8", make: () => ({ start: null, end: null, label: "\u5168\u90E8" }) },
  { key: "today", label: "\u5F53\u5929", make: (now) => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return { start: d.getTime(), end: null, label: "\u5F53\u5929" };
  } },
  { key: "1d", label: "1d", make: (now) => ({ start: now - DAY, end: null, label: "\u8FD1 1 \u5929" }) },
  { key: "7d", label: "7d", make: (now) => ({ start: now - 7 * DAY, end: null, label: "\u8FD1 7 \u5929" }) },
  { key: "14d", label: "14d", make: (now) => ({ start: now - 14 * DAY, end: null, label: "\u8FD1 14 \u5929" }) },
  { key: "30d", label: "30d", make: (now) => ({ start: now - 30 * DAY, end: null, label: "\u8FD1 30 \u5929" }) },
  { key: "6m", label: "6 \u4E2A\u6708", make: (now) => ({ start: now - 182 * DAY, end: null, label: "\u8FD1 6 \u4E2A\u6708" }) }
];
function sameRange(a, b) {
  return a.start === b.start && a.end === b.end;
}
function normalizeRows(rows) {
  const map = /* @__PURE__ */ new Map();
  const order = [];
  for (const r of rows) {
    const base = (r.provider || "").split("-")[0];
    let model = r.model || "";
    if (base && model.startsWith(base + "/")) model = model.slice(base.length + 1);
    const key = (r.provider || "") + "::" + model;
    const ex = map.get(key);
    if (!ex) {
      order.push(key);
      map.set(key, {
        provider: r.provider || "",
        model,
        tokens: r.tokens || 0,
        inp: r.inp || 0,
        out: r.out || 0,
        cr: r.cr || 0,
        cw: r.cw || 0,
        rsn: r.rsn || 0,
        calls: r.calls || 0,
        cost: r.cost || 0
      });
    } else {
      ex.tokens += r.tokens || 0;
      ex.inp += r.inp || 0;
      ex.out += r.out || 0;
      ex.cr += r.cr || 0;
      ex.cw += r.cw || 0;
      ex.rsn += r.rsn || 0;
      ex.calls += r.calls || 0;
      ex.cost += r.cost || 0;
    }
  }
  return order.map((k) => map.get(k));
}
function buildBuckets(daily, range) {
  const keys = Object.keys(daily).sort();
  const now = Date.now();
  const startMs = range.start != null ? range.start : keys.length ? (/* @__PURE__ */ new Date(keys[0] + "T00:00:00")).getTime() : now - 29 * DAY;
  const endMs = range.end != null ? range.end : now;
  const spanDays = Math.max(1, Math.ceil((endMs - startMs) / DAY));
  const monthly = spanDays > 31 && range.start != null;
  const todayKey = dkey(new Date(now));
  const curMonth = todayKey.slice(0, 7);
  const buckets = [];
  if (monthly) {
    const months = [];
    const cur = new Date(startMs);
    cur.setDate(1);
    cur.setHours(0, 0, 0, 0);
    const last = new Date(endMs);
    while (cur.getTime() <= last.getTime() && months.length < 60) {
      months.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
    for (const m of months.slice(-13)) {
      const mk = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`;
      let i = 0, o = 0, c = 0, t = 0, n = 0, cost = 0;
      for (const k of keys) {
        if (k.startsWith(mk)) {
          const d = daily[k];
          i += d.i || 0;
          o += d.o || 0;
          c += d.c || 0;
          t += d.t || 0;
          n += d.n || 0;
          cost += d.cost || 0;
        }
      }
      buckets.push({ key: mk, label: m.getMonth() + 1 + "\u6708", i, o, c, t, n, cost, current: mk === curMonth });
    }
  } else {
    const s = new Date(startMs);
    s.setHours(0, 0, 0, 0);
    const days = Math.min(800, Math.max(1, Math.ceil((endMs - s.getTime()) / DAY)));
    const long = days > 60;
    for (let n = 0; n < days; n++) {
      const d = new Date(s);
      d.setDate(s.getDate() + n);
      const k = dkey(d);
      const v = daily[k] || { i: 0, o: 0, c: 0, t: 0, n: 0, cost: 0 };
      const tick = long ? d.getDate() === 1 ? d.getMonth() === 0 ? `${String(d.getFullYear()).slice(2)}\u5E741\u6708` : `${d.getMonth() + 1}\u6708` : null : `${d.getMonth() + 1}/${d.getDate()}`;
      buckets.push({ key: k, label: `${d.getMonth() + 1}/${d.getDate()}`, tick, i: v.i || 0, o: v.o || 0, c: v.c || 0, t: v.t || 0, n: v.n || 0, cost: v.cost || 0, current: k === todayKey });
    }
  }
  return { buckets, monthly };
}
function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return m * p;
}
function num(n) {
  return Number(n || 0).toLocaleString("en-US");
}
var METRICS = [
  { key: "tokens", label: "Tokens", color: "#ff4d24", icon: "tokens" },
  { key: "requests", label: "\u8BF7\u6C42", color: "#3d9bff", icon: "requests" },
  { key: "cost", label: "\u8D39\u7528", color: "#16a34a", icon: "yen" }
];
var CHART_TYPES = [
  { key: "bar", label: "\u67F1\u72B6", icon: "chartBar" },
  { key: "line", label: "\u6298\u7EBF", icon: "chartLine" }
];
var METRIC_COLOR = { tokens: "#ff4d24", requests: "#3d9bff", cost: "#16a34a" };
function metricValue(b, metric) {
  return metric === "requests" ? b.n || 0 : metric === "cost" ? b.cost || 0 : b.t || 0;
}
var UI_KEY = "dsh-usage-stats-ui";
function loadUi(key, fallback, allowed) {
  try {
    const s = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    const v = s[key];
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}
function saveUi(patch) {
  try {
    const s = JSON.parse(localStorage.getItem(UI_KEY) || "{}");
    localStorage.setItem(UI_KEY, JSON.stringify({ ...s, ...patch }));
  } catch {
  }
}
function smoothPath(pts, h2) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  const clampY = (y) => Math.max(0, Math.min(h2, y));
  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clampY(p2.y - (p3.y - p1.y) / 6);
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}
function csvCell(v) {
  let s = String(v == null ? "" : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function exportCsv(rows, totalTokens) {
  const header = ["\u6A21\u578B", "\u63D0\u4F9B\u5546", "\u603BTokens", "\u8F93\u5165", "\u8F93\u51FA", "\u7F13\u5B58\u8BFB\u53D6", "\u7F13\u5B58\u5199\u5165", "\u63A8\u7406", "\u8C03\u7528", "\u6210\u672C(CNY)", "\u5360\u6BD4(%)"];
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push([
      r.model,
      r.provider,
      r.tokens,
      r.inp,
      r.out,
      r.cr,
      r.cw,
      r.rsn,
      r.calls,
      Number(r.cost || 0).toFixed(4),
      totalTokens > 0 ? (r.tokens / totalTokens * 100).toFixed(2) : "0"
    ].map(csvCell).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "usage-stats-" + dkey(/* @__PURE__ */ new Date()) + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
var INLINE_LOGOS = {
  deepseek: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" fill="#4D6BFE"></path></svg>',
  openai: '<svg fill="currentColor" fill-rule="evenodd" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>OpenAI</title><path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"></path></svg>',
  anthropic: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fill-rule="nonzero"></path></svg>',
  claude: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" fill="#D97757" fill-rule="nonzero"></path></svg>',
  gemini: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Gemini</title><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="#3186FF"></path><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-0-_R_0_)"></path><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-1-_R_0_)"></path><path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" fill="url(#lobe-icons-gemini-2-_R_0_)"></path><defs><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-0-_R_0_" x1="7" x2="11" y1="15.5" y2="12"><stop stop-color="#08B962"></stop><stop offset="1" stop-color="#08B962" stop-opacity="0"></stop></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-1-_R_0_" x1="8" x2="11.5" y1="5.5" y2="11"><stop stop-color="#F94543"></stop><stop offset="1" stop-color="#F94543" stop-opacity="0"></stop></linearGradient><linearGradient gradientUnits="userSpaceOnUse" id="lobe-icons-gemini-2-_R_0_" x1="3.5" x2="17.5" y1="13.5" y2="12"><stop stop-color="#FABC12"></stop><stop offset=".46" stop-color="#FABC12" stop-opacity="0"></stop></linearGradient></defs></svg>',
  qwen: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Qwen</title><path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" fill="url(#lobe-icons-qwen-_R_0_)" fill-rule="nonzero"></path><defs><linearGradient id="lobe-icons-qwen-_R_0_" x1="0%" x2="100%" y1="0%" y2="0%"><stop offset="0%" stop-color="#6336E7" stop-opacity=".84"></stop><stop offset="100%" stop-color="#6F69F7" stop-opacity=".84"></stop></linearGradient></defs></svg>',
  kimi: '<svg fill="currentColor" fill-rule="evenodd" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M21.846 0a1.923 1.923 0 110 3.846H20.15a.226.226 0 01-.227-.226V1.923C19.923.861 20.784 0 21.846 0z"></path><path d="M11.065 11.199l7.257-7.2c.137-.136.06-.41-.116-.41H14.3a.164.164 0 00-.117.051l-7.82 7.756c-.122.12-.302.013-.302-.179V3.82c0-.127-.083-.23-.185-.23H3.186c-.103 0-.186.103-.186.23V19.77c0 .128.083.23.186.23h2.69c.103 0 .186-.102.186-.23v-3.25c0-.069.025-.135.069-.178l2.424-2.406a.158.158 0 01.205-.023l6.484 4.772a7.677 7.677 0 003.453 1.283c.108.012.2-.095.2-.23v-3.06c0-.117-.07-.212-.164-.227a5.028 5.028 0 01-2.027-.807l-5.613-4.064c-.117-.078-.132-.279-.028-.381z"></path></svg>',
  moonshot: '<svg fill="currentColor" fill-rule="evenodd" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Kimi</title><path d="M21.846 0a1.923 1.923 0 110 3.846H20.15a.226.226 0 01-.227-.226V1.923C19.923.861 20.784 0 21.846 0z"></path><path d="M11.065 11.199l7.257-7.2c.137-.136.06-.41-.116-.41H14.3a.164.164 0 00-.117.051l-7.82 7.756c-.122.12-.302.013-.302-.179V3.82c0-.127-.083-.23-.185-.23H3.186c-.103 0-.186.103-.186.23V19.77c0 .128.083.23.186.23h2.69c.103 0 .186-.102.186-.23v-3.25c0-.069.025-.135.069-.178l2.424-2.406a.158.158 0 01.205-.023l6.484 4.772a7.677 7.677 0 003.453 1.283c.108.012.2-.095.2-.23v-3.06c0-.117-.07-.212-.164-.227a5.028 5.028 0 01-2.027-.807l-5.613-4.064c-.117-.078-.132-.279-.028-.381z"></path></svg>',
  openrouter: '<svg fill="currentColor" fill-rule="evenodd" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>OpenRouter</title><path d="M18.654 3.87a5.087 5.087 0 110 10.174L23.7 19.09c.64.641.187 1.737-.72 1.737H8.48a8.479 8.479 0 010-16.958h10.175zM8.479 7.26a5.087 5.087 0 100 10.176 5.087 5.087 0 000-10.175z"></path></svg>',
  sensenova: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>SenseNova</title><path d="M23 8.333h-7.333v7.334H23V8.333z" fill="#06FDB7"></path><path d="M1 1v14.667h7.333V8.333h7.334V1H1z" fill="#5B2AD8"></path><path d="M14.038 4.333h.17l1.459 1.456v.17l-1.63-1.626zM13.224 4.333h.17l2.273 2.268v.17l-2.443-2.438zM12.41 4.333h.17l3.087 3.08v.17l-3.257-3.25zM11.596 4.333h.17l3.9 3.892v.108h-.06l-4.01-4zM10.782 4.333h.17l4.01 4h-.17l-4.01-4zM9.968 4.333h.17l4.009 4h-.17l-4.01-4zM9.154 4.333h.17l4.009 4h-.17l-4.01-4zM8.34 4.333h.17l4.01 4h-.17l-4.01-4zM7.521 4.333h.17l4.01 4h-.17l-4.01-4zM6.707 4.333h.17l4.01 4h-.17l-4.01-4zM5.892 4.333h.17l4.009 4h-.17l-4.01-4zM5.077 4.333h.17l4.01 4h-.17l-4.01-4zM4.333 4.403v-.07h.1l4.01 4h-.11v.06l-4-3.99zM4.333 5.215v-.17l4 3.991v.17l-4-3.99zM4.333 6.027v-.17l4 3.991v.17l-4-3.99zM4.333 6.84v-.17l4 3.99v.17l-4-3.99zM4.333 7.652v-.17l4 3.99v.17l-4-3.99zM4.333 8.464v-.17l4 3.99v.17l-4-3.99zM4.333 9.276v-.17l4 3.991v.17l-4-3.991zM4.333 10.088v-.17l4 3.991v.17l-4-3.991zM4.333 10.9v-.17l4 3.991v.17l-4-3.991zM4.333 11.712v-.17l4 3.991v.134h-.036l-3.964-3.955zM4.333 12.526v-.17l3.318 3.31h-.17l-3.148-3.14zM4.333 13.34v-.169l2.502 2.496h-.17L4.333 13.34zM4.333 14.152v-.169l1.688 1.684h-.17l-1.518-1.514zM4.333 14.965v-.17l.874.872h-.17l-.704-.702zM15.667 5.146l-.815-.813h.17l.645.644v.169z" fill="#06FDB7"></path><path d="M23 15.667h-7.333V23H23v-7.333z" fill="#5B2AD8"></path><path d="M15.667 15.667H8.333V23h7.334v-7.333z" fill="#06FDB7"></path></svg>',
  zhipu: '<svg height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>Zhipu</title><path d="M11.991 23.503a.24.24 0 00-.244.248.24.24 0 00.244.249.24.24 0 00.245-.249.24.24 0 00-.22-.247l-.025-.001zM9.671 5.365a1.697 1.697 0 011.099 2.132l-.071.172-.016.04-.018.054c-.07.16-.104.32-.104.498-.035.71.47 1.279 1.186 1.314h.366c1.309.053 2.338 1.173 2.286 2.523-.052 1.332-1.152 2.38-2.478 2.327h-.174c-.715.018-1.274.64-1.239 1.368 0 .124.018.23.053.337.209.373.54.658.96.8.75.23 1.517-.125 1.9-.782l.018-.035c.402-.64 1.17-.96 1.92-.711.854.284 1.378 1.226 1.099 2.167a1.661 1.661 0 01-2.077 1.102 1.711 1.711 0 01-.907-.711l-.017-.035c-.2-.323-.463-.58-.851-.711l-.056-.018a1.646 1.646 0 00-1.954.746 1.66 1.66 0 01-1.065.764 1.677 1.677 0 01-1.989-1.279c-.209-.906.332-1.83 1.257-2.043a1.51 1.51 0 01.296-.035h.018c.68-.071 1.151-.622 1.116-1.333a1.307 1.307 0 00-.227-.693 2.515 2.515 0 01-.366-1.403 2.39 2.39 0 01.366-1.208c.14-.195.21-.444.227-.693.018-.71-.506-1.261-1.186-1.332l-.07-.018a1.43 1.43 0 01-.299-.07l-.05-.019a1.7 1.7 0 01-1.047-2.114 1.68 1.68 0 012.094-1.101zm-5.575 10.11c.26-.264.639-.367.994-.27.355.096.633.379.728.74.095.362-.007.748-.267 1.013-.402.41-1.053.41-1.455 0a1.062 1.062 0 010-1.482zm14.845-.294c.359-.09.738.024.992.297.254.274.344.665.237 1.025-.107.36-.396.634-.756.718-.551.128-1.1-.22-1.23-.781a1.05 1.05 0 01.757-1.26zm-.064-4.39c.314.32.49.753.49 1.206 0 .452-.176.886-.49 1.206-.315.32-.74.5-1.185.5-.444 0-.87-.18-1.184-.5a1.727 1.727 0 010-2.412 1.654 1.654 0 012.369 0zm-11.243.163c.364.484.447 1.128.218 1.691a1.665 1.665 0 01-2.188.923c-.855-.36-1.26-1.358-.907-2.228a1.68 1.68 0 011.33-1.038c.593-.08 1.183.169 1.547.652zm11.545-4.221c.368 0 .708.2.892.524.184.324.184.724 0 1.048a1.026 1.026 0 01-.892.524c-.568 0-1.03-.47-1.03-1.048 0-.579.462-1.048 1.03-1.048zm-14.358 0c.368 0 .707.2.891.524.184.324.184.724 0 1.048a1.026 1.026 0 01-.891.524c-.569 0-1.03-.47-1.03-1.048 0-.579.461-1.048 1.03-1.048zm10.031-1.475c.925 0 1.675.764 1.675 1.706s-.75 1.705-1.675 1.705-1.674-.763-1.674-1.705c0-.942.75-1.706 1.674-1.706zm-2.626-.684c.362-.082.653-.356.761-.718a1.062 1.062 0 00-.238-1.028 1.017 1.017 0 00-.996-.294c-.547.14-.881.7-.752 1.257.13.558.675.907 1.225.783zm0 16.876c.359-.087.644-.36.75-.72a1.062 1.062 0 00-.237-1.019 1.018 1.018 0 00-.985-.301 1.037 1.037 0 00-.762.717c-.108.361-.017.754.239 1.028.245.263.606.377.953.305l.043-.01zM17.19 3.5a.631.631 0 00.628-.64c0-.355-.279-.64-.628-.64a.631.631 0 00-.628.64c0 .355.28.64.628.64zm-10.38 0a.631.631 0 00.628-.64c0-.355-.28-.64-.628-.64a.631.631 0 00-.628.64c0 .355.279.64.628.64zm-5.182 7.852a.631.631 0 00-.628.64c0 .354.28.639.628.639a.63.63 0 00.627-.606l.001-.034a.62.62 0 00-.628-.64zm5.182 9.13a.631.631 0 00-.628.64c0 .355.279.64.628.64a.631.631 0 00.628-.64c0-.355-.28-.64-.628-.64zm10.38.018a.631.631 0 00-.628.64c0 .355.28.64.628.64a.631.631 0 00.628-.64c0-.355-.279-.64-.628-.64zm5.182-9.148a.631.631 0 00-.628.64c0 .354.279.639.628.639a.631.631 0 00.628-.64c0-.355-.28-.64-.628-.64zm-.384-4.992a.24.24 0 00.244-.249.24.24 0 00-.244-.249.24.24 0 00-.244.249c0 .142.122.249.244.249zM11.991.497a.24.24 0 00.245-.248A.24.24 0 0011.99 0a.24.24 0 00-.244.249c0 .133.108.236.223.247l.021.001zM2.011 6.36a.24.24 0 00.245-.249.24.24 0 00-.244-.249.24.24 0 00-.244.249.24.24 0 00.244.249zm0 11.263a.24.24 0 00-.243.248.24.24 0 00.244.249.24.24 0 00.244-.249.252.252 0 00-.244-.248zm19.995-.018a.24.24 0 00-.245.248.24.24 0 00.245.25.24.24 0 00.244-.25.252.252 0 00-.244-.248z" fill="#3859FF" fill-rule="nonzero"></path></svg>'
};
var TILE_COLORS = {
  deepseek: "#4d6bfe",
  openai: "#10a37f",
  anthropic: "#d97757",
  claude: "#d97757",
  google: "#4285f4",
  gemini: "#3186ff",
  qwen: "#7c3aed",
  llama: "#0ea5e9",
  mistral: "#f59e0b",
  groq: "#f55036",
  grok: "#111827",
  doubao: "#2563eb",
  cohere: "#39594d",
  zhipu: "#1e40af",
  glm: "#1e40af",
  moonshot: "#0f172a",
  kimi: "#0f172a",
  sensenova: "#5b2ad8",
  openrouter: "#6366f1",
  opencode: "#059669",
  "our-free-model": "#059669",
  "cherry-studio": "#ec4899",
  magpie: "#f97316",
  default: "#6b7280"
};
var BRAND_KEYS = [
  ["deepseek", "deepseek"],
  ["chatglm", "zhipu"],
  ["glm", "zhipu"],
  ["zhipu", "zhipu"],
  ["kimi", "kimi"],
  ["moonshot", "kimi"],
  ["qwen", "qwen"],
  ["tongyi", "qwen"],
  ["claude", "claude"],
  ["anthropic", "claude"],
  ["gemini", "gemini"],
  ["gpt", "openai"],
  ["openai", "openai"],
  ["grok", "grok"],
  ["doubao", "doubao"],
  ["sensenova", "sensenova"],
  ["shangtang", "sensenova"],
  ["llama", "llama"],
  ["mistral", "mistral"],
  ["openrouter", "openrouter"]
];
function matchLogoKey(provider, model) {
  const m = String(model || "").toLowerCase();
  const p = String(provider || "").toLowerCase();
  for (const [kw, key] of BRAND_KEYS) if (m.includes(kw)) return key;
  for (const [kw, key] of BRAND_KEYS) if (p.includes(kw)) return key;
  for (const k of Object.keys(TILE_COLORS)) {
    if (k !== "default" && (m.includes(k) || p.includes(k))) return k;
  }
  return "";
}
function ModelLogo({ provider, model, size = 28 }) {
  const key = matchLogoKey(provider, model);
  const svg = key && INLINE_LOGOS[key];
  if (svg) {
    return h("span", {
      className: "us-modelLogo us-modelLogoSvg",
      style: { width: size + "px", height: size + "px", fontSize: size + "px" },
      title: provider || model,
      dangerouslySetInnerHTML: { __html: svg }
    });
  }
  const bg = TILE_COLORS[key] || TILE_COLORS.default;
  const name2 = (model || provider || "AI").replace(/^.*\//, "");
  const text = name2.slice(0, 2).toUpperCase();
  return h("span", {
    className: "us-modelLogo",
    style: { width: size + "px", height: size + "px", background: bg, color: "#fff", fontSize: size * 0.4 + "px" },
    title: provider
  }, text);
}
function ic(paths, size = 14) {
  return h("svg", {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  }, paths.map((d, i) => h("path", { key: i, d })));
}
var ICONS = {
  tokens: ["M12 2 2 7l10 5 10-5-10-5z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"],
  requests: ["M17 1l4 4-4 4", "M3 11V9a4 4 0 0 1 4-4h14", "M7 23l-4-4 4-4", "M21 13v2a4 4 0 0 1-4 4H3"],
  yen: ["M6 3l6 7 6-7", "M12 10v11", "M7 14h10", "M7 18h10"],
  cache: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z", "M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"],
  refresh: ["M23 4v6h-6", "M1 20v-6h6", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10", "M1 14l4.64 4.36A9 9 0 0 0 20.49 15"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "M21 21l-4.35-4.35"],
  calendar: ["M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z", "M16 2v4", "M8 2v4", "M3 10h18"],
  alert: ["M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z", "M12 9v4", "M12 17h.01"],
  chartBar: ["M3 3v18h18", "M8 17v-5", "M13 17V7", "M18 17v-8"],
  chartLine: ["M3 3v18h18", "M19 9l-5 5-4-4-4 4"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  flame: ["M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"],
  zap: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
  heat: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"]
};
function useReports(range) {
  const [state, setState] = useState({ report: null, prev: null, err: null });
  const load = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (range.start != null) q.set("start", String(range.start));
      if (range.end != null) q.set("end", String(range.end));
      const curP = fetch("/api/usage-stats?" + q).then(async (res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      });
      let prevP = Promise.resolve(null);
      if (range.start != null) {
        const end = range.end != null ? range.end : Date.now();
        const dur = Math.max(1, end - range.start);
        const pq = new URLSearchParams({ start: String(range.start - dur), end: String(range.start) });
        prevP = fetch("/api/usage-stats?" + pq).then(async (res) => res.ok ? res.json() : null).catch(() => null);
      }
      const [report, prev] = await Promise.all([curP, prevP]);
      setState({ report, prev, err: null });
    } catch (e) {
      setState((s) => ({ ...s, err: String(e instanceof Error ? e.message : e) }));
    }
  }, [range]);
  useEffect(() => {
    void load();
  }, [load]);
  return { ...state, reload: load };
}
function Delta(cur, prevVal, goodUp, isRate) {
  if (cur == null) return h("div", { className: "us-delta us-deltaDim" }, "\u2014");
  if (prevVal == null) return h("div", { className: "us-delta us-deltaDim" }, "\u5168\u90E8\u65F6\u95F4\u7D2F\u8BA1");
  if (prevVal === 0 && cur === 0) return h("div", { className: "us-delta us-deltaDim" }, "\u4E0E\u4E0A\u4E00\u5468\u671F\u6301\u5E73");
  if (prevVal === 0) return h("div", { className: "us-delta us-deltaDim" }, "\u4E0A\u4E00\u5468\u671F\u65E0\u6570\u636E");
  const diff = isRate ? (cur - prevVal) * 100 : (cur - prevVal) / prevVal * 100;
  const clamped = Math.max(-999, Math.min(999, diff));
  const up = cur >= prevVal;
  const good = up === goodUp;
  const txt = (clamped >= 0 ? "+" : "") + clamped.toFixed(1) + (isRate ? "pp" : "%");
  return h(
    "div",
    { className: "us-delta " + (good ? "us-deltaGood" : "us-deltaBad") },
    h("span", { className: "us-deltaArrow" }, up ? "\u2197" : "\u2198"),
    txt + " ",
    h("span", { className: "us-deltaVs" }, "vs. \u4E0A\u4E00\u5468\u671F")
  );
}
function KpiCard({ tone, icon, label, value, sub, spark, delta }) {
  const s = (spark || []).slice(-30);
  const max = Math.max(1e-9, ...s);
  return h(
    "div",
    { className: "us-kpi us-kpi-" + tone },
    h(
      "div",
      { className: "us-kpiTop" },
      h("span", { className: "us-kpiIcon" }, icon),
      h("span", { className: "us-kpiLabel" }, label)
    ),
    h("div", { className: "us-kpiValue" }, value),
    sub != null && h("div", { className: "us-kpiSub" }, sub),
    h(
      "div",
      { className: "us-kpiBottom" },
      delta,
      h(
        "div",
        { className: "us-kpiSpark", "aria-hidden": "true" },
        s.map((v, idx) => h("i", {
          key: idx,
          className: v > 0 ? "" : "us-tickZero",
          style: { height: (v > 0 ? 4 + v / max * 10 : 3) + "px" }
        }))
      )
    )
  );
}
var PLAN_COLORS = ["var(--us-orange)", "var(--us-pink)", "var(--us-blue)"];
function UsageIcon() {
  return h(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: "1em",
      height: "1em",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    },
    h("path", { d: "M3 3v18h18" }),
    h("rect", { x: 7, y: 12, width: 3, height: 6, rx: 1 }),
    h("rect", { x: 12, y: 8, width: 3, height: 10, rx: 1 }),
    h("rect", { x: 17, y: 4, width: 3, height: 14, rx: 1 })
  );
}
var HEAT_WEEKS = 53;
var HEAT_MONTHS = ["1\u6708", "2\u6708", "3\u6708", "4\u6708", "5\u6708", "6\u6708", "7\u6708", "8\u6708", "9\u6708", "10\u6708", "11\u6708", "12\u6708"];
var HEAT_DOW = ["\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D", "\u65E5"];
function heatT(v, max) {
  if (!(v > 0) || !(max > 0)) return 0;
  return Math.log(1 + v) / Math.log(1 + max);
}
function buildHeatWeeks(dailyAll, metric) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(monday.getDate() - (today.getDay() + 6) % 7);
  const cur = new Date(monday);
  cur.setDate(cur.getDate() - (HEAT_WEEKS - 1) * 7);
  const weeks = [];
  for (let w = 0; w < HEAT_WEEKS; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const key = dkey(cur);
      const rec = dailyAll[key];
      days.push({
        key,
        month: cur.getMonth(),
        value: rec ? metricValue(rec, metric) : 0,
        n: rec ? rec.n || 0 : 0,
        future: cur > today
      });
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}
function YearHeatmap({ dailyAll, metric }) {
  const weeks = buildHeatWeeks(dailyAll || {}, metric);
  const flat = weeks.flat();
  const max = Math.max(0, ...flat.map((d) => d.value));
  const total = flat.reduce((s, d) => s + d.value, 0);
  const activeCount = flat.filter((d) => d.value > 0).length;
  const fmtVal = (v) => metric === "cost" ? "\xA5" + v.toFixed(2) : metric === "requests" ? num(v) : fc(v);
  const metricLabel = metric === "cost" ? "\u6210\u672C" : metric === "requests" ? "\u8BF7\u6C42" : "Token";
  const months = [];
  let prevM = -1;
  weeks.forEach((days, w) => {
    if (days[0].month !== prevM) {
      if (months.length) months[months.length - 1].end = w;
      months.push({ w, end: HEAT_WEEKS, label: HEAT_MONTHS[days[0].month] });
      prevM = days[0].month;
    }
  });
  return h(
    "div",
    { className: "us-card us-heatCard" },
    h(
      "div",
      { className: "us-cardHead" },
      h(
        "div",
        null,
        h(
          "h3",
          { className: "us-cardTitle" },
          h("span", { className: "us-cardTitleIcon", style: { color: "var(--us-heat4)" } }, ic(ICONS.heat, 15)),
          "\u5168\u5E74\u6D3B\u52A8"
        ),
        h("div", { className: "us-cardSub" }, `\u8FD1 ${HEAT_WEEKS} \u5468 \xB7 \u6BCF\u65E5${metricLabel} \xB7 \u72EC\u7ACB\u4E8E\u4E0A\u65B9\u8303\u56F4\u7B5B\u9009`)
      ),
      h(
        "div",
        { className: "us-heatMeta" },
        h("div", { className: "us-heatTotal" }, fmtVal(total)),
        h("div", { className: "us-heatMetaSub" }, `${activeCount} \u4E2A\u6D3B\u8DC3\u65E5`)
      )
    ),
    h(
      "div",
      { className: "us-heatScroll" },
      h(
        "div",
        { className: "us-heat" },
        months.map((m) => h("span", {
          key: m.label + m.w,
          className: "us-heatMonth",
          style: { gridColumn: `${m.w + 2} / ${m.end + 2}`, gridRow: 1 }
        }, m.label)),
        HEAT_DOW.map((d, i) => i % 2 === 0 ? h("span", { key: d, className: "us-heatDowLabel", style: { gridColumn: 1, gridRow: i + 2 } }, d) : null),
        weeks.flatMap((days, w) => days.map((d, di) => h("div", {
          key: d.key,
          className: "us-heatCell" + (d.future ? " us-heatFuture" : ""),
          style: { gridColumn: w + 2, gridRow: di + 2, "--ht": heatT(d.value, max).toFixed(3) },
          title: d.future ? "" : `${d.key} \xB7 ${fmtVal(d.value)} \xB7 ${d.n} \u6B21\u8C03\u7528`
        })))
      )
    ),
    h(
      "div",
      { className: "us-heatFoot" },
      h("span", { className: "us-heatLegendLabel" }, "\u5C11"),
      h("span", { className: "us-heatLegendBar" }),
      h("span", { className: "us-heatLegendLabel" }, "\u591A"),
      h("span", { className: "us-heatHint" }, "\u989C\u8272\u8D8A\u6DF1\u4EE3\u8868\u5F53\u65E5\u6D3B\u52A8\u8D8A\u9AD8 \xB7 \u60AC\u6D6E\u67E5\u770B\u660E\u7EC6")
    )
  );
}
function UsagePanel() {
  const [range, setRange] = useState(() => PRESETS.find((p) => p.key === "7d").make(Date.now()));
  const [auto, setAuto] = useState(false);
  const [tip, setTip] = useState(null);
  const [tab, setTab] = useState("\u5168\u90E8");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [metric, setMetric] = useState(() => loadUi("metric", "tokens", ["tokens", "requests", "cost"]));
  const [chartType, setChartType] = useState(() => loadUi("chartType", "bar", ["bar", "line"]));
  const [hoverIdx, setHoverIdx] = useState(null);
  const [chartSize, setChartSize] = useState({ w: 800, h: 230 });
  const roRef = useRef(null);
  const chartRef = useCallback((node) => {
    if (roRef.current) {
      roRef.current.disconnect();
      roRef.current = null;
    }
    if (!node) return;
    const measure = () => setChartSize({ w: Math.max(1, node.clientWidth), h: Math.max(1, node.clientHeight) });
    measure();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(measure);
      ro.observe(node);
      roRef.current = ro;
    }
  }, []);
  const { report, prev, err, reload } = useReports(range);
  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      void reload();
    }, 5e3);
    return () => clearInterval(id);
  }, [auto, reload]);
  const pickRange = (r) => {
    setRange(r);
    setTab("\u5168\u90E8");
    setShowAll(false);
    setHoverIdx(null);
  };
  const pickMetric = (m) => {
    setMetric(m);
    saveUi({ metric: m });
    setHoverIdx(null);
  };
  const pickChartType = (t) => {
    setChartType(t);
    saveUi({ chartType: t });
    setHoverIdx(null);
  };
  if (err) {
    return h(
      "div",
      { className: "us-root" },
      h(
        "div",
        { className: "us-empty" },
        h("div", { className: "us-emptyIcon" }, ic(ICONS.alert, 30)),
        h("div", { className: "us-emptyTitle" }, "\u52A0\u8F7D\u7528\u91CF\u7EDF\u8BA1\u5931\u8D25"),
        h("div", { className: "us-errSub" }, err),
        h("button", { className: "us-btnGhost", style: { marginTop: "14px" }, onClick: () => void reload() }, "\u91CD\u8BD5")
      )
    );
  }
  if (!report) {
    return h(
      "div",
      { className: "us-root" },
      h(
        "div",
        { className: "us-empty" },
        h("div", { className: "us-loading" }),
        h("div", null, "\u52A0\u8F7D\u4E2D\u2026")
      )
    );
  }
  const sum = report.summary || {};
  const ov = report.overview || {};
  const groups = report.groups || [];
  const rows = normalizeRows(groups.flatMap((g) => g.rows)).filter((r) => r.tokens > 0).sort((a, b) => b.tokens - a.tokens);
  const { buckets, monthly } = buildBuckets(report.daily || {}, range);
  const maxV = niceMax(Math.max(0, ...buckets.map((b) => metricValue(b, metric))));
  const hasActivity = buckets.some((b) => b.t > 0);
  const topModels = rows.slice(0, 5);
  const providers = groups.map((g) => g.provider);
  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => (tab === "\u5168\u90E8" || r.provider === tab) && (!q || r.model.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q)));
  const visible = showAll ? filtered : filtered.slice(0, 8);
  const labelStep = Math.max(1, Math.ceil(buckets.length / 10));
  const prevSum = prev ? prev.summary : null;
  const daily = report.daily || {};
  const startDay = range.start != null ? dkey(new Date(range.start)) : null;
  const endDay = range.end != null ? dkey(new Date(range.end)) : dkey(/* @__PURE__ */ new Date());
  const dayKeys = Object.keys(daily).filter((k) => (startDay == null || k >= startDay) && k <= endDay).sort();
  const activeKeys = dayKeys.filter((k) => (daily[k].t || 0) > 0);
  const activeDays = activeKeys.length;
  let peak = null;
  for (const k of activeKeys) {
    const v = metricValue(daily[k], metric);
    if (!peak || v > peak.v) peak = { k, v };
  }
  let streak = 0;
  if (activeKeys.length) {
    const activeSet = new Set(activeKeys);
    const cur = /* @__PURE__ */ new Date(activeKeys[activeKeys.length - 1] + "T00:00:00");
    while (activeSet.has(dkey(cur))) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }
  }
  const peakLabel = peak ? (() => {
    const d = /* @__PURE__ */ new Date(peak.k + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  })() : "\u2014";
  const peakVal = peak ? metric === "cost" ? "\xA5" + peak.v.toFixed(2) : metric === "requests" ? num(peak.v) : fc(peak.v) : "";
  const reqPerDay = activeDays > 0 ? Math.round((sum.requests || 0) / activeDays) : 0;
  const costPerDay = activeDays > 0 ? (sum.cost || 0) / activeDays : 0;
  const sparkTokens = buckets.map((b) => b.t || 0);
  const sparkRequests = buckets.map((b) => b.n || 0);
  const sparkCost = buckets.map((b) => b.cost || 0);
  const sparkCache = buckets.map((b) => (b.i || 0) + (b.c || 0) > 0 ? (b.c || 0) / ((b.i || 0) + (b.c || 0)) : 0);
  const nb = buckets.length;
  const gap = nb > 120 ? 1 : nb > 40 ? 2 : 6;
  const slotW = nb > 0 ? Math.max(1, (chartSize.w - (nb - 1) * gap) / nb) : chartSize.w;
  const cxOf = (i) => i * (slotW + gap) + slotW / 2;
  const cyOf = (v) => chartSize.h - (maxV > 0 ? v / maxV : 0) * chartSize.h;
  const linePts = buckets.map((b, i) => ({ x: cxOf(i), y: cyOf(metricValue(b, metric)), v: metricValue(b, metric) }));
  const fmtAxis = (v) => metric === "cost" ? "\xA5" + trim(v) : fc(v);
  const chartTitle = metric === "requests" ? "\u8BF7\u6C42\u6D3B\u52A8" : metric === "cost" ? "\u6210\u672C\u6D3B\u52A8" : "Token \u6D3B\u52A8";
  const chartSub = `\u6309${monthly ? "\u6708" : "\u65E5"}\u7EDF\u8BA1 \xB7 ` + (metric === "tokens" ? chartType === "bar" ? "\u8F93\u5165 / \u8F93\u51FA / \u7F13\u5B58\u8BFB\u53D6" : "Token \u5408\u8BA1" : metric === "requests" ? "\u8BF7\u6C42\u6570" : "\u4F30\u7B97\u6210\u672C (\xA5)");
  const tipLines = (b) => {
    const head = b.label + (b.current ? monthly ? " \xB7 \u672C\u6708" : " \xB7 \u4ECA\u65E5" : "");
    if (metric === "requests") return [head, "\u8BF7\u6C42\u6570 " + num(b.n), "Token \u5408\u8BA1 " + fc(b.t)];
    if (metric === "cost") return [head, "\u4F30\u7B97\u6210\u672C \xA5" + Number(b.cost || 0).toFixed(2), "Token \u5408\u8BA1 " + fc(b.t)];
    return [head, "\u8F93\u5165 " + fc(b.i), "\u8F93\u51FA " + fc(b.o), "\u7F13\u5B58\u8BFB\u53D6 " + fc(b.c), "\u5408\u8BA1 " + fc(b.t)];
  };
  const barTip = (b) => (e) => setTip({ lines: tipLines(b), x: e.clientX, y: e.clientY });
  const moveTip = (e) => setTip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : t);
  return h(
    "div",
    { className: "us-root" },
    /* page head */
    h(
      "div",
      { className: "us-pageHead" },
      h(
        "div",
        { className: "us-crumbs" },
        h("span", null, "Harness"),
        h("span", { className: "us-crumbSep" }, "\u203A"),
        h("span", null, "Insights"),
        h("span", { className: "us-crumbSep" }, "\u203A"),
        h("b", null, "\u7528\u91CF\u7EDF\u8BA1")
      ),
      h(
        "div",
        { className: "us-titleRow" },
        h(
          "div",
          null,
          h("h1", null, "\u7528\u91CF\u7EDF\u8BA1"),
          h("p", null, "DeepSeek Harness \u5185\u7684\u6A21\u578B\u8BF7\u6C42\u3001Token \u6D88\u8017\u4E0E\u6210\u672C\u4F30\u7B97\u3002")
        ),
        h(
          "div",
          { className: "us-pageTools" },
          h("span", { className: "us-live" }, h("i"), "\u672C\u5730\u7EDF\u8BA1"),
          h(
            "button",
            {
              className: "us-switchBtn",
              onClick: () => setAuto(!auto),
              title: "\u6BCF 5 \u79D2\u81EA\u52A8\u5237\u65B0"
            },
            h(
              "span",
              { className: "us-switchTrack" + (auto ? " us-switchTrackOn" : "") },
              h("span", { className: "us-switchThumb" })
            ),
            h("span", null, auto ? "\u81EA\u52A8 5s" : "\u81EA\u52A8\u5173\u95ED")
          ),
          h(
            "button",
            { className: "us-btnPrimary", onClick: () => void reload() },
            ic(ICONS.refresh, 13),
            "\u5237\u65B0"
          )
        )
      )
    ),
    /* KPI cards */
    h(
      "div",
      { className: "us-kpis" },
      h(KpiCard, {
        tone: "orange",
        icon: ic(ICONS.tokens, 14),
        label: "Token \u6D88\u8017",
        value: fc(sum.tokens),
        sub: `\u8F93\u5165 ${fc(sum.inputTokens)} \xB7 \u8F93\u51FA ${fc(sum.outputTokens)} \xB7 \u7F13\u5B58 ${fc(sum.cacheReadTokens)}`,
        spark: sparkTokens,
        delta: Delta(sum.tokens, prevSum ? prevSum.tokens : null, true)
      }),
      h(KpiCard, {
        tone: "blue",
        icon: ic(ICONS.requests, 14),
        label: "\u8BF7\u6C42\u6570",
        value: sum.requests != null ? num(sum.requests) : "\u2014",
        sub: `\u65E5\u5747 ${num(reqPerDay)} \u6B21 \xB7 ${activeDays} \u4E2A\u6D3B\u8DC3\u65E5`,
        spark: sparkRequests,
        delta: Delta(sum.requests, prevSum ? prevSum.requests : null, true)
      }),
      h(KpiCard, {
        tone: "green",
        icon: ic(ICONS.yen, 14),
        label: "\u4F30\u7B97\u6210\u672C",
        value: "\xA5" + Number(sum.cost || 0).toFixed(2),
        sub: `\u65E5\u5747 \xA5${costPerDay.toFixed(2)} \xB7 \u9AD8\u5CF0\u65F6\u6BB5 \xD72`,
        spark: sparkCost,
        delta: Delta(sum.cost, prevSum ? prevSum.cost : null, false)
      }),
      h(KpiCard, {
        tone: "amber",
        icon: ic(ICONS.cache, 14),
        label: "\u7F13\u5B58\u547D\u4E2D\u7387",
        value: ((sum.cacheHitRate || 0) * 100).toFixed(1) + "%",
        sub: `\u8BFB\u53D6 ${fc(sum.cacheReadTokens)} \xB7 \u5199\u5165 ${fc(sum.cacheWriteTokens)}`,
        spark: sparkCache,
        delta: Delta(sum.cacheHitRate, prevSum ? prevSum.cacheHitRate : null, true, true)
      })
    ),
    /* chart + leaderboard */
    h(
      "div",
      { className: "us-midGrid" },
      h(
        "div",
        { className: "us-card" },
        h(
          "div",
          { className: "us-cardHead" },
          h(
            "div",
            null,
            h(
              "h3",
              { className: "us-cardTitle" },
              h(
                "span",
                { className: "us-cardTitleIcon", style: { color: METRIC_COLOR[metric] } },
                ic(metric === "requests" ? ICONS.requests : metric === "cost" ? ICONS.yen : ICONS.tokens, 15)
              ),
              chartTitle
            ),
            h("div", { className: "us-cardSub" }, chartSub)
          ),
          h(TimeRangePicker, { value: range, onChange: pickRange })
        ),
        h(
          "div",
          { className: "us-chartControls" },
          h(
            "div",
            { className: "us-seg-ctrl", role: "group", "aria-label": "\u6307\u6807" },
            METRICS.map((m) => h("button", {
              key: m.key,
              type: "button",
              className: "us-segBtn" + (metric === m.key ? " us-segBtnOn" : ""),
              "aria-pressed": metric === m.key,
              onClick: () => pickMetric(m.key)
            }, ic(ICONS[m.icon], 12), m.label))
          ),
          h(
            "div",
            { className: "us-seg-ctrl", role: "group", "aria-label": "\u56FE\u8868\u7C7B\u578B" },
            CHART_TYPES.map((t) => h("button", {
              key: t.key,
              type: "button",
              className: "us-segBtn" + (chartType === t.key ? " us-segBtnOn" : ""),
              "aria-pressed": chartType === t.key,
              onClick: () => pickChartType(t.key)
            }, ic(ICONS[t.icon], 12), t.label))
          ),
          h(
            "div",
            { className: "us-legend" },
            (metric === "tokens" && chartType === "bar" ? [["us-segI", "\u8F93\u5165"], ["us-segO", "\u8F93\u51FA"], ["us-segC", "\u7F13\u5B58"]] : metric === "tokens" ? [["us-segI", "Token \u5408\u8BA1"]] : metric === "requests" ? [["us-segReq", "\u8BF7\u6C42\u6570"]] : [["us-segCost", "\u4F30\u7B97\u6210\u672C"]]).map(([cls, label]) => h("span", { key: label }, h("i", { className: cls }), label))
          )
        ),
        !hasActivity ? h("div", { className: "us-chartEmpty" }, "\u6240\u9009\u8303\u56F4\u5185\u6682\u65E0\u8C03\u7528\u8BB0\u5F55") : h(
          Fragment,
          null,
          h(
            "div",
            { className: "us-chart", ref: chartRef },
            [0, 1, 2, 3, 4].map((i) => h("div", {
              key: i,
              className: "us-gridLine",
              style: { bottom: i * 25 + "%" }
            }, h("span", null, fmtAxis(maxV * i / 4)))),
            chartType === "bar" ? h(
              "div",
              { className: "us-bars", style: { gap: gap + "px" } },
              buckets.map((b) => {
                const segs = metric === "tokens" ? [["i", b.i, "us-segI"], ["o", b.o, "us-segO"], ["c", b.c, "us-segC"]].filter((s) => s[1] > 0) : metric === "requests" ? b.n > 0 ? [["n", b.n, "us-segReq"]] : [] : b.cost > 0 ? [["cost", b.cost, "us-segCost"]] : [];
                const heights = segs.map((s) => Math.max(1.5, s[1] / maxV * 100));
                const totalH = heights.reduce((a, x) => a + x, 0);
                const active = b.current && metricValue(b, metric) > 0;
                return h(
                  "div",
                  {
                    key: b.key,
                    className: "us-barWrap",
                    onMouseEnter: barTip(b),
                    onMouseMove: moveTip,
                    onMouseLeave: () => setTip(null)
                  },
                  active && h("span", {
                    className: "us-mtd",
                    style: { bottom: `calc(${totalH}% + ${(segs.length - 1) * 2 + 6}px)` }
                  }, monthly ? "\u672C\u6708" : "\u4ECA\u65E5"),
                  h(
                    "div",
                    { className: "us-bar" + (active ? " us-barCurrent" : "") },
                    segs.length === 0 ? h("div", { className: "us-segZero" }) : segs.map((s, idx) => h("div", {
                      key: s[0],
                      className: "us-seg " + s[2],
                      style: { height: heights[idx] + "%" }
                    }))
                  )
                );
              })
            ) : h(
              Fragment,
              null,
              h(
                "div",
                { className: "us-lineHits", style: { gap: gap + "px" } },
                buckets.map((b, i) => h("div", {
                  key: b.key,
                  className: "us-lineHit",
                  onMouseEnter: (e) => {
                    setHoverIdx(i);
                    barTip(b)(e);
                  },
                  onMouseMove: moveTip,
                  onMouseLeave: () => {
                    setHoverIdx(null);
                    setTip(null);
                  }
                }))
              ),
              h(
                "svg",
                {
                  className: "us-lineSvg",
                  width: chartSize.w,
                  height: chartSize.h,
                  viewBox: `0 0 ${chartSize.w} ${chartSize.h}`,
                  "aria-hidden": "true"
                },
                h(
                  "defs",
                  null,
                  h(
                    "linearGradient",
                    { id: "us-lineGrad", x1: "0", y1: "0", x2: "0", y2: "1" },
                    h("stop", { offset: "0%", stopColor: METRIC_COLOR[metric], stopOpacity: 0.28 }),
                    h("stop", { offset: "100%", stopColor: METRIC_COLOR[metric], stopOpacity: 0 })
                  )
                ),
                nb >= 2 && h("path", {
                  key: "area-" + metric,
                  className: "us-lineArea",
                  fill: "url(#us-lineGrad)",
                  d: smoothPath(linePts, chartSize.h) + ` L${linePts[nb - 1].x.toFixed(2)},${chartSize.h} L${linePts[0].x.toFixed(2)},${chartSize.h} Z`
                }),
                nb >= 2 && h("path", {
                  key: "line-" + metric,
                  className: "us-linePath",
                  fill: "none",
                  stroke: METRIC_COLOR[metric],
                  strokeWidth: 2,
                  pathLength: 1,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  d: smoothPath(linePts, chartSize.h)
                }),
                linePts.map((p, i) => p.v > 0 ? h("circle", {
                  key: "pt-" + i,
                  className: "us-linePt",
                  cx: p.x,
                  cy: p.y,
                  r: buckets[i].current ? 4 : 3,
                  fill: METRIC_COLOR[metric],
                  strokeWidth: 1.5,
                  style: { stroke: "var(--us-card)" }
                }) : null),
                hoverIdx != null && linePts[hoverIdx] && h(
                  "g",
                  { key: "hover" },
                  h("line", {
                    className: "us-cursor",
                    x1: linePts[hoverIdx].x,
                    x2: linePts[hoverIdx].x,
                    y1: 0,
                    y2: chartSize.h,
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                    style: { stroke: "var(--us-faint)" }
                  }),
                  h("circle", {
                    cx: linePts[hoverIdx].x,
                    cy: linePts[hoverIdx].y,
                    r: 5,
                    fill: METRIC_COLOR[metric],
                    strokeWidth: 2,
                    style: { stroke: "var(--us-card)" }
                  })
                )
              ),
              (() => {
                const ci = buckets.findIndex((b) => b.current && metricValue(b, metric) > 0);
                if (ci < 0) return null;
                const p = linePts[ci];
                return h("span", {
                  className: "us-mtd",
                  style: { left: p.x + "px", bottom: chartSize.h - p.y + 10 + "px" }
                }, monthly ? "\u672C\u6708" : "\u4ECA\u65E5");
              })()
            )
          ),
          h(
            "div",
            { className: "us-chartX", style: { gap: gap + "px" } },
            buckets.map((b, idx) => {
              const long = buckets.length > 60;
              const show = long ? b.tick != null || idx === 0 || idx === buckets.length - 1 : idx % labelStep === 0 || idx === buckets.length - 1;
              return h("span", {
                key: b.key,
                style: { visibility: show ? "visible" : "hidden" }
              }, long ? b.tick || b.label : b.label);
            })
          )
        ),
        hasActivity && h(
          "div",
          { className: "us-stats" },
          [
            { icon: "calendar", label: "\u6D3B\u8DC3\u5929\u6570", value: `${activeDays} \u5929`, tone: "blue" },
            { icon: "flame", label: "\u5CF0\u503C\u65E5", value: peak ? `${peakLabel} \xB7 ${peakVal}` : "\u2014", tone: "orange" },
            { icon: "zap", label: "\u8FDE\u7EED\u4F7F\u7528", value: `${streak} \u5929`, tone: "green" }
          ].map((s) => h(
            "div",
            { key: s.label, className: "us-stat us-stat-" + s.tone },
            h("span", { className: "us-statIcon" }, ic(ICONS[s.icon], 14)),
            h(
              "span",
              { className: "us-statBody" },
              h("span", { className: "us-statLabel" }, s.label),
              h("span", { className: "us-statValue" }, s.value)
            )
          ))
        ),
        h(
          "div",
          { className: "us-chartFoot" },
          h(
            "span",
            null,
            "\u8303\u56F4 ",
            h("b", null, range.label),
            range.start != null ? " \xB7 " + fmtDT(range.start) + " \u8D77" : ""
          ),
          h(
            "span",
            null,
            `\u7D2F\u8BA1 ${fc(ov.totalTokens)} tokens \xB7 ${ov.totalCalls != null ? ov.totalCalls : "\u2014"} \u6B21\u8C03\u7528`,
            report.debug && report.debug.version ? " \xB7 host " + report.debug.version : ""
          )
        )
      ),
      h(
        "div",
        { className: "us-card us-side" },
        h(
          "div",
          { className: "us-cardHead" },
          h("h3", null, "\u6A21\u578B\u6392\u884C"),
          h("span", { className: "us-sideCount" }, rows.length + " \u4E2A\u6A21\u578B")
        ),
        h("div", { className: "us-sideTotal" }, fc(sum.tokens)),
        h("div", { className: "us-sideSub" }, `tokens \xB7 ${sum.requests != null ? sum.requests : 0} \u6B21\u8C03\u7528`),
        topModels.length === 0 ? h("div", { className: "us-chartEmpty", style: { padding: "24px 0" } }, "\u6682\u65E0\u6570\u636E") : topModels.map((r, i) => h(
          "div",
          { key: r.provider + "::" + r.model, className: "us-plan" },
          h(
            "div",
            { className: "us-planRow" },
            ModelLogo({ provider: r.provider, model: r.model, size: 16 }),
            h("span", { className: "us-planName", title: r.provider + "/" + r.model }, r.model),
            h("span", { className: "us-planCalls" }, r.calls + " \u6B21"),
            h("span", { className: "us-planVal" }, fc(r.tokens))
          ),
          h(
            "div",
            { className: "us-planTrack" },
            h("div", {
              className: "us-planBar",
              style: {
                width: Math.max(2, r.tokens / topModels[0].tokens * 100) + "%",
                background: PLAN_COLORS[i % PLAN_COLORS.length]
              }
            })
          )
        )),
        h(
          "div",
          { className: "us-costBox" },
          h("span", { className: "us-costIcon" }, ic(ICONS.yen, 14)),
          h(
            "span",
            { className: "us-costText" },
            h("b", null, "\u4F30\u7B97\u6210\u672C \xA5" + Number(sum.cost || 0).toFixed(2)),
            h("small", null, "\u6309\u5B98\u65B9\u516C\u5F00\u4EF7 \xB7 \u9AD8\u5CF0\u65F6\u6BB5 \xD72")
          ),
          h("span", { className: "us-costChevron" }, "\u203A")
        )
      )
    ),
    /* year activity heatmap */
    h(YearHeatmap, { dailyAll: report.dailyAll, metric }),
    /* detail table */
    h(
      "div",
      { className: "us-card" },
      h(
        "div",
        { className: "us-cardHead" },
        h(
          "div",
          null,
          h("h3", null, "\u8C03\u7528\u660E\u7EC6"),
          h("div", { className: "us-cardSub" }, "\u6240\u9009\u8303\u56F4\u5185\u5404\u6A21\u578B\u7684 Token \u4E0E\u6210\u672C\u660E\u7EC6")
        ),
        h(
          "div",
          { className: "us-tableTools" },
          h(
            "div",
            { className: "us-search" },
            ic(ICONS.search, 13),
            h("input", {
              type: "text",
              value: query,
              placeholder: "\u641C\u7D22\u6A21\u578B\u2026",
              onChange: (e) => {
                setQuery(e.target.value);
                setShowAll(false);
              }
            })
          ),
          h("button", {
            className: "us-btnGhost",
            onClick: () => exportCsv(filtered, sum.tokens || 0),
            disabled: filtered.length === 0,
            title: "\u5BFC\u51FA\u5F53\u524D\u7B5B\u9009\u7ED3\u679C\u4E3A CSV"
          }, ic(ICONS.download, 13), "\u5BFC\u51FA CSV"),
          filtered.length > 8 && h("button", {
            className: "us-btnGhost",
            onClick: () => setShowAll(!showAll)
          }, showAll ? "\u6536\u8D77" : "\u67E5\u770B\u5168\u90E8 (" + filtered.length + ")")
        )
      ),
      h(
        "div",
        { className: "us-tabs" },
        ["\u5168\u90E8"].concat(providers).map((p) => h("button", {
          key: p,
          className: "us-tab" + (tab === p ? " us-tabOn" : ""),
          onClick: () => {
            setTab(p);
            setShowAll(false);
          }
        }, p))
      ),
      visible.length === 0 ? h("div", { className: "us-tableEmpty" }, "\u6CA1\u6709\u5339\u914D\u7684\u6A21\u578B") : h(
        "div",
        { className: "us-tableWrap" },
        h(
          "table",
          { className: "us-table" },
          h("thead", null, h(
            "tr",
            null,
            h("th", null, "\u6A21\u578B"),
            h("th", null, "\u63D0\u4F9B\u5546"),
            h("th", { className: "us-num" }, "\u603B Tokens"),
            h("th", { className: "us-num" }, "\u8F93\u5165"),
            h("th", { className: "us-num" }, "\u8F93\u51FA"),
            h("th", { className: "us-num" }, "\u7F13\u5B58"),
            h("th", { className: "us-num" }, "\u8C03\u7528"),
            h("th", { className: "us-num" }, "\u6210\u672C"),
            h("th", { className: "us-num" }, "\u5360\u6BD4")
          )),
          h("tbody", null, visible.map((r) => h(
            "tr",
            { key: r.provider + "::" + r.model },
            h("td", null, h(
              "span",
              { className: "us-tdModel" },
              ModelLogo({ provider: r.provider, model: r.model, size: 18 }),
              r.model
            )),
            h("td", { className: "us-dim" }, r.provider),
            h("td", { className: "us-num us-strong" }, fc(r.tokens)),
            h("td", { className: "us-num us-dim" }, fc(r.inp)),
            h("td", { className: "us-num us-dim" }, fc(r.out)),
            h("td", { className: "us-num us-dim" }, fc(r.cr)),
            h("td", { className: "us-num us-dim" }, String(r.calls)),
            h("td", { className: "us-num us-strong" }, "\xA5" + r.cost.toFixed(2)),
            h(
              "td",
              { className: "us-num" },
              h(
                "span",
                { className: "us-sharePill" },
                (sum.tokens > 0 ? (r.tokens / sum.tokens * 100).toFixed(1) : "0.0") + "%"
              )
            )
          )))
        )
      )
    ),
    tip && h(
      "div",
      { className: "us-tooltip", style: { left: tip.x + 12, top: tip.y + 12 } },
      tip.lines.map((l, i) => h("div", { key: i, className: i === 0 ? "us-tipTitle" : "" }, l))
    )
  );
}
function TimeRangePicker(props) {
  const { value, onChange } = props;
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  return h(
    "div",
    { className: "us-dropdown", ref: rootRef },
    h("button", {
      className: "us-dropBtn" + (open ? " us-open" : ""),
      onClick: () => setOpen(!open)
    }, ic(ICONS.calendar, 13), value.label, h("span", { className: "us-dropChevron" }, "\u25BE")),
    open && h(
      "div",
      { className: "us-rangeMenu" },
      PRESETS.map((p) => {
        const r = p.make(Date.now());
        const picked = sameRange(value, r);
        return h("button", {
          key: p.key,
          className: "us-chip" + (picked ? " us-chipOn" : ""),
          onClick: () => {
            onChange(r);
            setOpen(false);
          }
        }, p.label);
      })
    )
  );
}
function apply(ctx, _config = {}) {
  const slots = ctx.slots;
  if (!slots || typeof slots.register !== "function") return;
  injectStyles();
  slots.inject("sidebar.panellist", () => slots.register(
    { name: "sidebar.panellist", id: PANEL_ID, order: 70, label: "\u7528\u91CF\u7EDF\u8BA1" },
    () => h(UsageIcon, {})
  ));
  slots.inject("main", () => slots.register(
    { name: "main", key: PANEL_ID },
    () => h(UsagePanel, {})
  ));
}
var styleInjected = false;
function injectStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const css = document.getElementById("usage-stats-style");
  if (!css) {
    const el = document.createElement("style");
    el.id = "usage-stats-style";
    el.textContent = STYLES;
    document.head.appendChild(el);
  }
}
var STYLES = `
.us-root {
  --us-bg: #f4f5f7;
  --us-card: #ffffff;
  --us-border: #e7e9ee;
  --us-fg: #17191f;
  --us-sub: #6b7280;
  --us-faint: #9ca3af;
  --us-track: #eef0f3;
  --us-tick: #e2e5ea;
  --us-hover: #f8f9fb;
  --us-orange: #ff4d24;
  --us-pink: #ff7bac;
  --us-blue: #3d9bff;
  --us-green: #16a34a;
  --us-amber: #f5b50a;
  --us-red: #dc2626;
  --us-green-soft: #e8f7ee;
  --us-heat0: #edeaf6;
  --us-heat1: #d9ccf8;
  --us-heat2: #b79df2;
  --us-heat3: #8b5cf6;
  --us-heat4: #6d28d9;
  --us-radius: 14px;
  --us-shadow: 0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06);
  --us-shadow-lg: 0 8px 24px rgba(16,24,40,.10), 0 2px 6px rgba(16,24,40,.06);
  background: var(--us-bg);
  color: var(--us-fg);
  height: 100%;
  max-height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  box-sizing: border-box;
  padding: clamp(16px, 3vw, 30px) clamp(16px, 3.5vw, 36px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-size: 13px;
  line-height: 1.45;
  scrollbar-width: thin;
  scrollbar-color: var(--us-tick) transparent;
}
.us-root *, .us-root *::before, .us-root *::after { box-sizing: border-box; }
.us-root ::-webkit-scrollbar { width: 10px; height: 10px; }
.us-root ::-webkit-scrollbar-track { background: transparent; }
.us-root ::-webkit-scrollbar-thumb { background: var(--us-tick); border-radius: 999px; border: 2px solid var(--us-bg); }
.us-root ::-webkit-scrollbar-thumb:hover { background: var(--us-faint); }
.us-root button { font: inherit; }

@keyframes us-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes us-fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes us-spin { to { transform: rotate(360deg); } }
@keyframes us-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.85); } }

/* page head */
.us-pageHead { display: flex; flex-direction: column; gap: 8px; }
.us-crumbs { font-size: 12px; color: var(--us-sub); display: flex; align-items: center; gap: 7px; }
.us-crumbs b { color: var(--us-fg); font-weight: 600; }
.us-crumbSep { color: var(--us-faint); }
.us-titleRow { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.us-titleRow h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -.01em; }
.us-titleRow p { margin: 4px 0 0; font-size: 12.5px; color: var(--us-sub); }
.us-pageTools { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.us-live {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 600; padding: 5px 12px;
  border-radius: 999px; background: var(--us-green-soft); color: var(--us-green);
  border: 1px solid rgba(22,163,74,.25); white-space: nowrap;
}
.us-live i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; animation: us-pulse 2s ease-in-out infinite; }
.us-btnPrimary {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--us-fg); color: var(--us-card);
  border: 1px solid var(--us-fg); border-radius: 10px;
  padding: 7px 14px; font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: opacity .15s ease, transform .15s ease;
}
.us-btnPrimary:hover { opacity: .85; }
.us-btnPrimary:active { transform: scale(.97); }
.us-btnGhost {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--us-card); color: var(--us-fg);
  border: 1px solid var(--us-border); border-radius: 10px;
  padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
  transition: background .15s ease, border-color .15s ease;
}
.us-btnGhost:hover { background: var(--us-hover); border-color: var(--us-faint); }
.us-btnGhost:disabled { opacity: .45; cursor: not-allowed; }
.us-btnGhost:disabled:hover { background: var(--us-card); border-color: var(--us-border); }
.us-switchBtn {
  display: inline-flex; align-items: center; gap: 7px;
  background: transparent; border: none; cursor: pointer;
  font-size: 12px; color: var(--us-sub); padding: 0;
}
.us-switchBtn:hover { color: var(--us-fg); }
.us-switchTrack {
  width: 32px; height: 18px; border-radius: 999px;
  background: var(--us-tick); position: relative; display: inline-block;
  transition: background .2s ease; flex: none;
}
.us-switchTrackOn { background: var(--us-green); }
.us-switchThumb {
  position: absolute; top: 2px; left: 2px; width: 14px; height: 14px;
  border-radius: 50%; background: #fff; transition: left .2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,.25);
}
.us-switchTrackOn .us-switchThumb { left: 16px; }

/* KPI cards */
.us-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.us-kpi {
  background: var(--us-card); border: 1px solid var(--us-border);
  border-radius: var(--us-radius); padding: 15px 16px 13px;
  box-shadow: var(--us-shadow); display: flex; flex-direction: column;
  animation: us-rise .35s ease both;
  transition: box-shadow .2s ease, transform .2s ease;
}
.us-kpi:nth-child(2) { animation-delay: .05s; }
.us-kpi:nth-child(3) { animation-delay: .1s; }
.us-kpi:nth-child(4) { animation-delay: .15s; }
.us-kpi:hover { box-shadow: var(--us-shadow-lg); transform: translateY(-1px); }
.us-kpiTop { display: flex; align-items: center; gap: 8px; }
.us-kpiIcon {
  width: 26px; height: 26px; border-radius: 8px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
}
.us-kpiLabel { font-size: 12px; font-weight: 600; color: var(--us-sub); }
.us-kpiValue { font-size: 26px; font-weight: 700; letter-spacing: -.01em; margin: 9px 0 4px; font-variant-numeric: tabular-nums; }
.us-kpiSub { font-size: 11px; color: var(--us-faint); margin-bottom: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.us-kpiBottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; margin-top: auto; }
.us-kpiSpark { display: flex; align-items: flex-end; gap: 2px; height: 16px; flex: none; }
.us-kpiSpark i { width: 3px; border-radius: 1px; display: block; }
.us-kpiSpark i.us-tickZero { background: var(--us-tick) !important; }
.us-kpi-orange .us-kpiIcon { color: var(--us-orange); background: rgba(255,77,36,.10); }
.us-kpi-orange .us-kpiSpark i { background: var(--us-orange); }
.us-kpi-blue .us-kpiIcon { color: var(--us-blue); background: rgba(61,155,255,.12); }
.us-kpi-blue .us-kpiSpark i { background: var(--us-blue); }
.us-kpi-green .us-kpiIcon { color: var(--us-green); background: rgba(22,163,74,.10); }
.us-kpi-green .us-kpiSpark i { background: var(--us-green); }
.us-kpi-amber .us-kpiIcon { color: #b98207; background: rgba(245,181,10,.14); }
.us-kpi-amber .us-kpiSpark i { background: var(--us-amber); }
.us-delta { font-size: 11.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.us-deltaGood { color: var(--us-green); }
.us-deltaBad { color: var(--us-red); }
.us-deltaDim { color: var(--us-faint); font-weight: 500; }
.us-deltaArrow { margin-right: 2px; }
.us-deltaVs { color: var(--us-faint); font-weight: 400; }

/* cards & mid grid */
.us-midGrid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 14px; align-items: stretch; }
.us-card {
  background: var(--us-card); border: 1px solid var(--us-border);
  border-radius: var(--us-radius); padding: 18px;
  box-shadow: var(--us-shadow); animation: us-rise .4s ease both; animation-delay: .12s;
  min-width: 0;
}
.us-cardHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
.us-cardHead h3 { margin: 0; font-size: 15px; font-weight: 650; }
.us-cardSub { font-size: 11.5px; color: var(--us-faint); margin-top: 3px; }

/* chart */
.us-cardTitle { display: flex; align-items: center; gap: 7px; }
.us-cardTitleIcon { display: inline-flex; flex: none; }
.us-chartControls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
.us-seg-ctrl {
  display: inline-flex; align-items: center; gap: 2px;
  background: var(--us-track); padding: 3px; border-radius: 10px;
}
.us-segBtn {
  display: inline-flex; align-items: center; gap: 5px;
  border: none; background: transparent; padding: 5px 10px; border-radius: 7px;
  font-size: 11.5px; font-weight: 600; color: var(--us-sub); cursor: pointer;
  transition: background .12s ease, color .12s ease; white-space: nowrap;
}
.us-segBtn:hover { color: var(--us-fg); }
.us-segBtnOn { background: var(--us-card); color: var(--us-fg); box-shadow: var(--us-shadow); }
.us-legend { display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: var(--us-sub); margin-left: auto; }
.us-legend span { display: inline-flex; align-items: center; gap: 5px; }
.us-legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.us-chartEmpty { padding: 56px 16px; text-align: center; color: var(--us-faint); font-size: 12.5px; }
.us-chart { position: relative; height: 230px; margin: 10px 0 0 44px; }
.us-gridLine { position: absolute; left: 0; right: 0; border-top: 1px dashed var(--us-border); }
.us-gridLine span {
  position: absolute; left: -44px; top: -7px; width: 38px;
  text-align: right; font-size: 10px; color: var(--us-faint);
  font-variant-numeric: tabular-nums;
}
.us-bars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 6px; }
.us-barWrap {
  flex: 1; min-width: 0; height: 100%; position: relative;
  display: flex; align-items: flex-end; justify-content: center;
  border-radius: 8px; transition: background .12s ease;
}
.us-barWrap:hover { background: var(--us-hover); }
.us-bar { width: 100%; max-width: 38px; height: 100%; display: flex; flex-direction: column-reverse; gap: 2px; }
.us-seg { border-radius: 3px; flex: none; }
.us-segI { background: var(--us-orange); }
.us-segO { background: var(--us-pink); }
.us-segC { background: var(--us-blue); }
.us-segReq { background: var(--us-blue); }
.us-segCost { background: var(--us-green); }
.us-barCurrent .us-seg {
  background-image: repeating-linear-gradient(135deg, rgba(255,255,255,.5) 0 3px, transparent 3px 7px);
}
.us-segZero { height: 3px; width: 100%; border-radius: 2px; background: var(--us-tick); }
.us-mtd {
  position: absolute; left: 50%; transform: translateX(-50%);
  background: var(--us-fg); color: var(--us-card);
  font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
  white-space: nowrap; z-index: 3; pointer-events: none;
}
/* line mode */
.us-lineHits { position: absolute; inset: 0; display: flex; gap: 6px; }
.us-lineHit { flex: 1; min-width: 0; height: 100%; border-radius: 8px; transition: background .12s ease; }
.us-lineHit:hover { background: var(--us-hover); }
.us-lineSvg { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
.us-lineArea { animation: us-fadeIn .45s ease both; }
.us-linePath { stroke-dasharray: 1; stroke-dashoffset: 1; animation: us-draw .7s ease forwards; }
.us-linePt { animation: us-fadeIn .5s ease both; }
.us-cursor { opacity: .7; }
@keyframes us-draw { to { stroke-dashoffset: 0; } }
.us-chartX { display: flex; gap: 6px; margin: 8px 0 0 44px; }
.us-chartX span {
  flex: 1; min-width: 0; text-align: center; font-size: 10.5px;
  color: var(--us-faint); overflow: visible; white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
/* activity stats strip */
.us-stats { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.us-stat {
  flex: 1; min-width: 130px; display: flex; align-items: center; gap: 9px;
  background: var(--us-track); border-radius: 11px; padding: 9px 12px;
}
.us-statIcon {
  width: 28px; height: 28px; border-radius: 8px; flex: none;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--us-card);
}
.us-stat-blue .us-statIcon { color: var(--us-blue); }
.us-stat-orange .us-statIcon { color: var(--us-orange); }
.us-stat-green .us-statIcon { color: var(--us-green); }
.us-statBody { min-width: 0; display: flex; flex-direction: column; }
.us-statLabel { font-size: 10.5px; color: var(--us-faint); font-weight: 600; }
.us-statValue { font-size: 13px; font-weight: 650; color: var(--us-fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.us-chartFoot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;
  margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--us-border);
  font-size: 11.5px; color: var(--us-faint);
}
.us-chartFoot b { color: var(--us-sub); font-weight: 600; }

/* leaderboard side card */
.us-side { display: flex; flex-direction: column; }
.us-sideCount {
  font-size: 11px; color: var(--us-sub); background: var(--us-track);
  padding: 3px 9px; border-radius: 999px; white-space: nowrap;
}
.us-sideTotal { font-size: 30px; font-weight: 700; letter-spacing: -.01em; font-variant-numeric: tabular-nums; }
.us-sideSub { font-size: 12px; color: var(--us-sub); margin: 2px 0 16px; }
.us-plan { margin-bottom: 13px; }
.us-planRow { display: flex; align-items: center; gap: 7px; font-size: 12.5px; min-width: 0; }
.us-planName { flex: 1; min-width: 0; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.us-planCalls { font-size: 11px; color: var(--us-faint); white-space: nowrap; }
.us-planVal { font-size: 12.5px; font-weight: 650; font-variant-numeric: tabular-nums; white-space: nowrap; }
.us-planTrack {
  height: 8px; border-radius: 999px; margin-top: 6px; overflow: hidden;
  background: var(--us-track);
  background-image: repeating-linear-gradient(135deg, rgba(0,0,0,.04) 0 3px, transparent 3px 6px);
}
.us-planBar { height: 100%; border-radius: 999px; transition: width .4s ease; }
.us-costBox {
  margin-top: auto; display: flex; align-items: center; gap: 10px;
  background: var(--us-green-soft); border: 1px solid rgba(22,163,74,.25);
  border-radius: 12px; padding: 12px;
}
.us-costIcon {
  width: 30px; height: 30px; border-radius: 50%; flex: none;
  background: var(--us-green); color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
}
.us-costText { flex: 1; min-width: 0; }
.us-costText b { display: block; font-size: 13px; font-weight: 650; }
.us-costText small { font-size: 10.5px; color: var(--us-sub); }
.us-costChevron { color: var(--us-green); font-size: 18px; font-weight: 600; }

/* detail table */
.us-tableTools { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.us-tabs {
  display: inline-flex; align-items: center; gap: 3px; flex-wrap: wrap;
  background: var(--us-track); padding: 3px; border-radius: 10px;
}
.us-tab {
  border: none; background: transparent; padding: 6px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 600; color: var(--us-sub); cursor: pointer;
  transition: background .12s ease, color .12s ease; white-space: nowrap;
}
.us-tab:hover { color: var(--us-fg); }
.us-tabOn { background: var(--us-card); color: var(--us-fg); box-shadow: var(--us-shadow); }
.us-search {
  display: inline-flex; align-items: center; gap: 6px;
  border: 1px solid var(--us-border); border-radius: 10px;
  padding: 6px 10px; background: var(--us-card); color: var(--us-faint);
  transition: border-color .15s ease;
}
.us-search:focus-within { border-color: var(--us-faint); }
.us-search input {
  border: none; outline: none; background: transparent;
  font-size: 12.5px; color: var(--us-fg); width: 140px;
}
.us-search input::placeholder { color: var(--us-faint); }
.us-tableWrap { overflow-x: auto; margin-top: 14px; }
.us-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.us-table th {
  text-align: left; font-size: 11px; font-weight: 600; color: var(--us-faint);
  padding: 8px 10px; border-bottom: 1px solid var(--us-border); white-space: nowrap;
}
.us-table td { padding: 10px; border-bottom: 1px solid var(--us-border); white-space: nowrap; font-variant-numeric: tabular-nums; }
.us-table tbody tr:last-child td { border-bottom: none; }
.us-table tbody tr { transition: background .12s ease; }
.us-table tbody tr:hover { background: var(--us-hover); }
.us-table .us-num { text-align: right; }
.us-tdModel { display: inline-flex; align-items: center; gap: 8px; font-weight: 600; }
.us-dim { color: var(--us-sub); }
.us-strong { font-weight: 650; color: var(--us-fg); }
.us-sharePill {
  display: inline-block; background: var(--us-track); color: var(--us-sub);
  border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 600;
}
.us-tableEmpty { padding: 36px 16px; text-align: center; color: var(--us-faint); font-size: 12.5px; }

/* logos */
.us-modelLogo {
  border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; flex-shrink: 0; text-transform: uppercase;
}
.us-modelLogoSvg { background: transparent !important; overflow: hidden; }
.us-modelLogoSvg svg { width: 1em; height: 1em; display: block; }

/* dropdown */
.us-dropdown { position: relative; }
.us-dropBtn {
  display: inline-flex; align-items: center; gap: 6px;
  background: var(--us-card); border: 1px solid var(--us-border); border-radius: 10px;
  padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer;
  color: var(--us-fg); transition: border-color .15s ease, background .15s ease;
}
.us-dropBtn:hover { border-color: var(--us-faint); background: var(--us-hover); }
.us-dropBtn.us-open { border-color: var(--us-faint); }
.us-dropChevron { font-size: 10px; color: var(--us-faint); transition: transform .15s ease; }
.us-dropBtn.us-open .us-dropChevron { transform: rotate(180deg); }
.us-rangeMenu {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 100;
  background: var(--us-card); border: 1px solid var(--us-border);
  border-radius: 12px; box-shadow: var(--us-shadow-lg);
  padding: 6px; min-width: 170px; animation: us-fadeIn .15s ease;
}
.us-chip {
  display: block; width: 100%; border: none; background: transparent;
  padding: 8px 12px; border-radius: 8px; text-align: left; cursor: pointer;
  font-size: 12.5px; color: var(--us-fg); transition: background .12s ease;
}
.us-chip:hover { background: var(--us-hover); }
.us-chipOn { background: var(--us-track); font-weight: 650; }

/* tooltip / empty / loading */
.us-tooltip {
  position: fixed; z-index: 1000; pointer-events: none;
  background: var(--us-fg); color: var(--us-card);
  padding: 8px 11px; border-radius: 10px; font-size: 11.5px;
  box-shadow: var(--us-shadow-lg); white-space: nowrap;
  animation: us-fadeIn .12s ease; font-variant-numeric: tabular-nums;
}
.us-tipTitle { font-weight: 650; margin-bottom: 3px; }
.us-empty { padding: 64px 32px; text-align: center; color: var(--us-sub); }
.us-emptyIcon { color: var(--us-amber); margin-bottom: 10px; display: flex; justify-content: center; }
.us-emptyTitle { font-size: 15px; font-weight: 650; color: var(--us-fg); margin-bottom: 6px; }
.us-errSub { font-size: 12px; color: var(--us-faint); }
.us-loading {
  width: 28px; height: 28px; border: 3px solid var(--us-tick);
  border-top-color: var(--us-orange); border-radius: 50%;
  animation: us-spin .8s linear infinite; margin: 0 auto 14px;
}

/* dark theme */
body[data-ds-dark-theme] .us-root {
  --us-bg: #131519;
  --us-card: #1c1f25;
  --us-border: #2a2e36;
  --us-fg: #e6e8ec;
  --us-sub: #9aa1ad;
  --us-faint: #6f7683;
  --us-track: #262a32;
  --us-tick: #343a44;
  --us-hover: #22262e;
  --us-green-soft: rgba(22,163,74,.14);
  --us-heat0: #242836;
  --us-heat1: #3a2f6b;
  --us-heat2: #5b3fa8;
  --us-heat3: #7c5cf0;
  --us-heat4: #a78bfa;
  --us-shadow: 0 1px 2px rgba(0,0,0,.3), 0 1px 3px rgba(0,0,0,.25);
  --us-shadow-lg: 0 8px 24px rgba(0,0,0,.45), 0 2px 6px rgba(0,0,0,.35);
}
body[data-ds-dark-theme] .us-root .us-planTrack {
  background-image: repeating-linear-gradient(135deg, rgba(255,255,255,.05) 0 3px, transparent 3px 6px);
}
body[data-ds-dark-theme] .us-root .us-barCurrent .us-seg {
  background-image: repeating-linear-gradient(135deg, rgba(255,255,255,.35) 0 3px, transparent 3px 7px);
}
body[data-ds-dark-theme] .us-root .us-kpi-amber .us-kpiIcon { color: var(--us-amber); }
body[data-ds-dark-theme] .us-root .us-switchThumb { background: #e6e8ec; }

/* year activity heatmap */
.us-heatMeta { text-align: right; }
.us-heatTotal { font-size: 18px; font-weight: 700; color: var(--us-heat4); letter-spacing: -.01em; font-variant-numeric: tabular-nums; }
.us-heatMetaSub { font-size: 11px; color: var(--us-sub); margin-top: 2px; }
.us-heatScroll { overflow-x: auto; margin-top: 14px; padding-bottom: 6px; scrollbar-width: thin; scrollbar-color: var(--us-heat2) transparent; }
.us-heatScroll::-webkit-scrollbar { height: 8px; }
.us-heatScroll::-webkit-scrollbar-thumb { background: var(--us-heat2); border: 2px solid var(--us-card); }
.us-heatScroll::-webkit-scrollbar-thumb:hover { background: var(--us-heat3); }
.us-heat { display: grid; grid-template-columns: 26px repeat(53, minmax(0, 1fr)); grid-template-rows: 16px repeat(7, auto); gap: 3px; min-width: 821px; max-width: 874px; margin-inline: auto; }
.us-heatMonth { grid-row: 1; font-size: 10px; line-height: 16px; color: var(--us-faint); white-space: nowrap; }
.us-heatDowLabel { grid-column: 1; align-self: center; font-size: 9px; line-height: 1; color: var(--us-faint); text-align: right; padding-right: 2px; }
.us-heatCell {
  width: 100%; aspect-ratio: 1; border-radius: 3px;
  background: var(--us-heat0);
  background: color-mix(in oklab, var(--us-heat4) calc(var(--ht, 0) * 100%), var(--us-heat0));
}
.us-heatFuture { opacity: .3; }
.us-heat .us-heatCell { transition: transform .12s ease, box-shadow .12s ease; }
.us-heat .us-heatCell:hover { transform: scale(1.25); box-shadow: 0 0 0 1px var(--us-heat4); position: relative; z-index: 2; }
.us-heatFoot { display: flex; align-items: center; gap: 4px; margin-top: 12px; }
.us-heatLegendBar {
  width: 72px; height: 10px; border-radius: 3px;
  background: linear-gradient(90deg, var(--us-heat0), var(--us-heat2), var(--us-heat4));
}
.us-heatLegendLabel { font-size: 11px; color: var(--us-faint); }
.us-heatHint { margin-left: auto; font-size: 11px; color: var(--us-faint); }
@media (max-width: 640px) {
  .us-heatHint { display: none; }
  .us-heatMeta { text-align: left; }
}

/* responsive */
@media (max-width: 1100px) {
  .us-midGrid { grid-template-columns: 1fr; }
  .us-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .us-root { padding: 14px; gap: 12px; }
  .us-titleRow { align-items: flex-start; flex-direction: column; }
  .us-chart { margin-left: 36px; height: 190px; }
  .us-gridLine span { left: -36px; width: 31px; }
  .us-chartX { margin-left: 36px; }
  .us-card { padding: 14px; }
  .us-search input { width: 100px; }
  .us-chartControls { gap: 8px; }
  .us-segBtn { padding: 5px 8px; font-size: 11px; }
  .us-legend { margin-left: 0; }
}
@media (max-width: 520px) {
  .us-kpis { grid-template-columns: 1fr; }
  .us-kpiValue { font-size: 22px; }
  .us-pageTools { width: 100%; justify-content: flex-start; }
  .us-chartControls .us-seg-ctrl { flex: 1; }
  .us-chartControls .us-segBtn { flex: 1; justify-content: center; }
  .us-legend { width: 100%; order: 3; }
  .us-stat { flex: 1 1 100%; }
}
`;


    module.exports.name = name;
    module.exports.inject = inject;
    module.exports.apply = apply;
    return module.exports;
  },
});
