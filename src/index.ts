interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * National Bank of Ukraine (NBU) public statistics MCP. Keyless.
 *
 * Conventions across all tools:
 *  - `cc` is the ISO-4217 currency code (e.g. USD, EUR, PLN).
 *  - `rate` is UAH (Ukrainian hryvnia) per one unit of the currency.
 *  - `date` arguments are YYYYMMDD (e.g. "20240115"). Omit for the latest available day.
 *  - `txt` fields are Ukrainian-language names; FX endpoints also return `enname` (English).
 */


const STAT = 'https://bank.gov.ua/NBUStatService/v1/statdirectory';
const FX_SITE = 'https://bank.gov.ua/NBU_Exchange/exchange_site';
const UA = 'pipeworx-mcp-nbu-ua/1.0 (+https://pipeworx.io)';
const DATE_RE = /^\d{8}$/;

const tools: McpToolExport['tools'] = [
  {
    name: 'exchange_rates',
    description:
      "Official NBU exchange rates for ALL currencies on a single day (the rate the National Bank of Ukraine sets daily). Returns one record per currency: {r030 (numeric currency code), txt (Ukrainian name), rate (UAH per 1 unit of the currency), cc (ISO-4217 code, e.g. USD/EUR/PLN), exchangedate (DD.MM.YYYY)}. Omit `date` for today's rates.",
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Day to fetch, format YYYYMMDD, e.g. "20240115". Omit for the latest/today.' },
      },
    },
  },
  {
    name: 'currency_rate',
    description:
      "Official NBU rate for a SINGLE currency on one day. Pass `valcode` as an ISO-4217 code (e.g. USD, EUR, GBP). `rate` is UAH per 1 unit of that currency. Omit `date` for today. For a time series of one currency across a date range, use `currency_history` instead.",
    inputSchema: {
      type: 'object',
      properties: {
        valcode: { type: 'string', description: 'ISO-4217 currency code, e.g. "USD", "EUR", "PLN".' },
        date: { type: 'string', description: 'Day to fetch, format YYYYMMDD, e.g. "20240115". Omit for the latest/today.' },
      },
      required: ['valcode'],
    },
  },
  {
    name: 'currency_history',
    description:
      "Daily time series of the official NBU rate for ONE currency over a date range. Pass `valcode` (ISO-4217, e.g. USD) and `start`/`end` as YYYYMMDD. Returns one record per business day: {exchangedate (DD.MM.YYYY), cc, txt (Ukrainian name), enname (English name), rate (UAH per `units`), units, rate_per_unit}. Omit `valcode` to get every currency over the range. Newest first.",
    inputSchema: {
      type: 'object',
      properties: {
        valcode: { type: 'string', description: 'ISO-4217 currency code, e.g. "USD". Omit to return all currencies.' },
        start: { type: 'string', description: 'Range start, YYYYMMDD, e.g. "20240101".' },
        end: { type: 'string', description: 'Range end, YYYYMMDD, e.g. "20240131".' },
      },
      required: ['start', 'end'],
    },
  },
  {
    name: 'monetary_aggregates',
    description:
      "NBU monetary aggregates (M0, M1, M2, M3 money supply, in UAH million) for a given month. Each record: {dt (YYYYMMDD), txt (Ukrainian name), txten (English name), id_api (e.g. M2/M3), value, freq}. `date` selects the reference month (any day in it); omit for the latest available month.",
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Reference day inside the month, YYYYMMDD, e.g. "20240101". Omit for latest.' },
      },
    },
  },
  {
    name: 'international_reserves',
    description:
      "NBU official international (reserve) assets for a given month, broken down by component. Each record: {dt (YYYYMMDD), txt (Ukrainian name), txten (English name), id_api, value, freq}. `date` selects the reference month; omit for the latest available month.",
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Reference day inside the month, YYYYMMDD, e.g. "20240101". Omit for latest.' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'exchange_rates':
      return nbuGet(`${STAT}/exchange${dayQuery(args)}`);
    case 'currency_rate': {
      const valcode = reqCode(args, 'valcode');
      const params = new URLSearchParams({ valcode });
      const date = optDate(args, 'date');
      if (date) params.set('date', date);
      params.set('json', '');
      return nbuGet(`${STAT}/exchange?${params.toString()}`);
    }
    case 'currency_history': {
      const start = reqDate(args, 'start');
      const end = reqDate(args, 'end');
      const params = new URLSearchParams({ start, end, sort: 'exchangedate', order: 'desc' });
      const valcode = optCode(args, 'valcode');
      if (valcode) params.set('valcode', valcode);
      params.set('json', '');
      return nbuGet(`${FX_SITE}?${params.toString()}`);
    }
    case 'monetary_aggregates':
      return nbuGet(`${STAT}/monetary${dayQuery(args)}`);
    case 'international_reserves':
      return nbuGet(`${STAT}/res${dayQuery(args)}`);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function nbuGet(url: string): Promise<unknown> {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`NBU: ${res.status} ${body.slice(0, 200)}`);
  }
  return res.json();
}

function dayQuery(args: Record<string, unknown>): string {
  const date = optDate(args, 'date');
  return date ? `?date=${date}&json` : '?json';
}

function optDate(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  if (v == null || (typeof v === 'string' && !v.trim())) return undefined;
  if (typeof v !== 'string' || !DATE_RE.test(v)) throw new Error(`Argument "${key}" must be a date in YYYYMMDD format, e.g. "20240115".`);
  return v;
}

function reqDate(args: Record<string, unknown>, key: string): string {
  const v = optDate(args, key);
  if (!v) throw new Error(`Required argument "${key}" is missing. Pass a date in YYYYMMDD format, e.g. "20240115".`);
  return v;
}

function optCode(args: Record<string, unknown>, key: string): string | undefined {
  const v = args[key];
  if (v == null || (typeof v === 'string' && !v.trim())) return undefined;
  if (typeof v !== 'string') throw new Error(`Argument "${key}" must be an ISO-4217 currency code, e.g. "USD".`);
  return v.trim().toUpperCase();
}

function reqCode(args: Record<string, unknown>, key: string): string {
  const v = optCode(args, key);
  if (!v) throw new Error(`Required argument "${key}" is missing. Pass an ISO-4217 currency code like "USD".`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
