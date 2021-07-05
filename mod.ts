import { transform } from "https://esm.sh/sucrase";
import { init, parse } from "https://unpkg.com/es-module-lexer/dist/lexer.js";
import type { Script } from "./types.ts";
import { ScriptCache } from "./script_cache.ts";
import { ScriptSet } from "./script_set.ts";
import { pooledMap } from "https://deno.land/std@0.100.0/async/pool.ts";
import { gray, green } from "https://deno.land/std@0.100.0/fmt/colors.ts";
import { fromFileUrl } from "https://deno.land/std@0.100.0/path/mod.ts";
import {
  isCss,
  isJavaScript,
  isJsx,
  isTsx,
  isTypeScript,
} from "./file_type_util.ts";

export type { Script };

const CACHE_ROOT = "./.deps_info_cache";

function unique<T>(arr: Array<T>): Array<T> {
  const res = new Set<T>(arr);
  return Array.from(res);
}

async function getDependencyUrls(
  redirectedUrl: string,
  source: string,
): Promise<string[]> {
  await init;
  const [imports, _exports] = parse(source);
  // deno-lint-ignore no-explicit-any
  return unique(imports.map((x: any) => new URL(x.n, redirectedUrl).href));
}

function getDependencyUrlsFromJsx(
  redirectedUrl: string,
  source: string,
): Promise<string[]> {
  return getDependencyUrls(
    redirectedUrl,
    transform(source, { transforms: ["jsx"] }).code,
  );
}

function getDependencyUrlsFromTsx(
  redirectedUrl: string,
  source: string,
): Promise<string[]> {
  return getDependencyUrls(
    redirectedUrl,
    transform(source, { transforms: ["typescript", "jsx"] }).code,
  );
}

async function getLocalScript(url: string): Promise<Script> {
  const source = await Deno.readTextFile(fromFileUrl(url));
  let dependencyUrls: string[] = [];
  let contentType = "text/plain";
  if (isJavaScript(null, url)) {
    contentType = "text/javascript";
    dependencyUrls = await getDependencyUrls(url, source);
  } else if (isTypeScript(null, url)) {
    contentType = "application/typescript";
    dependencyUrls = await getDependencyUrls(url, source);
  } else if (isJsx(null, url)) {
    contentType = "text/jsx";
    dependencyUrls = await getDependencyUrlsFromJsx(url, source);
  } else if (isTsx(null, url)) {
    contentType = "text/tsx";
    dependencyUrls = await getDependencyUrlsFromTsx(url, source);
  } else if (isCss(null, url)) {
    contentType = "text/css";
  }
  return {
    url,
    redirectedUrl: url,
    contentType,
    source,
    dependencyUrls,
  };
}

async function getRemoteScript(url: string): Promise<Script> {
  console.error(green("Download"), url);
  const resp = await fetch(url);
  const redirectedUrl = resp.url;
  const contentType = resp.headers.get("content-type") ?? "unknown";
  const source = await resp.text();
  let dependencyUrls = [] as string[];
  if (isJavaScript(contentType, url)) {
    dependencyUrls = await getDependencyUrls(redirectedUrl, source);
  } else if (isTypeScript(contentType, url)) {
    dependencyUrls = await getDependencyUrls(redirectedUrl, source);
  } else if (isTsx(contentType, url)) {
    dependencyUrls = await getDependencyUrlsFromTsx(redirectedUrl, source);
  } else if (isJsx(contentType, url)) {
    dependencyUrls = await getDependencyUrlsFromJsx(redirectedUrl, source);
  } else if (isCss(contentType, url)) {
    dependencyUrls = [];
  }
  return {
    url,
    redirectedUrl: resp.url,
    contentType,
    source,
    dependencyUrls,
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

export async function getDependencyScriptSet(
  url: string,
  cacheRoot = CACHE_ROOT,
): Promise<ScriptSet> {
  let urls = [url];
  const scriptSet = new ScriptSet();
  const cache = new ScriptCache(cacheRoot);
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
  return scriptSet;
}

export async function getDeps(url: string, cacheRoot = CACHE_ROOT): Promise<Script[]> {
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
