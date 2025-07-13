export function BadRequest(text: string) {
  return new Response("Bad request", { status: 400, statusText: text });
}

export function NotFound() {
  return new Response("Not found", { status: 404 });
}
