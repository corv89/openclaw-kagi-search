import type { ClawdbotPluginApi } from "clawdbot/plugin-sdk";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

interface KagiResult {
  t: number; // 0 = organic, 1 = related
  url?: string;
  title?: string;
  snippet?: string;
  published?: string;
  thumbnail?: { url?: string; width?: number; height?: number };
}

interface KagiResponse {
  meta: {
    id: string;
    node: string;
    ms: number;
    api_balance: number;
  };
  data: KagiResult[];
  error?: Array<{ code: number; msg: string }>;
}

function loadApiKey(pluginConfig: Record<string, unknown>): string | null {
  // Plugin config takes priority
  if (pluginConfig?.apiKey && typeof pluginConfig.apiKey === "string") {
    return pluginConfig.apiKey;
  }
  // Environment variable
  if (process.env.KAGI_API_KEY) {
    return process.env.KAGI_API_KEY;
  }
  // Fall back to file
  try {
    return readFileSync(
      join(homedir(), ".config", "kagi", "api_key"),
      "utf-8",
    ).trim();
  } catch {
    return null;
  }
}

const kagiSearchPlugin = {
  id: "kagi-search",
  name: "Kagi Search",
  description:
    "Search the web using Kagi — structured results, no AI synthesis",

  register(api: ClawdbotPluginApi) {
    api.registerTool({
      name: "kagi_search",
      description:
        "Search the web using Kagi Search API. Returns structured results (title, URL, snippet, published date) without AI synthesis. Useful when you need raw search results with direct links rather than a synthesized answer.",
      parameters: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query string",
          },
          limit: {
            type: "number",
            description: "Maximum results to return (1-20, default 5)",
          },
        },
        required: ["query"],
      },

      async execute(
        _id: string,
        params: { query: string; limit?: number },
      ) {
        const config =
          api.config?.plugins?.entries?.["kagi-search"]?.config ?? {};
        const apiKey = loadApiKey(config as Record<string, unknown>);

        if (!apiKey) {
          return {
            content: [
              {
                type: "text" as const,
                text: "Error: No Kagi API key found. Provide it via plugin config, KAGI_API_KEY env var, or ~/.config/kagi/api_key file.",
              },
            ],
          };
        }

        const defaultLimit =
          (config as Record<string, unknown>)?.limit ?? 5;
        const limit = params.limit ?? defaultLimit;
        const url = new URL("https://kagi.com/api/v0/search");
        url.searchParams.set("q", params.query);
        url.searchParams.set(
          "limit",
          String(Math.min(Math.max(Number(limit), 1), 20)),
        );

        try {
          const response = await fetch(url.toString(), {
            headers: {
              Authorization: `Bot ${apiKey}`,
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            const body = await response.text().catch(() => "");
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Kagi API error ${response.status}: ${body || response.statusText}`,
                },
              ],
            };
          }

          const json = (await response.json()) as KagiResponse;

          if (json.error?.length) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Kagi API error: ${json.error.map((e) => e.msg).join("; ")}`,
                },
              ],
            };
          }

          // Filter to organic results only (t=0)
          const organic = json.data.filter((r) => r.t === 0 && r.url);

          if (organic.length === 0) {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `No results found for "${params.query}"`,
                },
              ],
            };
          }

          const formatted = organic
            .map((r, i) => {
              let entry = `${i + 1}. **${r.title ?? "Untitled"}**\n   ${r.url}`;
              if (r.snippet) entry += `\n   ${r.snippet}`;
              if (r.published) entry += `\n   Published: ${r.published}`;
              return entry;
            })
            .join("\n\n");

          const footer = `\n\n---\n_Kagi Search · ${organic.length} results · ${json.meta.ms}ms · balance: $${json.meta.api_balance.toFixed(2)}_`;

          return {
            content: [
              {
                type: "text" as const,
                text: formatted + footer,
              },
            ],
          };
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          return {
            content: [
              {
                type: "text" as const,
                text: `Kagi search failed: ${msg}`,
              },
            ],
          };
        }
      },
    });
  },
};

export default kagiSearchPlugin;
