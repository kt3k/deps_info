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

async function getImports(
  source: string,
): Promise<string[]> {
  await init;
  const [imports, _exports] = parse(source);
  // return unique(imports.map((x: any) => new URL(x.n, redirectedUrl).href));
  // deno-lint-ignore no-explicit-any
  return unique(imports.map((x: any) => x.n));
}

function getImportsFromJsx(
  source: string,
): Promise<string[]> {
  return getImports(
    transform(source, { transforms: ["jsx"] }).code,
  );
}

function getImportsFromTsx(
  source: string,
): Promise<string[]> {
  return getImports(
    transform(source, { transforms: ["typescript", "jsx"] }).code,
  );
}

async function getLocalScript(url: string): Promise<Script> {
  const source = await Deno.readTextFile(fromFileUrl(url));
  let imports: string[] = [];
  let contentType = "text/plain";
  if (isJavaScript(null, url)) {
    contentType = "text/javascript";
    imports = await getImports(source);
  } else if (isTypeScript(null, url)) {
    contentType = "application/typescript";
    imports = await getImports(source);
  } else if (isJsx(null, url)) {
    contentType = "text/jsx";
    imports = await getImportsFromJsx(source);
  } else if (isTsx(null, url)) {
    contentType = "text/tsx";
    imports = await getImportsFromTsx(source);
  } else if (isCss(null, url)) {
    contentType = "text/css";
  }
  return {
    url,
    redirectedUrl: url,
    contentType,
    source,
    imports,
  };
}

async function getRemoteScript(url: string): Promise<Script> {
  console.error(green("Download"), url);
  const resp = await fetch(url);
  const redirectedUrl = resp.url;
  const contentType = resp.headers.get("content-type") ?? "unknown";
  const source = await resp.text();
  let imports = [] as string[];
  if (isJavaScript(contentType, url)) {
    imports = await getImports(source);
  } else if (isTypeScript(contentType, url)) {
    imports = await getImports(source);
  } else if (isTsx(contentType, url)) {
    imports = await getImportsFromTsx(source);
  } else if (isJsx(contentType, url)) {
    imports = await getImportsFromJsx(source);
  } else if (isCss(contentType, url)) {
    imports = [];
  }
  return {
    url,
    redirectedUrl: resp.url,
    contentType,
    source,
    imports,
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
