import { Script } from "./types.ts";

export class ScriptSet {
  #scripts: Script[];
  #map: Map<string, Script>;
  constructor(scripts?: Script[]) {
    this.#scripts = [];
    this.#map = new Map();
    if (scripts) {
      for (const s of scripts) {
        this.add(s);
      }
    }
  }

  add(script: Script) {
    if (this.has(script.url)) {
      return;
    }
    this.#scripts.push(script);
    this.#map.set(script.url, script);
  }

  has(url: string): boolean {
    return this.#map.has(url);
  }

  get(url: string): Script | undefined {
    return this.#map.get(url);
  }

  get length() {
    return this.#scripts.length;
  }

  get scripts() {
    return this.#scripts;
  }
}
