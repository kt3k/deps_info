import { transform } from "https://esm.sh/sucrase";
import { init, parse } from "https://unpkg.com/es-module-lexer/dist/lexer.js";
import type { Script } from "./types.ts";
import { ScriptCache } from "./script_cache.ts";
import { ScriptSet } from "./script_set.ts";
import { pooledMap } from "https://deno.land/std@0.100.0/async/pool.ts";

const CACHE_ROOT = "./.deps_info_cache";

async function getImportsInSource(source: string) {
  await init;
  const { code } = transform(source, { transforms: ["typescript", "jsx"] });
  const [imports, _exports] = parse(code);
  return imports;
}

async function getDependencyUrlsFromScript(
  { redirectedUrl, source }: Script,
): Promise<string[]> {
  // deno-lint-ignore no-explicit-any
  return (await getImportsInSource(source)).map((x: any) =>
    new URL(x.n, redirectedUrl).href
  );
}

async function getLocalScript(url: string): Promise<Script> {
  return {
    url,
    redirectedUrl: url,
    contentType: "text/javascript", // TODO(kt3k): guess this from extension
    source: await Deno.readTextFile(url),
  };
}
async function getRemoteScript(url: string): Promise<Script> {
  console.log("Downloading", url);
  const resp = await fetch(url);
  const source = await resp.text();
  return {
    url,
    redirectedUrl: resp.url,
    contentType: resp.headers.get("content-type") ?? "unknown",
    source,
  };
}

async function getScript(url: string, cache: ScriptCache): Promise<Script> {
  if (url.startsWith("file://")) {
    return getLocalScript(url);
  }

  if (url.startsWith("https://") || url.startsWith("http://")) {
    let script = await cache.get(url);
    if (script) {
      return script;
    }
    script = await getRemoteScript(url);
    await cache.set(script);
    return script;
  }
  throw new Error(`Unsupported scheme: ${url}`);
}

export async function getDependencyScriptSet(url: string): Promise<ScriptSet> {
  let urls = [url];
  const scriptSet = new ScriptSet();
  const cache = new ScriptCache(CACHE_ROOT);
  await cache.ensureCacheDir();
  while (urls.length > 0) {
    const nextUrls = [] as string[];
    urls = urls.filter((u) => !scriptSet.has(u));
    const result = pooledMap(20, urls, async (url: string) => {
      const script = await getScript(url, cache);
      scriptSet.add(script);
      return await getDependencyUrlsFromScript(script);
    });
    for await (const depUrls of result) {
      nextUrls.push(...depUrls);
    }
    urls = nextUrls;
  }
  return scriptSet;
}
