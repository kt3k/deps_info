import type { Script } from "./types.ts";
import { ScriptSet, toUrlIfNotUrl } from "./script_set.ts";
import { gray } from "https://deno.land/std@0.100.0/fmt/colors.ts";
import { resolve, toFileUrl } from "https://deno.land/std@0.100.0/path/mod.ts";
import {
  parse,
  ParsedImportMap,
  resolve as resolveImportMap,
} from "https://esm.sh/@import-maps/resolve@1.0.1";

export type { Script };
export { ScriptSet, toUrlIfNotUrl };

const CACHE_ROOT = "./.deps_info_cache";

export async function getDeps(
  urlOrPath: string,
  cacheRoot = CACHE_ROOT,
  importMapPath?: string,
): Promise<ScriptSet> {
  const parsedImportMap = importMapPath
    ? parse(
      JSON.parse(await Deno.readTextFile(importMapPath)),
      toFileUrl(resolve(importMapPath)),
    )
    : undefined;
  const scriptSet = new ScriptSet([], cacheRoot, parsedImportMap);
  await scriptSet.loadDeps(urlOrPath);
  return scriptSet;
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
  parsedImportMap?: ParsedImportMap,
  prefix?: string,
  isLast = true,
  printed: Set<string> = new Set([]),
) {
  const script = scriptSet.get(url)!;
  const imports = script.imports;
  const redirectedUrl = script.redirectedUrl;
  const baseURL = new URL(redirectedUrl);
  const noDeps = imports.length === 0;
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
  let len = imports.length;
  for (const u of imports) {
    let url: string;
    if (parsedImportMap) {
      url = resolveImportMap(u, parsedImportMap, baseURL).resolvedImport.href;
    } else {
      url = new URL(u, redirectedUrl).href;
    }
    len--;
    printDependencyGraph(
      url,
      scriptSet,
      parsedImportMap,
      prefix === undefined
        ? ""
        : prefix + (isLast ? EMPTY_CONNECTOR : VERTICAL_CONNECTOR) + " ",
      len === 0,
      printed,
    );
  }
}
