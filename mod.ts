import type { Script } from "./types.ts";
import { ScriptCache } from "./script_cache.ts";
import { ScriptSet } from "./script_set.ts";
import { getScript } from "./get_script.ts";
import { pooledMap } from "https://deno.land/std@0.100.0/async/pool.ts";
import { gray } from "https://deno.land/std@0.100.0/fmt/colors.ts";
import {
  resolve,
  toFileUrl,
} from "https://deno.land/std@0.100.0/path/mod.ts";

export type { Script };
export { ScriptSet };

const CACHE_ROOT = "./.deps_info_cache";

export async function getDependencies(
  scriptSet: ScriptSet,
  url: string,
  cache: ScriptCache,
): Promise<void> {
  let urls = [url];
  await cache.ensureCacheDir();
  while (urls.length > 0) {
    const nextUrls = [] as string[];
    urls = urls.filter((u) => !scriptSet.has(u));
    const result = pooledMap(12, urls, async (url: string) => {
      const script = await getScript(url, cache);
      scriptSet.add(script);
      return script;
    });
    for await (const script of result) {
      nextUrls.push(...script.dependencyUrls);
    }
    urls = nextUrls;
  }
}

export async function getDependencyScriptSet(
  url: string,
  cacheRoot = CACHE_ROOT,
): Promise<ScriptSet> {
  const scriptSet = new ScriptSet();
  const cache = new ScriptCache(cacheRoot);
  await cache.ensureCacheDir();
  await getDependencies(scriptSet, url, cache);
  return scriptSet;
}

export function toUrlIfNotUrl(param: string): string {
  const isUrl = param.startsWith("https://") || param.startsWith("http://") ||
    param.startsWith("file://");
  return isUrl ? param : toFileUrl(resolve(param)).href;
}

export async function getDeps(
  urlOrPath: string,
  cacheRoot = CACHE_ROOT,
): Promise<Script[]> {
  const url = toUrlIfNotUrl(urlOrPath);
  const scriptSet = await getDependencyScriptSet(url, cacheRoot);
  return scriptSet.scripts;
}

const SIBLING_CONNECTOR = "├";
const LAST_SIBLING_CONNECTOR = "└";
const CHILD_DEPS_CONNECTOR = "┬";
const CHILD_NO_DEPS_CONNECTOR = "─";
const VERTICAL_CONNECTOR = "│";
const EMPTY_CONNECTOR = " ";

/**
 * Prints the dependency graph recursively.
 *
 * @param url The url to start
 * @param scriptSet The script set which must contain all dependencies of the url
 * @param prefix to add before printing each line. undefined means that's the root of the tree.
 * @param isLast true when the item is the last among siblings
 * @param printed The items already printed
 */
export function printDependencyGraph(
  url: string,
  scriptSet: ScriptSet,
  prefix?: string,
  isLast = true,
  printed: Set<string> = new Set([]),
) {
  const dependencyUrls = scriptSet.get(url)!.dependencyUrls;
  const noDeps = dependencyUrls.length === 0;
  const seen = printed.has(url);
  const childConnector = (noDeps || seen)
    ? CHILD_NO_DEPS_CONNECTOR
    : CHILD_DEPS_CONNECTOR;
  const siblingConnector =
    (isLast ? LAST_SIBLING_CONNECTOR : SIBLING_CONNECTOR);
  const prepend = prefix === undefined
    ? ""
    : gray(prefix + siblingConnector + "─" + childConnector + " ");
  if (seen) {
    console.log(prepend + gray(url));
    return;
  }
  console.log(prepend + url);
  printed.add(url);
  let len = dependencyUrls.length;
  for (const u of dependencyUrls) {
    len--;
    printDependencyGraph(
      u,
      scriptSet,
      prefix === undefined
        ? ""
        : prefix + (isLast ? EMPTY_CONNECTOR : VERTICAL_CONNECTOR) + " ",
      len === 0,
      printed,
    );
  }
}
