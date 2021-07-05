import { ScriptCache } from "./script_cache.ts";
import { assertEquals } from "https://deno.land/std@0.100.0/testing/asserts.ts";

Deno.test("ScriptCache", async () => {
  const tmpdir = await Deno.makeTempDir();
  const cache = new ScriptCache(tmpdir);
  await cache.set({
    url: "https://example.com/foo.js",
    redirectedUrl: "https://example.com/script/foo.js",
    contentType: "text/javsacript",
    source: "console.log('foo');",
    dependencyUrls: [],
  });

  // Cache hit
  let script = await cache.get("https://example.com/foo.js");
  assertEquals(script, {
    url: "https://example.com/foo.js",
    redirectedUrl: "https://example.com/script/foo.js",
    contentType: "text/javsacript",
    source: "console.log('foo');",
    dependencyUrls: [],
  });

  // Cache miss
  script = await cache.get("https://example.com/bar.js");
  assertEquals(script, null);

  await Deno.remove(tmpdir, { recursive: true });
});
