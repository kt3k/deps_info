import { extname } from "https://deno.land/std@0.100.0/path/mod.ts";

export const getMimeTypeFromContentType = (c: string | null): string | null => {
  if (c === null) {
    return null;
  }

  const m = c.match(/(^[^;]+);/);
  if (m) {
    return m[1];
  }
  return c;
};

export function isJavaScript(contentType: string | null, url: string) {
  const mimeType = getMimeTypeFromContentType(contentType);
  switch (mimeType) {
    case "text/javascript":
    case "application/javascript":
      return true;
    default:
      break;
  }

  switch (extname(url)) {
    case ".js":
    case ".mjs":
      return true;
    default:
      return false;
  }
}

export function isTypeScript(contentType: string | null, url: string): boolean {
  const mimeType = getMimeTypeFromContentType(contentType);
  switch (mimeType) {
    case "text/typescript":
    case "application/typescript":
      return true;
    default:
      break;
  }

  switch (extname(url)) {
    case ".ts":
      return true;
    default:
      return false;
  }
}

export function isTsx(contentType: string | null, url: string): boolean {
  const mimeType = getMimeTypeFromContentType(contentType);
  switch (mimeType) {
    case "text/tsx":
    case "application/tsx":
      return true;
    default:
      break;
  }

  switch (extname(url)) {
    case ".tsx":
      return true;
    default:
      return false;
  }
}

export function isJsx(contentType: string | null, url: string): boolean {
  const mimeType = getMimeTypeFromContentType(contentType);
  switch (mimeType) {
    case "text/jsx":
    case "application/jsx":
      return true;
    default:
      break;
  }

  switch (extname(url)) {
    case ".jsx":
      return true;
    default:
      return false;
  }
}

export function isCss(contentType: string | null, url: string): boolean {
  const mimeType = getMimeTypeFromContentType(contentType);
  switch (mimeType) {
    case "text/css":
      return true;
    default:
      break;
  }

  switch (extname(url)) {
    case ".css":
      return true;
    default:
      return false;
  }
}
