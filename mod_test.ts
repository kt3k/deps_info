import { assertEquals } from "https://deno.land/std@0.100.0/testing/asserts.ts";
import { getDependencyScriptSet } from "./mod.ts";

Deno.test("getDependencyScriptSet", async () => {
  const scriptSet = await getDependencyScriptSet(
    "https://jspm.dev/jsdom@16.6.0",
  );
  assertEquals(scriptSet.length, 265);
});
