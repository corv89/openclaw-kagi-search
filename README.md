# openclaw-kagi-search

An [OpenClaw](https://github.com/openclaw/openclaw) plugin that adds web search via the [Kagi Search API](https://help.kagi.com/kagi/api/search.html).

Returns **structured results** (title, URL, snippet, published date) — no AI synthesis. Complements OpenClaw's built-in Perplexity search, which returns synthesized answers.

## Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- A [Kagi Search API](https://kagi.com/settings?p=api) key (currently in private beta — [$25 per 1,000 queries](https://help.kagi.com/kagi/api/search.html))

## Install

```bash
openclaw plugins install openclaw-kagi-search
```

Or manually clone into your extensions directory:

```bash
git clone https://github.com/corv89/openclaw-kagi-search ~/.clawdbot/extensions/kagi-search
```

Then restart the gateway:

```bash
openclaw gateway restart
```

## Configuration

The plugin looks for your Kagi API key in three places (first match wins):

1. **Plugin config** — `plugins.entries.kagi-search.config.apiKey`
2. **Environment variable** — `KAGI_API_KEY`
3. **File** — `~/.config/kagi/api_key`

### Option 1: Plugin config

Add to your OpenClaw config:

```json5
{
  plugins: {
    entries: {
      "kagi-search": {
        enabled: true,
        config: {
          apiKey: "your-kagi-api-key",
          limit: 10  // optional, default: 5
        }
      }
    }
  }
}
```

### Option 2: Environment variable

```bash
export KAGI_API_KEY="your-kagi-api-key"
```

### Option 3: Key file

```bash
mkdir -p ~/.config/kagi
echo -n "your-kagi-api-key" > ~/.config/kagi/api_key
chmod 600 ~/.config/kagi/api_key
```

## Usage

Once installed, OpenClaw gains the `kagi_search` tool. The agent will use it automatically when appropriate, or you can ask directly:

> Search Kagi for "rust async runtime benchmarks"

### Tool parameters

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| `query`   | string | yes      | Search query                         |
| `limit`   | number | no       | Max results to return (1–20, default 5) |

### Example output

```
1. **Tokio vs async-std benchmarks**
   https://example.com/benchmarks
   A comprehensive comparison of Rust async runtimes...
   Published: 2026-01-15T00:00:00Z

2. **Understanding Rust's async ecosystem**
   https://example.com/async-rust
   Deep dive into how async/await works in Rust...

---
_Kagi Search · 2 results · 213ms · balance: $4.97_
```

## Kagi Search vs Perplexity (web_search)

| Feature | `kagi_search` | `web_search` (Perplexity) |
|---------|--------------|--------------------------|
| Output | Raw structured results | AI-synthesized answer |
| Links | Direct URLs per result | Citations in prose |
| Best for | Finding specific pages, research | Quick answers, summaries |
| Pricing | $0.025/query | Per-token via API |

Both tools coexist — OpenClaw picks the right one based on context.

## License

MIT
