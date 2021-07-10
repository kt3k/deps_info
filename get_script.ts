import { transform } from "https://esm.sh/sucrase";
import { init, parse } from "https://unpkg.com/es-module-lexer/dist/lexer.js";
import type { Script } from "./types.ts";
import { ScriptCache } from "./script_cache.ts";
import { green } from "https://deno.land/std@0.100.0/fmt/colors.ts";
import { fromFileUrl } from "https://deno.land/std@0.100.0/path/mod.ts";
import {
  isCss,
  isJavaScript,
  isJsx,
  isTsx,
  isTypeScript,
} from "./file_type_util.ts";

export type { Script };

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

/**
 * Gets the script from the original source without using any cache.
 */
export async function getScript(
  url: string,
  cache: ScriptCache,
): Promise<Script> {
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