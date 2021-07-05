import { getDependencyScriptSet, printDependencyGraph } from "./mod.ts";

try {
  const url = "https://jspm.dev/jsdom@16.6.0";
  const scriptSet = await getDependencyScriptSet(url);
  console.log(scriptSet.scripts);
  console.log(scriptSet.length);
  printDependencyGraph(url, scriptSet);
} catch (e) {
  console.log(e);
  console.log(e.errors);
}
