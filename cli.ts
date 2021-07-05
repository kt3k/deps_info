import { parse } from "https://deno.land/std@0.100.0/flags/mod.ts";
import { getDependencyScriptSet, printDependencyGraph } from "./mod.ts";
import { toFileUrl, resolve } from "https://deno.land/std@0.100.0/path/mod.ts";

const NAME = "deps_info";
const VERSION = "v0.0.1";

function usage() {
  console.log(`Usage: ${NAME} <entrypoint>

Options:
  -h, --help              Shows the help message
  -v, --version           Shows the version number
  --json                  Shows the dependency info in json format. This json format is
                          not compatible with 'deno info --json' output.

Example:
  ${NAME} https://esm.sh/react
               Shows the dependencies of the remote script 'https://esm.sh/react'
  ${NAME} example.ts
               Shows the dependencies of the local script 'example.ts'

  ${NAME} --json https://esm.sh/react
               Shows the dependencies of the remote script 'https://esm.sh/react' in json format
`)
}

type CliArgs = {
  help: boolean;
  version: boolean;
  json: boolean;
  _: string[];
}

export async function main(args: string[]): Promise<number> {
  const {
    help,
    version,
    json,
    _,
  } = parse(args, {
    boolean: ["help", "version", "json"],
    alias: {
      h: "help",
      v: "version",
    },
  }) as CliArgs;

  if (help) {
    usage();
    return 0;
  }

  if (version) {
    console.log(`${NAME}@${VERSION}`);
    return 0;
  }

  let [param] = _
  if (!param) {
    console.log("Error: The entyrpoint is not given");
    usage();
    return 1;
  }
  const isUrl = param.startsWith("https://") || param.startsWith("http://") || param.startsWith("file://");
  const input = isUrl ? param : toFileUrl(resolve(param)).href;

  if (json) {
    await showInfoJson(input);
  } else {
    await showInfo(input);
  }
  return 0;
}

async function showInfo(url: string) {
  const scriptSet = await getDependencyScriptSet(url);
  printDependencyGraph(url, scriptSet);
}

async function showInfoJson(url: string) {
  const scriptSet = await getDependencyScriptSet(url);
  console.log(JSON.stringify(scriptSet.scripts, null, 2));
}

Deno.exit(await main(Deno.args));