import { Script } from "./types.ts";
import { ScriptCache } from "./script_cache.ts";
import { getScript } from "./get_script.ts";
import { pooledMap } from "https://deno.land/std@0.100.0/async/pool.ts";
import { resolve, toFileUrl } from "https://deno.land/std@0.100.0/path/mod.ts";
import {
  ParsedImportMap,
  resolve as resolveImportMap,
} from "https://esm.sh/@import-maps/resolve@1.0.1";

/** ScriptSet represents the set of the scripts.
 * This class provides loadDeps method which downloads all the dependency scripts
 * of the given url, caches them in the disk, and stores them in this class. */
export class ScriptSet {
  #scripts: Script[];
  #map: Map<string, Script>;
  #cache: ScriptCache;
  #parsedImportMap?: ParsedImportMap;
  constructor(
    scripts?: Script[],
    cacheRoot = "./.deps_info_cache",
    parsedImportMap?: ParsedImportMap,
  ) {
    this.#scripts = [];
    this.#map = new Map();
    this.#cache = new ScriptCache(cacheRoot);
    this.#parsedImportMap = parsedImportMap;
    if (scripts) {
      for (const s of scripts) {
        this.add(s);
      }
    }
  }

  /** Adds a script to the script set. */
  add(script: Script) {
    if (this.has(script.url)) {
      return;
    }
    this.#scripts.push(script);
    this.#map.set(script.url, script);
  }

  /** Returns true iff the script set has an entry for the url. */
  has(url: string): boolean {
    return this.#map.has(url);
  }

  get(url: string): Script | undefined {
    return this.#map.get(url);
  }

  /** Returns the number of scripts included in the script set. */
  get length() {
    return this.#scripts.length;
  }

  /** Returns the list of all stored scripts. */
  get scripts(): Script[] {
    return this.#scripts;
  }

  /** Loads the script of the given url and all its dependency scripts
   * recursively. */
  async loadDeps(
    url: string,
  ): Promise<void> {
    url = toUrlIfNotUrl(url);
    let urls = [url];
    await this.#cache.ensureCacheDir();
    while (urls.length > 0) {
      const nextUrls = [] as string[];
      urls = urls.filter((u) => !this.has(u));
      const result = pooledMap(12, urls, async (url: string) => {
        const script = await getScript(url, this.#cache);
        this.add(script);
        return script;
      });
      for await (const script of result) {
        const pim = this.#parsedImportMap;
        if (pim) {
          nextUrls.push(
            ...script.imports.map((i) =>
              resolveImportMap(i, pim, new URL(script.redirectedUrl))
                .resolvedImport.href
            ),
          );
        } else {
          nextUrls.push(
            ...script.imports.map((i) => new URL(i, script.redirectedUrl).href),
          );
        }
      }
      urls = nextUrls;
    }
  }
}

/** Transforms the given path to the url if it's not url, otherwise does nothing. */
export function toUrlIfNotUrl(param: string): string {
  const isUrl = param.startsWith("https://") || param.startsWith("http://") ||
    param.startsWith("file://");
  return isUrl ? param : toFileUrl(resolve(param)).href;
}
