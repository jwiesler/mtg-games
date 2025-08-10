import { type ZodSafeParseResult } from "zod";

export function BadRequest(text: string) {
  console.log(text);
  return new Response("Bad request", { status: 400, statusText: text });
}

export function NotFound() {
  return new Response("Not found", { status: 404 });
}

export function Validated<T>(r: ZodSafeParseResult<T>) {
  if (r.success) {
    return r.data;
  }
  if (import.meta.env.DEV) {
    throw r.error;
  }
  throw BadRequest("Failed to validate input");
}
