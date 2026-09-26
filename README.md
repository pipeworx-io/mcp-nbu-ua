# mcp-nbu-ua

National Bank of Ukraine (NBU) public statistics MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1683+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `nbu_exchange_rates` | Official NBU exchange rates for ALL currencies on a single day (the rate the National Bank of Ukraine sets daily). Returns one record per currency: {r030 (numeric currency code), txt (Ukrainian name), rate (UAH per 1 unit of the currency), cc (ISO-4217 code, e.g. USD/EUR/PLN), exchangedate (DD.MM.YYYY)}. Omit `date` for today's rates. |
| `nbu_currency_rate` | Official NBU rate for a SINGLE currency on one day. Pass `valcode` as an ISO-4217 code (e.g. USD, EUR, GBP). `rate` is UAH per 1 unit of that currency. Omit `date` for today. For a time series of one currency across a date range, use `nbu_currency_history` instead. |
| `nbu_currency_history` | Daily time series of the official NBU rate for ONE currency over a date range. Pass `valcode` (ISO-4217, e.g. USD) and `start`/`end` as YYYYMMDD. Returns one record per business day: {exchangedate (DD.MM.YYYY), cc, txt (Ukrainian name), enname (English name), rate (UAH per `units`), units, rate_per_unit}. Omit `valcode` to get every currency over the range. Newest first. |
| `nbu_monetary_aggregates` | NBU monetary aggregates (M0, M1, M2, M3 money supply, in UAH million) for a given month. Each record: {dt (YYYYMMDD), txt (Ukrainian name), txten (English name), id_api (e.g. M2/M3), value, freq}. `date` selects the reference month (any day in it); omit for the latest available month. |
| `nbu_international_reserves` | NBU official international (reserve) assets for a given month, broken down by component. Each record: {dt (YYYYMMDD), txt (Ukrainian name), txten (English name), id_api, value, freq}. `date` selects the reference month; omit for the latest available month. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "nbu-ua": {
      "url": "https://gateway.pipeworx.io/nbu-ua/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/nbu-ua/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1683+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/nbu_exchange_rates \
  -H 'Content-Type: application/json' \
  -d '{"date":"20240115"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/nbu_exchange_rates`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Standalone (no gateway account)

This package also runs as a local stdio MCP server — no Pipeworx account, no
gateway round-trip:

```json
{
  "mcpServers": {
    "nbu-ua": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-nbu-ua"]
    }
  }
}
```

Or run it directly to confirm it starts:

```bash
npx -y @pipeworx/mcp-nbu-ua
```

It speaks MCP over stdin/stdout and answers `initialize`/`tools/list`/`tools/call`
for **only** this pack's tools — none of the shared meta-tools the gateway
connection above adds. Same source, same tools, no ask_pipeworx routing.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Nbu Ua data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
