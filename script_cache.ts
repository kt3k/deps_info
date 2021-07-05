import { createHash } from "https://deno.land/std@0.100.0/hash/mod.ts";
import { join } from "https://deno.land/std@0.100.0/path/mod.ts";
import { Script } from "./types.ts";

const HASH_ALGORITHM = "sha256";

export class ScriptCache {
  #root: string;
  constructor(cacheRoot: string) {
    this.#root = cacheRoot;
  }

  #path(url: string) {
    const hash = createHash(HASH_ALGORITHM);
    hash.update(url);
    const key = hash.toString();
    return join(this.#root, key);
  }

  async get(url: string): Promise<Script | null> {
    let json: string
    try {
      json = await Deno.readTextFile(this.#path(url))
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
	// Cache missed
	return null;
      }
      throw e;
    }
    // Cache hit
    return JSON.parse(json) as Script;
  }

  async set(script: Script) {
    await Deno.writeTextFile(this.#path(script.url), JSON.stringify(script));
  }
}
