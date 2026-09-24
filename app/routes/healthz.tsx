import prisma from "~/db.server";

export async function loader() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return new Response("ok", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch {
    return new Response("database unavailable", {
      status: 503,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}
