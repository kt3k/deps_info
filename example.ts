import { getDependencyScriptSet } from "./mod.ts";
import { resolve, toFileUrl } from "https://deno.land/std@0.100.0/path/mod.ts";

const r = (p: string) => toFileUrl(resolve(p)).href;
try {
  // const scriptSet = await getDependencyScriptSet(r("./testdata/foo.ts"));
  const scriptSet = await getDependencyScriptSet(
    "https://jspm.dev/jsdom@16.6.0",
  );
  console.log(scriptSet.scripts);
  console.log(scriptSet.length);
} catch (e) {
  console.log(e);
  console.log(e.errors);
}
