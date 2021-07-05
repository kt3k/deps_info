import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.100.0/testing/asserts.ts";
import { getDependencyScriptSet, getDeps } from "./mod.ts";
import { resolve, toFileUrl } from "https://deno.land/std@0.100.0/path/mod.ts";

const toUrl = (p: string) => toFileUrl(resolve(p)).href;

Deno.test("getDependencyScriptSet", async () => {
  const scriptSet = await getDependencyScriptSet(
    "https://jspm.dev/jsdom@16.6.0",
  );
  assertEquals(scriptSet.length, 265);
});

Deno.test("getDependencyScriptSet various file ext", async () => {
  const scriptSet = await getDependencyScriptSet(toUrl("./testdata/foo.ts"));
  assert(scriptSet.has(toUrl("./testdata/bar.css")));
  assert(scriptSet.has(toUrl("./testdata/baz.jsx")));
  assert(scriptSet.has(toUrl("./testdata/qux.tsx")));
});

Deno.test("getDeps", async () => {
  const scripts = await getDeps(toUrl("./testdata/foo.ts"));
  assert(Array.isArray(scripts));
});
