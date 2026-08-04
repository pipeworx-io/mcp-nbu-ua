# mcp-nbu-ua

National Bank of Ukraine (NBU) public statistics MCP. Keyless.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Nbu Ua data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
