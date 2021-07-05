/// <reference path="./d.ts" />
import "./bar.css";
import { baz } from "./baz.jsx";
import { qux } from "./qux.tsx";

console.log("foo");
console.log(baz());
console.log(qux());
