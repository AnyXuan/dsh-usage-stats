# dsh-usage-stats

DeepSeek Harness (DSH) usage statistics plugin. It records token usage from the
`llm/stream` waterfall and provides a web dashboard for requests, token totals,
estimated cost, cache activity, provider/model breakdowns, trend charts, and a
year activity heatmap.

## Features

- Token, request, and estimated-cost summaries
- Daily and monthly bar/line trends
- Provider and model breakdowns
- Cache-read and cache-write statistics
- Full-year activity heatmap
- Date-range filtering and CSV export
- Chinese and English locale metadata

## Requirements

- Node.js `^22.19.0` or `>=24.0.0`
- DSH `>=0.2.0-rc.2`

## Development

```bash
npm install
npm test
npm run build
```

`client.src.jsx` is the browser-side source. `npm run build` produces
`client.js` in the DSH module-loader format. The host-side collector and API
endpoint are implemented in `index.js`.

## License

MIT

