import { Script } from "./types.ts";

export class ScriptSet {
  #scripts: Script[];
  #urls: Set<string>;
  constructor(scripts?: Script[]) {
    this.#scripts = [];
    this.#urls = new Set();
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
    this.#urls.add(script.url);
  }

  has(url: string): boolean {
    return this.#urls.has(url);
  }

  get length() {
    return this.#scripts.length;
  }

  get scripts() {
    return this.#scripts;
  }
}
