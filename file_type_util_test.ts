import { assertEquals } from "https://deno.land/std@0.100.0/testing/asserts.ts";
import { getMimeTypeFromContentType as getMime } from "./file_type_util.ts";

Deno.test("getMimeTypeFromContentType", () => {
  assertEquals(getMime("text/javascript; charset=utf-8"), "text/javascript");
  assertEquals(getMime("text/javascript"), "text/javascript");
  assertEquals(getMime(null), null);
});
