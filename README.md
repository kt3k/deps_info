# deps_info v0.0.1

> An alternative to `deno info`, supports non-standard file imports, such as
> .css, .svg, etc

# APIs

## getDeps

```ts
import { getDeps } from "https://raw.githubusercontent.com/kt3k/deps_info/main/mod.ts";

const scripts = await getDeps("https://jspm.dev/jsdom");
```

`scripts` has the type of `Script[]`, where `Script` has the shape below:

```ts
export interface Script {
  url: string;
  redirectedUrl: string;
  contentType: string;
  source: string;
  dependencyUrls: string[];
}
```

`getDeps` doesn't throw even when the script imports a file with unknown media
type.

foo.js

```
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
await getDeps("./foo.js");
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

```
const scripts = await getDeps("https://jspm.dev/jsdom", "/path/to/cache/directory");
```

# CLI

The command below installs the cli version of this tool.

```
deno install -qf --allow-read --allow-write=. --allow-net --name deps_info https://raw.githubusercontent.com/kt3k/deps_info/main/cli.ts
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
