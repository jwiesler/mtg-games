import { data } from "react-router";
import { type ZodSafeParseResult } from "zod";

// The message is sent in the body, as HTTP/2 doesn't transmit status texts.
export function BadRequest(text: string) {
  return new Response(text, { status: 400 });
}

export function NotFound() {
  return new Response("Not found", { status: 404 });
}

// An error that is shown to the user as a notification.
export function ActionError(message: string) {
  return data(
    { type: "error" as const, key: `error-${Date.now()}`, message },
    { status: 400 },
  );
}

export function Validated<T>(r: ZodSafeParseResult<T>) {
  if (r.success) {
    return r.data;
  }
  if (import.meta.env.DEV) {
    throw r.error;
  }
  throw BadRequest("Ungültige Eingabe");
}
