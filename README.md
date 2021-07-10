# deps_info v0.1.1

> An alternative to `deno info`, supports non-standard file imports, such as
> .css, .svg, etc

# APIs

## `getDeps(url: string, cacheRoot: string): Promise<ScriptSet>`

```ts
import { getDeps } from "https://deno.land/x/deps_info@v0.1.1/mod.ts";

const scriptSet = await getDeps("https://jspm.dev/jsdom");
```

## ScriptSet

ScriptSet has the following methods.

```
class ScriptSet
  add(script: Script)
  has(url: string): boolean
  get(url: string): Script | undefined
  get length()
  get scripts()
  async loadDeps(url: string): Promise<void>
```

You can load further dependency scripts by calling
`scriptSet.loadDeps(url)`.

```ts
const scriptSet = await getDeps("https://jspm.dev/jsdom");
await scriptSet.loadDeps("https://esm.sh/react");
await scriptSet.loadDeps("https://esm.sh/react-dom");
...
```

In the above APIs, `Script` has the shape below:

```ts
export interface Script {
  url: string;
  redirectedUrl: string;
  contentType: string;
  source: string;
  dependencyUrls: string[];
}
```

This module doesn't throw even when the script imports a file with unknown media
type.

foo.js

```js
import "bar.css";
console.log("foo");
```

bar.css

```
body {
  margin: 0;
}
```

```ts
(await getDeps("./foo.js")).scripts;
/* This returns:
[
  {
    "url": "file:///Users/kt3k/oss/deps_info/foo.js",
    "redirectedUrl": "file:///Users/kt3k/oss/deps_info/foo.js",
    "contentType": "text/javascript",
    "source": "import \"./bar.css\";\nconsole.log(\"foo\");\n",
    "dependencyUrls": [
      "file:///Users/kt3k/oss/deps_info/bar.css"
    ]
  },
  {
    "url": "file:///Users/kt3k/oss/deps_info/bar.css",
    "redirectedUrl": "file:///Users/kt3k/oss/deps_info/bar.css",
    "contentType": "text/css",
    "source": "body {\n  margin: 0;\n}\n",
    "dependencyUrls": []
  }
]
*/
```

`getDeps` uses `./.deps_info_cache` by default as the cache directory for
donwloaded files. You can change this by passing it as the 2nd argument.

```ts
const scripts = await getDeps(
  "https://jspm.dev/jsdom",
  "/path/to/cache/directory",
);
```

# CLI

The command below installs the cli version of this tool.

```
deno install -qf --allow-read --allow-write=. --allow-net --name deps_info https://deno.land/x/deps_info@v0.1.1/cli.ts
```

You can show the dependencies in tree format in the terminal.

```
$ deps_info https://deno.land/std/path/mod.ts
Download https://deno.land/std/path/mod.ts
Download https://deno.land/std@0.100.0/path/win32.ts
Download https://deno.land/std@0.100.0/path/glob.ts
Download https://deno.land/std@0.100.0/_util/os.ts
Download https://deno.land/std@0.100.0/path/_interface.ts
Download https://deno.land/std@0.100.0/path/posix.ts
Download https://deno.land/std@0.100.0/path/common.ts
Download https://deno.land/std@0.100.0/path/separator.ts
Download https://deno.land/std@0.100.0/path/_util.ts
Download https://deno.land/std@0.100.0/path/_constants.ts
Download https://deno.land/std@0.100.0/path/_constants.ts
Download https://deno.land/std@0.100.0/path/_util.ts
Download https://deno.land/std@0.100.0/_util/assert.ts
https://deno.land/std/path/mod.ts
├── https://deno.land/std@0.100.0/_util/os.ts
├─┬ https://deno.land/std@0.100.0/path/win32.ts
│ ├── https://deno.land/std@0.100.0/path/_interface.ts
│ ├── https://deno.land/std@0.100.0/path/_constants.ts
│ ├─┬ https://deno.land/std@0.100.0/path/_util.ts
│ │ ├── https://deno.land/std@0.100.0/path/_interface.ts
│ │ └── https://deno.land/std@0.100.0/path/_constants.ts
│ └── https://deno.land/std@0.100.0/_util/assert.ts
├─┬ https://deno.land/std@0.100.0/path/posix.ts
│ ├── https://deno.land/std@0.100.0/path/_interface.ts
│ ├── https://deno.land/std@0.100.0/path/_constants.ts
│ └── https://deno.land/std@0.100.0/path/_util.ts
├─┬ https://deno.land/std@0.100.0/path/common.ts
│ └─┬ https://deno.land/std@0.100.0/path/separator.ts
│   └── https://deno.land/std@0.100.0/_util/os.ts
├── https://deno.land/std@0.100.0/path/separator.ts
├── https://deno.land/std@0.100.0/path/_interface.ts
└─┬ https://deno.land/std@0.100.0/path/glob.ts
  ├── https://deno.land/std@0.100.0/_util/os.ts
  ├── https://deno.land/std@0.100.0/path/separator.ts
  ├── https://deno.land/std@0.100.0/path/win32.ts
  └── https://deno.land/std@0.100.0/path/posix.ts
```

# License

MIT
