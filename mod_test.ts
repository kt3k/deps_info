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
  let scripts = await getDeps("https://esm.sh/react@17.0.2");
  scripts = scripts.map((s) => ({ ...s, source: "" }));
  assertEquals(scripts, [
    {
      "url": "https://esm.sh/react@17.0.2",
      "redirectedUrl": "https://esm.sh/react@17.0.2",
      "contentType": "application/javascript; charset=utf-8",
      "source": "",
      "dependencyUrls": [
        "https://cdn.esm.sh/v43/react@17.0.2/deno/react.js",
      ],
    },
    {
      "url": "https://cdn.esm.sh/v43/react@17.0.2/deno/react.js",
      "redirectedUrl": "https://cdn.esm.sh/v43/react@17.0.2/deno/react.js",
      "contentType": "application/javascript",
      "source": "",
      "dependencyUrls": [
        "https://cdn.esm.sh/v43/object-assign@4.1.1/deno/object-assign.js",
      ],
    },
    {
      "url": "https://cdn.esm.sh/v43/object-assign@4.1.1/deno/object-assign.js",
      "redirectedUrl":
        "https://cdn.esm.sh/v43/object-assign@4.1.1/deno/object-assign.js",
      "contentType": "application/javascript",
      "source": "",
      "dependencyUrls": [],
    },
  ]);
});
